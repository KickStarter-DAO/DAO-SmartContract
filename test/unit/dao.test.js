const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  FUNC_FUND,
  developmentChains,
  VOTING_DELAY,
  VOTING_PERIOD,
  MIN_DELAY,
  INITIAL_SUPPLY,
  s_fundingTime,
  s_fundRaisingGoalAmount,
} = require("../../helper-config");
const { moveBlocks } = require("../../utils/move-blocks");
const { moveTime } = require("../../utils/move-time");
const fs = require("fs");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Unit tests", () => {
      let gtToken,
        account1,
        account2,
        account3,
        projectOwner,
        governor,
        timeLock,
        fund,
        blockNumber;
      beforeEach(async function () {
        account1 = (await ethers.getSigners())[1];
        account2 = (await ethers.getSigners())[2];
        account3 = (await ethers.getSigners())[3];
        projectOwner = (await ethers.getSigners())[4];
        deployer = (await getNamedAccounts()).deployer;

        await deployments.fixture("all");
        gtToken = await ethers.getContract("GovernanceToken");
        governor = await ethers.getContract("GovernerContract");
        timeLock = await ethers.getContract("TimeLock");

        gtToken = await ethers.getContract("GovernanceToken", deployer);
      });

      it("was deployed", async () => {
        assert(gtToken.address);

        assert(governor.address);
        assert(timeLock.address);
      });

      it("Only Dao can mint token", async () => {});

      it("can only be changed through governance", async () => {});

      //--------------------------------------------------------------------------------

      describe("proposes, votes, waits, queues, and then executes & queue & execute", async () => {
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
          const letsTry = await ethers.getContract(
            "GovernanceToken",
            projectOwner
          );
          const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
          const encodedFunctionCall = governor.interface.encodeFunctionData(
            FUNC_FUND,
            [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwner.address]
          );

          const enteranceFee = await governor.getEnteranceFee();

          /* await expect(
            governor.propose(
              [governor.address],
              [0],
              [encodedFunctionCall],
              args
            )
          ).to.be.revertedWith(`GovernerContract__NeedEnteranceFee`); */

          const payFee = await governor.paySubmitFee({ value: enteranceFee });
          await payFee.wait(1);

          const proposalTx = await governor.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            args
          );
          const proposeReceipt = await proposalTx.wait(1);

          console.log(
            `Purposal start Block number= ${await ethers.provider.getBlockNumber()}`
          );
          const proposalId = proposeReceipt.events[0].args.proposalId;
          let proposalState = await governor.state(proposalId);

          const deadline = await governor.proposalDeadline(proposalId);
          console.log(`Proposal deadline on block ${deadline.toString()}`);

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
          // console.log(`Current Proposal State: ${proposalState}`);

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
          await moveTime(MIN_DELAY + 1);
          await moveBlocks(1);
          console.log("Executing...");
          const executeTx = await governor.execute(
            [governor.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
          );
          await executeTx.wait(1);
        });

        it("Result of voting against", async () => {
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

          const letsTry = await ethers.getContract(
            "GovernanceToken",
            projectOwner
          );
          const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
          const encodedFunctionCall = governor.interface.encodeFunctionData(
            FUNC_FUND,
            [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwner.address]
          );

          const enteranceFee = await governor.getEnteranceFee();

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
          let proposalState = await governor.state(proposalId);

          const deadline = await governor.proposalDeadline(proposalId);

          expect(proposalState == 1);

          await moveBlocks(VOTING_DELAY + 1);
          blockNumber = await ethers.provider.getBlockNumber();

          // connect with account1
          governor = await ethers.getContract(
            "GovernerContract",
            account1.address
          );
          // voting...
          // 0 = Against, 1 = For, 2 = Abstain
          let voteTxResponse = await governor.castVote(proposalId, 0);
          await voteTxResponse.wait(1);

          // voting with account 2 ************************************************

          // connect with account2
          const governor1 = await ethers.getContract(
            "GovernerContract",
            account2.address
          );

          const voteTxResponse1 = await governor1.castVote(proposalId, 0);
          await voteTxResponse1.wait(1);

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

          assert.equal(proposalState.toString(), "3");

          // its time to queue & execute

          const descriptionHash = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(args)
          );
          governor = await ethers.getContract("GovernerContract");
          console.log("Queueing...");

          await expect(
            governor.queue(
              [governor.address],
              [0],
              [encodedFunctionCall],
              descriptionHash
            )
          ).to.be.revertedWith("Governor: proposal not successful");

          await moveTime(MIN_DELAY + 1);
          await moveBlocks(1);

          await expect(
            governor.execute(
              [governor.address],
              [0],
              [encodedFunctionCall],
              descriptionHash
            )
          ).to.be.revertedWith("Governor: proposal not successful");
        });
      });
      //******************************************************************************** */
      //Checking erc20 tokens ******************************** */

      describe("constructor", async () => {
        it("Check the initial supply", async () => {
          const iintial_supply = (await gtToken.totalSupply()).toString();
          //console.log(ethers.utils.formatEther(iintial_supply));
          assert.equal(INITIAL_SUPPLY, iintial_supply);
        });
        it("Name is correct", async () => {
          const tokenName = (await gtToken.name()).toString();
          assert.equal(tokenName, "GovernanceToken");
        });
        it("Symbol is correct", async () => {
          const tokenSymbol = (await gtToken.symbol()).toString();
          assert.equal(tokenSymbol, "GT");
        });
      });
      describe("tranfers", async () => {
        it("allow transfer to another address", async () => {
          const tokenToSend = ethers.utils.parseEther("10");
          //console.log(account1.address);
          const tx = await gtToken.transfer(account1.address, tokenToSend);
          assert(tx);
          expect(await gtToken.balanceOf(account1.address)).to.equal(
            tokenToSend
          );
        });
        it("emits an transfer event, when an transfer occurs", async () => {
          const tokenToSend = ethers.utils.parseEther("10");
          const tx = await gtToken.transfer(account1.address, tokenToSend);
          expect(tx).to.emit(gtToken, "Transfer");
        });

        describe("allowances", () => {
          beforeEach(async () => {
            userContract = await ethers.getContract(
              "GovernanceToken",
              account1.address
            );
          });
          it("Should approve other address to spend token", async () => {
            const tokenToSend = ethers.utils.parseEther("10");
            await gtToken.approve(account1.address, tokenToSend);
            const erc20_1 = await ethers.getContract(
              "GovernanceToken",
              account1.address
            );
            await erc20_1.transferFrom(deployer, account1.address, tokenToSend);
            expect(await erc20_1.balanceOf(account1.address)).to.equal(
              tokenToSend
            );
          });
          it("doesn't allow an unnaproved member to do transfers", async () => {
            const tokenToSend = ethers.utils.parseEther("10");
            await expect(
              userContract.transferFrom(deployer, account1.address, tokenToSend)
            ).to.be.revertedWith("ERC20: insufficient allowance");
          });
          it("emits an approval event, when an approval occurs", async () => {
            const tokenToSend = ethers.utils.parseEther("10");
            const tx = await gtToken.approve(account1.address, tokenToSend);
            expect(tx).to.emit(gtToken, "Approval");
          });
          it("won't allow a user to go over the allowance", async () => {
            const tokenToSend = ethers.utils.parseEther("10");
            const tokenToSendOver = ethers.utils.parseEther("20");
            await gtToken.approve(account1.address, tokenToSend);
            await expect(
              userContract.transferFrom(
                deployer,
                account1.address,
                tokenToSendOver
              )
            ).to.be.revertedWith("ERC20: insufficient allowance");
          });
          it("burn GT token", async () => {
            const beforeBurn = await gtToken.balanceOf(deployer);
            console.log(ethers.utils.formatEther(beforeBurn).toString());
            const ethersToWei = ethers.utils.parseUnits("10", "ether");
            const txBurn = await gtToken.burnToken(
              deployer,
              ethers.utils.parseEther("100000")
            );
            txBurn.wait(1);
            const afterBurn = await gtToken.balanceOf(deployer);
            console.log(ethers.utils.formatEther(afterBurn).toString());
            assert.isAbove(beforeBurn, afterBurn);
          });
        });
      });
    });
