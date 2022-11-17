const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  FUNC_FUND,
  developmentChains,
  networkConfig,
  s_fundingTime,
  s_fundRaisingGoalAmount,
  proposalsFile,
} = require("../../helper-config");
const fs = require("fs");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Dao staging tests", async () => {
      const chainId = network.config.chainId;
      let deployer,
        governor,
        gtToken,
        projectOwnerIndex,
        projectOwner,
        voter2,
        voter3;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        deployer = await ethers.getSigner(deployer);
        projectOwner = await ethers.getSigner(
          (
            await getNamedAccounts()
          ).projectOwner
        );
        voter2 = await ethers.getSigner((await getNamedAccounts()).voter2);
        voter3 = await ethers.getSigner((await getNamedAccounts()).voter3);

        gtToken = await ethers.getContract("GovernanceToken", deployer);
        governor = await ethers.getContract("GovernerContract", deployer);
      });
      describe("make a propose to fund a project", () => {
        it("works with live chainlink keepers get to proposal to fund the project", async () => {
          console.log("Submitting...");
          const args = "QmeqcGRJSAUJecnyHNUbxg53YPErLodFnvuNq82qAAALLW";

          const projectOwnerConnectContract = await governor.connect(
            projectOwner
          );
          console.log("Paying submit fee...");
          const enteranceFee =
            await projectOwnerConnectContract.getEnteranceFee();
          const payFee = await projectOwnerConnectContract.paySubmitFee({
            value: enteranceFee,
          });
          await payFee.wait(1);
          console.log("Submit fee paid!");
          projectOwnerIndex =
            await projectOwnerConnectContract.getCurrentProjectId();

          const encodedFunctionCall =
            projectOwnerConnectContract.interface.encodeFunctionData(
              FUNC_FUND,
              [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwnerIndex]
            );
          console.log("Proposing...");
          const proposalTx = await projectOwnerConnectContract.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            args
          );
          const proposeReceipt = await proposalTx.wait(1);
          const proposalId = proposeReceipt.events[0].args.proposalId;
          console.log("Proposed!");
          console.log(`Propoasal Id: ${proposalId.toString()}`);

          const proposalDeadLine = await governor.proposalDeadline(proposalId);
          console.log(`proposalDeadLine Id: ${proposalDeadLine.toString()}`);
        });
      });
      describe("make vote,queue and execute", () => {
        it("Make the vote!", async () => {
          const voter2ConnectTokenContract = governor.connect(voter2);
          let txCastVote = await voter2ConnectTokenContract.castVote(
            "25642064417695780697194357454208262799831375866508686635461989984084662075539",
            1
          );
          await txCastVote.wait(1);

          const voter3ConnectTokenContract = governor.connect(voter3);
          txCastVote = await voter3ConnectTokenContract.castVote(
            "25642064417695780697194357454208262799831375866508686635461989984084662075539",
            0
          );
          await txCastVote.wait(1);

          const deployerConnectTokenContract = governor.connect(deployer);
          txCastVote = await deployerConnectTokenContract.castVote(
            "25642064417695780697194357454208262799831375866508686635461989984084662075539",
            1
          );
          await txCastVote.wait(1);
        });
        it("queuning and execute", async () => {
          const projectOwnerConnectContract = await governor.connect(
            projectOwner
          );
          projectOwnerIndex =
            await projectOwnerConnectContract.getCurrentProjectId();

          const args = "QmWecuZF73W4Qm7D7hvR5fWU83s9kn9QjWfmGd9tuDevLn";
          const descriptionHash = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(args)
          );
          const encodedFunctionCall = governor.interface.encodeFunctionData(
            FUNC_FUND,
            [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwnerIndex]
          );

          governor = await ethers.getContract("GovernerContract", deployer);
          console.log("Queueing...");
          const queueTx = await governor.queue(
            [governor.address],
            [0],
            [encodedFunctionCall],
            descriptionHash
          );
          await queueTx.wait(1);
          console.log("Queued");

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
        });

        it("Lets fund!", async () => {
          const invest = ethers.utils.parseUnits("0.05", "ether");
          const investorConnectContract = await governor.connect(deployer);
          console.log(
            ` investorBalanceBefore = ${ethers.utils
              .formatEther(
                await investorConnectContract.provider.getBalance(
                  deployer.address
                )
              )
              .toString()}`
          );

          const invTx = await investorConnectContract.fund(1, {
            value: invest,
          });
          await invTx.wait(1);
          console.log(
            ` investorBalanceAfter = ${ethers.utils
              .formatEther(
                await investorConnectContract.provider.getBalance(
                  deployer.address
                )
              )
              .toString()}`
          );
        });
      });

      /*   describe("setup other accounts onlyones", () => {
        it("transfer and delegate", async () => {
          gtToken = await ethers.getContract("GovernanceToken", deployer);
          let tx1 = await gtToken.transfer(
            voter2.address,
            ethers.utils.parseEther("500000")
          );
          tx1 = await gtToken.transfer(
            voter3.address,
            ethers.utils.parseEther("300000")
          );

          await tx1.wait(1);

          const voter2ConnectToken = gtToken.connect(voter2);
          tx1 = await voter2ConnectToken.delegate(voter2.address);
          await tx1.wait(1);

          const voter3ConnectToken = gtToken.connect(voter3);
          tx1 = await voter3ConnectToken.delegate(voter3.address);
          await tx1.wait(1);
          assert(tx1);
        });
      }); */
    });
