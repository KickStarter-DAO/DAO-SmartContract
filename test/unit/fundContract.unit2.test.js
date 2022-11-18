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
  : describe("FundProject Unit Tests 2 ", async () => {
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
      it("Cancel approve by dao", async () => {
        // cancelApporovelFundingByDao
        deployer = await ethers.getSigner(deployer);
        const deployerConnect = governor.connect(deployer);
        const encodedFunctionCall =
          deployerConnect.interface.encodeFunctionData(
            "cancelApporovelFundingByDao",
            [1]
          );

        const enteranceFee = await deployerConnect.getEnteranceFee();

        const payFee = await deployerConnect.paySubmitFee({
          value: enteranceFee,
        });
        await payFee.wait(1);

        const proposalTx = await deployerConnect.propose(
          [governor.address],
          [0],
          [encodedFunctionCall],
          1
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
          ethers.utils.toUtf8Bytes(1)
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

        assert.equal(
          (await governor._getProjectStatus(projectId)).toString(),
          "3"
        );
        assert.equal(
          (await governor._isApporoveFundingByDao(projectId)).toString(),
          "false"
        );
        assert.equal(
          (await governor.is_funding(projectId)).toString(),
          "false"
        );
      });
    });
