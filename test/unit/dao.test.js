const { ethers, deployments, getNamedAccounts, network } = require("hardhat");

const { assert, expect } = require("chai");

const {
  FUNC,
  NEW_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  VOTING_PERIOD,
} = require("../../helper-config");
const { moveBlocks } = require("../../utils/move-blocks");
const fs = require("fs");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Unit tests", () => {
      let gtToken,
        account1,
        account2,
        account3,
        governor,
        timeLock,
        box,
        blockNumber;
      beforeEach(async function () {
        account1 = (await ethers.getSigners())[1];
        account2 = (await ethers.getSigners())[2];
        account3 = (await ethers.getSigners())[3];
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture("all");
        gtToken = await ethers.getContract("GovernanceToken");
        governor = await ethers.getContract("GovernerContract");
        timeLock = await ethers.getContract("TimeLock");
        box = await ethers.getContract("Box");

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

        gtToken = await ethers.getContract("GovernanceToken", account1.address);
        tx1 = await gtToken.delegate(account1.address);
        await tx1.wait(1);
        gtToken = await ethers.getContract("GovernanceToken", account2.address);
        tx1 = await gtToken.delegate(account2.address);
        gtToken = await ethers.getContract("GovernanceToken", account3.address);
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
      });

      it("was deployed", async () => {
        assert(gtToken.address);
        assert(governor.address);
        assert(timeLock.address);
        assert(box.address);
      });

      it("Only Owner can mint token", async () => {
        // console.log((await gtToken.balanceOf(deployer)).toString());
        gtToken = await ethers.getContract("GovernanceToken", deployer);
        const tx = await gtToken.mintToken(
          deployer,
          ethers.BigNumber.from("1000000000000000000000000")
        );
        await tx.wait(1);

        // console.log((await gtToken.balanceOf(deployer)).toString());

        expect((await gtToken.balanceOf(deployer)).toString()).to.equal(
          "1100000000000000000000000"
        );
        gtToken = await ethers.getContract("GovernanceToken", account1.address);

        await expect(
          gtToken.mintToken(
            account1.address,
            ethers.BigNumber.from("1000000000000000000000000")
          )
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("can only be changed through governance", async () => {
        await expect(box.store(55)).to.be.revertedWith(
          "Ownable: caller is not the owner"
        );
      });

      //--------------------------------------------------------------------------------

      describe("proposes, votes, waits, queues, and then executesxx", async () => {
        it("Create a purposal make a vote", async () => {
          const encodedFunctionCall = box.interface.encodeFunctionData(FUNC, [
            NEW_VALUE,
          ]);

          const proposalTx = await governor.propose(
            [box.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
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
          await moveBlocks(VOTING_DELAY + 1);
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
          // connect with account1
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
          console.log(
            `Vote on against: ${ethers.utils.formatEther(againstVotes)}`
          );
          console.log(`Vote on for: ${ethers.utils.formatEther(forVotes)}`);
          console.log(
            `Vote on abstain: ${ethers.utils.formatEther(abstainVotes)}`
          );
        });
      });
    });
