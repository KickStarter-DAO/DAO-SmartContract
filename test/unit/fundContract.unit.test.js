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
        projectOwnerIndex,
        governor,
        timeLock,
        proposalState,
        projectId,
        blockNumber,
        deployer,
        investor;
      const provider = ethers.getDefaultProvider();
      beforeEach(async () => {
        account1 = (await ethers.getSigners())[1];
        account2 = (await ethers.getSigners())[2];
        account3 = (await ethers.getSigners())[3];
        projectOwner = (await ethers.getSigners())[4];
        investor = (await ethers.getSigners())[5];
        deployer = (await getNamedAccounts()).deployer;

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

        const { upkeepNeeded } = await governor.checkUpkeep([]);
        assert(!upkeepNeeded);

        const projectOwnerConnect = governor.connect(projectOwner);
        const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
        projectOwnerIndex = await projectOwnerConnect.getCurrentProjectId();

        const encodedFunctionCall =
          projectOwnerConnect.interface.encodeFunctionData(FUNC_FUND, [
            args,
            s_fundRaisingGoalAmount,
            s_fundingTime,
            projectOwnerIndex,
          ]);

        const enteranceFee = await projectOwnerConnect.getEnteranceFee();

        const payFee = await projectOwnerConnect.paySubmitFee({
          value: enteranceFee,
        });
        await payFee.wait(1);

        const proposalTx = await projectOwnerConnect.propose(
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

        const investorConnectContract = governor.connect(investor);

        const invTx = await investorConnectContract.fund(projectId, {
          value: invest,
        });
        expect().to.emit(governor, "enteranceFeePaid");
        await invTx.wait(1);

        assert.equal(
          (
            await investorConnectContract.getFunderBalance(projectId)
          ).toString(),
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
        it("time has to pass to finish funding ", async () => {
          const { upkeepNeeded1 } = await governor.checkUpkeep([]);
          assert(!upkeepNeeded1);
          await moveTime(s_fundingTime + 1);
          await moveBlocks(1);
          const { upkeepNeeded, performData } = await governor.checkUpkeep([]);
          assert(upkeepNeeded);
          console.log(performData);
        });
      });
      describe("performUpKeep", () => {
        it("only call perfomUpKeep when its time", async () => {
          await expect(governor.performUpkeep([])).to.be.revertedWith(
            "FundProject__UpkeepNeeded"
          );

          await moveTime(s_fundingTime + 1);
          await moveBlocks(1);

          const tx = await governor.performUpkeep([]);
          assert(tx);
        });

        it("checking funding process", async () => {
          const invest = ethers.utils.parseUnits("10", "ether");
          const projectOwnerConnect = await governor.connect(projectOwner);
          const projectOwnerBalanceBefore =
            await projectOwnerConnect.provider.getBalance(projectOwner.address);
          console.log(
            ethers.utils.formatEther(projectOwnerBalanceBefore).toString()
          );

          const investorConnectContract = await governor.connect(investor);
          console.log(
            ` investorBalanceBefore = ${ethers.utils
              .formatEther(
                await investorConnectContract.provider.getBalance(
                  investor.address
                )
              )
              .toString()}`
          );
          const invTx = await investorConnectContract.fund(projectId, {
            value: invest,
          });

          await invTx.wait(1);
          console.log(
            ` investorBalanceAfter = ${ethers.utils
              .formatEther(
                await investorConnectContract.provider.getBalance(
                  investor.address
                )
              )
              .toString()}`
          );

          assert.equal(
            (
              await investorConnectContract.getFunderBalance(projectId)
            ).toString(),
            invest.toString()
          );

          await moveTime(s_fundingTime + 1);
          await moveBlocks(1);
          await expect(
            governor.performUpkeep(
              ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)
            )
          ).to.emit(governor, "projectSuccessfullyFunded");

          const projectOwnerBalanceAfter =
            await projectOwnerConnect.provider.getBalance(projectOwner.address);
          console.log(
            ethers.utils.formatEther(projectOwnerBalanceAfter).toString()
          );

          assert.equal(await governor.is_funding(projectId), false);
          assert.equal(
            await governor._isApporoveFundingByDao(projectId),
            false
          );

          assert.equal(await governor._getProjectStatus(projectId), "1");

          assert.equal(
            (await governor._getBalanceOfProject(projectId)).toString(),
            "0"
          );
        });
        it("Failed funding try to withdraw", async () => {
          await ethers.getContract("GovernerContract", investor);
          const beforeInvestBalance = await investor.getBalance();
          console.log(beforeInvestBalance.toString());
          const invTx = await governor.fund(projectId, { value: 100 });
          await invTx.wait(1);
          const afterInvestBalance = await investor.getBalance();
          console.log(afterInvestBalance.toString());
          await moveTime(s_fundingTime + 1);
          await moveBlocks(1);

          await expect(
            governor.performUpkeep(
              ethers.utils.hexZeroPad(ethers.utils.hexlify(1), 32)
            )
          ).to.emit(governor, "projectFundingFailed");

          assert.equal(await governor.is_funding(projectId), false);
          assert.equal(
            await governor._isApporoveFundingByDao(projectId),
            false
          );
          assert.equal(await governor._getProjectStatus(projectId), "2");
          await expect(governor.withdrawFund(projectId)).to.emit(
            governor,
            "withdrawFundSuccessfully"
          );
        });
      });
    });
