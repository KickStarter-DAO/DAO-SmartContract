const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");

const {
  FUNC_FUND,
  NEW_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  VOTING_PERIOD,
  MIN_DELAY,
  FUNC_CANCEL_APPOROVEL,
} = require("../../helper-config");
const { moveBlocks } = require("../../utils/move-blocks");
const { moveTime } = require("../../utils/move-time");
const fs = require("fs");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Unit tests of fundingContract", () => {
      let gtToken,
        account1,
        account2,
        account3,
        investor,
        governor,
        timeLock,
        fundProjectContract,
        blockNumber;

      beforeEach(async function () {
        account1 = (await ethers.getSigners())[1];
        account2 = (await ethers.getSigners())[2];
        account3 = (await ethers.getSigners())[3];
        investor = (await ethers.getSigners())[4];
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture("all");
        gtToken = await ethers.getContract("GovernanceToken");
        governor = await ethers.getContract("GovernerContract");
        timeLock = await ethers.getContract("TimeLock");
        fundProjectContract = await ethers.getContract("FundProject");

        gtToken = await ethers.getContract("GovernanceToken", deployer);
      });

      it("was deployed", async () => {
        assert(fundProjectContract.address);
      });

      describe("proposes after submit ", async () => {
        it("Create a purposal make a vote", async () => {
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

          console.log(
            `Account1 balance= ${ethers.utils
              .formatEther(await gtToken.balanceOf(account1.address))
              .toString()}`
          );
          console.log(
            `Account2 balance= ${ethers.utils
              .formatEther(await gtToken.balanceOf(account2.address))
              .toString()}`
          );

          console.log(
            `Account3 balance= ${ethers.utils
              .formatEther(await gtToken.balanceOf(account3.address))
              .toString()}`
          );

          gtToken = await ethers.getContract(
            "GovernanceToken",
            account1.address
          );
          tx1 = await gtToken.delegate(account1.address);
          await tx1.wait(1);
          gtToken = await ethers.getContract(
            "GovernanceToken",
            account2.address
          );
          tx1 = await gtToken.delegate(account2.address);
          gtToken = await ethers.getContract(
            "GovernanceToken",
            account3.address
          );
          tx1 = await gtToken.delegate(account3.address);
          await tx1.wait(1);

          moveBlocks(1);

          blockNumber = await ethers.provider.getBlockNumber();
          console.log(
            `account1 voting power : ${await governor.getVotes(
              account1.address,
              blockNumber - 1
            )}`
          );
          console.log(
            `account2 voting power : ${await governor.getVotes(
              account2.address,
              blockNumber - 1
            )}`
          );
          console.log(
            `account3 voting power : ${await governor.getVotes(
              account3.address,
              blockNumber - 1
            )}`
          );
          const fundRaisingAmount = "1000";
          const proposalDescription =
            "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
          const encodedFunctionCall =
            fundProjectContract.interface.encodeFunctionData(FUNC_FUND, [
              proposalDescription,
              fundRaisingAmount,
            ]);

          const proposalTx = await governor.propose(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCall],
            proposalDescription
          );
          const proposeReceipt = await proposalTx.wait(1);

          console.log(
            `Purposal start Block number= ${await ethers.provider.getBlockNumber()}`
          );
          const proposalId = proposeReceipt.events[0].args.proposalId;
          let proposalState = await governor.state(proposalId);

          const deadline = await governor.proposalDeadline(proposalId);
          console.log(`Proposal deadline on block ${deadline.toString()}`);

          console.log(`Current Proposal State: ${proposalState}`);
          /*   enum ProposalState {
                Pending,
                Active,
                Canceled,
                Defeated,
                Succeeded,
                Queued,
                Expired,
                Executed
                } */
          expect(proposalState == 1);

          await moveBlocks(VOTING_DELAY + 1);
          blockNumber = await ethers.provider.getBlockNumber();

          console.log(
            `account1 voting power : ${await governor.getVotes(
              account1.address,
              blockNumber - 1
            )}`
          );
          console.log(
            `account2 voting power : ${await governor.getVotes(
              account2.address,
              blockNumber - 1
            )}`
          );
          console.log(
            `account3 voting power : ${await governor.getVotes(
              account3.address,
              blockNumber - 1
            )}`
          );

          console.log(
            `after voting delay Block number= ${await ethers.provider.getBlockNumber()}`
          );

          // connect with account1
          governor = await ethers.getContract(
            "GovernerContract",
            account1.address
          );
          // voting...
          // 0 = Against, 1 = For, 2 = Abstain
          let voteTxResponse = await governor.castVote(proposalId, 1);
          await voteTxResponse.wait(1);
          console.log(
            `after voting account1 Block number= ${await ethers.provider.getBlockNumber()}`
          );
          /* const hasVoted = await governor.hasVoted(
            proposalId,
            account1.address
          );
          console.log(`account1 hasVoted: ${hasVoted}`); */

          console.log(
            `after voting period Block number= ${await ethers.provider.getBlockNumber()}`
          );

          // voting with account 2 ************************************************

          // connect with account2
          const governor1 = await ethers.getContract(
            "GovernerContract",
            account2.address
          );

          const voteTxResponse1 = await governor1.castVote(proposalId, 0);
          await voteTxResponse1.wait(1);
          console.log(
            `after voting account2 Block number= ${await ethers.provider.getBlockNumber()}`
          );

          /*  const hasVoted2 = await governor.hasVoted(
            proposalId,
            account2.address
          );
          console.log(`account2 hasVoted: ${hasVoted2}`); */

          // account3 is voting ********************************************************** */
          // connect with account3
          governor = await ethers.getContract(
            "GovernerContract",
            account3.address
          );
          // voting...
          // 0 = Against, 1 = For, 2 = Abstain
          voteTxResponse = await governor.castVote(proposalId, 1);

          // finish the voting
          await moveBlocks(VOTING_PERIOD + 1);

          proposalState = await governor.state(proposalId);
          console.log(`Current Proposal State: ${proposalState}`);

          // getting to results
          const { againstVotes, forVotes, abstainVotes } =
            await governor.proposalVotes(proposalId);
          console.log(`ProposalId = ${proposalId}`);
          console.log(
            `Vote on against: ${ethers.utils.formatEther(againstVotes)}`
          );
          console.log(`Vote on for: ${ethers.utils.formatEther(forVotes)}`);
          console.log(
            `Vote on abstain: ${ethers.utils.formatEther(abstainVotes)}`
          );

          assert.equal(proposalState.toString(), "4");

          // its time to queue & execute

          const descriptionHash = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(proposalDescription)
          );
          governor = await ethers.getContract("GovernerContract");
          console.log("Queueing...");

          const queueTx = await governor.queue(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
          );
          await queueTx.wait(1);
          await moveTime(MIN_DELAY + 1);
          await moveBlocks(1);
          console.log("Executing...");
          const executeTx = await governor.execute(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
          );
          await executeTx.wait(1);
          const projectId = await fundProjectContract._getProjectId(
            proposalDescription
          );
          console.log("Executed!");
          const fundable = await fundProjectContract._isApporoveFundingByDao(
            projectId
          );

          assert(fundable);

          // try to invest
          console.log("Trying to invest...");
          const fundProject = await ethers.getContract("FundProject", investor);
          const sendValue = ethers.utils.parseEther("0.1");

          const tx = await fundProject.fund(projectId, { value: sendValue });
          await tx.wait(1);

          const balance = await fundProjectContract._getBalanceOfProject(
            projectId
          );
          const fundingGoal = await fundProjectContract._getFundingGoalAmount(
            projectId
          );
          console.log(`Funding goal amount: ${fundingGoal}`);
          const balanceInEth = ethers.utils.formatEther(balance);
          //console.log(balanceInEth);
          assert.equal(balanceInEth, "0.1");
          console.log("Invested!");

          // try to cancel the apporevel

          const encodedFunctionCallForCancelApprovevel =
            fundProjectContract.interface.encodeFunctionData(
              FUNC_CANCEL_APPOROVEL,
              [projectId]
            );

          const proposalTxCancelApprovevel = await governor.propose(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCallForCancelApprovevel],
            proposalDescription
          );
          const proposeReceiptCancelApprovel =
            await proposalTxCancelApprovevel.wait(1);

          console.log(
            `Purposal start Block number= ${await ethers.provider.getBlockNumber()}`
          );
          const proposalIdCancel =
            proposeReceiptCancelApprovel.events[0].args.proposalId;
          proposalState = await governor.state(proposalIdCancel);
          console.log(`CancelProposalId = ${proposalIdCancel}`);
          const deadlineCancel = await governor.proposalDeadline(
            proposalIdCancel
          );
          console.log(
            `Proposal deadline on block ${deadlineCancel.toString()}`
          );

          console.log(`Current Proposal State: ${proposalState}`);
          expect(proposalState == 1);

          await moveBlocks(VOTING_DELAY + 1);
          proposalState = await governor.state(proposalIdCancel);
          console.log(`Current Proposal State: ${proposalState}`);
          // connect with account1
          governor = await ethers.getContract(
            "GovernerContract",
            account1.address
          );
          // voting...
          // 0 = Against, 1 = For, 2 = Abstain
          voteTxResponse = await governor.castVote(proposalIdCancel, 1);
          await voteTxResponse.wait(1);

          // voting with account 2 ************************************************

          // connect with account2
          governor = await ethers.getContract(
            "GovernerContract",
            account2.address
          );

          voteTxResponse = await governor1.castVote(proposalIdCancel, 0);
          await voteTxResponse.wait(1);

          // account3 is voting ********************************************************** */
          // connect with account3
          governor = await ethers.getContract(
            "GovernerContract",
            account3.address
          );
          // voting...
          // 0 = Against, 1 = For, 2 = Abstain
          voteTxResponse = await governor.castVote(proposalIdCancel, 1);

          // finish the voting
          await moveBlocks(VOTING_PERIOD + 1);

          proposalState = await governor.state(proposalIdCancel);
          console.log(`Current Proposal State: ${proposalState}`);

          // getting to results
          const { againstVotesCancel, forVotesCancel, abstainVotesCancel } =
            await governor.proposalVotes(proposalIdCancel);
          /* console.log(`Vote on against: ${againstVotesCancel}`);
          console.log(`Vote on for: ${forVotesCancel}`);
          console.log(`Vote on abstain: ${abstainVotesCancel}`); */

          assert.equal(proposalState.toString(), "4");

          // its time to queue & execute

          const descriptionHashCancel = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(proposalDescription)
          );
          governor = await ethers.getContract("GovernerContract");
          console.log("Queueing...");

          const queueTxCancel = await governor.queue(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCallForCancelApprovevel],
            descriptionHashCancel
          );
          await queueTxCancel.wait(1);
          await moveTime(MIN_DELAY + 1);
          await moveBlocks(1);
          console.log("Executing...");
          const executeTxCancel = await governor.execute(
            [fundProjectContract.address],
            [0],
            [encodedFunctionCallForCancelApprovevel],
            descriptionHashCancel
          );
          await executeTxCancel.wait(1);
          const projectIdCancel = await fundProjectContract._getProjectId(
            proposalDescription
          );
          console.log("Executed!");
          const fundableCancel =
            await fundProjectContract._isApporoveFundingByDao(projectId);
          console.log(fundableCancel);
          assert(!fundableCancel);
        });
      });
    });
