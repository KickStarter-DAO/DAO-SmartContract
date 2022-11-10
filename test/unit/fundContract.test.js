const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  FUNC_FUND,
  developmentChains,
  VOTING_DELAY,
  VOTING_PERIOD,
  MIN_DELAY,
  s_fundingTime,
  s_fundRaisingGoalAmount,
} = require("../../helper-config");
const { moveBlocks } = require("../../utils/move-blocks");
const { moveTime } = require("../../utils/move-time");
const fs = require("fs");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundProject Unit Tests", async () => {
      let gtToken,
        account1,
        account2,
        account3,
        projectOwner,
        governor,
        timeLock,
        proposalState,
        projectId,
        blockNumber,
        investor;
      beforeEach(async () => {
        account1 = (await ethers.getSigners())[1];
        account2 = (await ethers.getSigners())[2];
        account3 = (await ethers.getSigners())[3];
        projectOwner = (await ethers.getSigners())[4];
        investor = (await ethers.getSigners())[5];
        deployer = (await getNamedAccounts()).deployer;
        projectOwner = deployer;

        await deployments.fixture("all");
        gtToken = await ethers.getContract("GovernanceToken");
        governor = await ethers.getContract("GovernerContract");
        timeLock = await ethers.getContract("TimeLock");
        gtToken = await ethers.getContract("GovernanceToken", deployer);

        let tx1 = await gtToken.transfer(
          account1.address,
          ethers.utils.parseEther("500000")
        );
        tx1 = await gtToken.transfer(
          account2.address,
          ethers.utils.parseEther("300000")
        );
        tx1 = await gtToken.transfer(
          account3.address,
          ethers.utils.parseEther("100000")
        );

        await tx1.wait(1);

        gtToken = await ethers.getContract("GovernanceToken", account1.address);
        tx1 = await gtToken.delegate(account1.address);
        await tx1.wait(1);
        gtToken = await ethers.getContract("GovernanceToken", account2.address);
        tx1 = await gtToken.delegate(account2.address);
        gtToken = await ethers.getContract("GovernanceToken", account3.address);
        tx1 = await gtToken.delegate(account3.address);
        await tx1.wait(1);

        moveBlocks(1);

        /*   const { upkeepNeeded } = await governor.checkUpkeep([]);
        assert(!upkeepNeeded); */

        await ethers.getContract("GovernanceToken", projectOwner);
        const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";

        const encodedFunctionCall = governor.interface.encodeFunctionData(
          FUNC_FUND,
          [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwner]
        );

        const enteranceFee = await governor.getEnteranceFee();

        await expect(
          governor.propose([governor.address], [0], [encodedFunctionCall], args)
        ).to.be.revertedWith("GovernerContract__NeedEnteranceFee");

        const payFee = await governor.paySubmitFee({ value: enteranceFee });
        await payFee.wait(1);

        const proposalTx = await governor.propose(
          [governor.address],
          [0],
          [encodedFunctionCall],
          args
        );
        const proposeReceipt = await proposalTx.wait(1);

        const proposalId = proposeReceipt.events[0].args.proposalId;
        await moveBlocks(VOTING_DELAY + 1);

        governor = await ethers.getContract(
          "GovernerContract",
          account1.address
        );
        let voteTxResponse = await governor.castVote(proposalId, 1);
        await voteTxResponse.wait(1);

        const governor1 = await ethers.getContract(
          "GovernerContract",
          account2.address
        );
        const voteTxResponse1 = await governor1.castVote(proposalId, 0);
        await voteTxResponse1.wait(1);

        governor = await ethers.getContract(
          "GovernerContract",
          account3.address
        );
        voteTxResponse = await governor.castVote(proposalId, 1);
        await moveBlocks(VOTING_PERIOD + 1);

        proposalState = await governor.state(proposalId);
        console.log(`End of voting: ${proposalState}`);
        assert.equal(proposalState.toString(), "4");

        // its time to queue & execute

        const descriptionHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(args)
        );
        governor = await ethers.getContract("GovernerContract");
        console.log("Queueing...");
        const queueTx = await governor.queue(
          [governor.address],
          [0],
          [encodedFunctionCall],
          descriptionHash
        );
        await queueTx.wait(1);
        console.log("Queued");
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
        console.log("Executing...");

        const executeTx = await governor.execute(
          [governor.address],
          [0],
          [encodedFunctionCall],
          descriptionHash
        );
        expect(executeTx).to.emit(governor, "projectGoesToFunding");
        await executeTx.wait(1);
        console.log("Executed!");

        projectId = await governor._getProjectId(args);
        console.log(`ProjectId = ${projectId.toString()}`);
      });

      it("constructorFund", async () => {
        assert.equal(
          (await governor.getEnteranceFee()).toString(),
          "10000000000000000"
        );

        assert.equal((await governor.getDaoPercentage()).toString(), "10");
      });

      it("test Funding project", async () => {
        assert(await governor._isApporoveFundingByDao(projectId));
        const invest = ethers.utils.parseUnits("1", "ether");

        await ethers.getContract("GovernerContract", investor);
        const invTx = await governor.fund(projectId, { value: invest });
        expect().to.emit(governor, "enteranceFeePaid");
        await invTx.wait(1);

        assert.equal(
          (await governor.getFunderBalance(projectId)).toString(),
          invest.toString()
        );

        await expect(governor.withdrawFund(projectId)).to.be.revertedWith(
          "FundProject__withdrawFund"
        );
        await expect(
          governor.cancelApporovelFundingByDao(projectId)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        assert.equal(await governor._getProjectStatus(projectId), "0");
        assert(await governor.projectFundingGoalAmount(projectId));

        assert.equal(
          (await governor._getHashOfProjectData(projectId)).toString(),
          "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu"
        );

        assert.equal(
          (
            await governor._getProjectId(
              "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu"
            )
          ).toString(),
          "1"
        );
        assert(await governor._isApporoveFundingByDao(projectId));
        assert(await governor.is_funding(projectId));
      });

      describe("checkUpkeep", async () => {
        it("return false if project hasnt submit", async () => {
          blockNumber = await ethers.provider.getBlockNumber();
          console.log(`Before ${blockNumber}`);
          await moveTime(s_fundingTime + 1);
          await moveBlocks(s_fundingTime + 1);
          blockNumber = await ethers.provider.getBlockNumber();
          console.log(`Before ${blockNumber}`);
          const { upkeepNeeded, performData } = await governor.checkUpkeep([]);
          const { a, b } = await governor.getTimeleft(projectId);
          console.log(`ProjectId = ${projectId}`);
          console.log(await governor.is_funding(projectId));
          console.log(a.toString(), b.toString());
          console.log(performData);
          // assert(!upkeepNeeded);
        });
      });
    });
