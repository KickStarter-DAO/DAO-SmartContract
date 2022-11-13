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
          await new Promise(async (resolve, reject) => {
            // listen for WinnerPicked event
            governor.once("projectGoesToFunding", async () => {
              console.log("projectGoesToFunding event fired!");
              try {
                // put assert here

                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });
          });
        });
      });
      describe("submit a project", () => {
        it("submitting", async () => {
          const args = "QmeqcGRJSAUJecnyHNUbxg53YPErLodFnvuNq92qAhVMQQ";
          const projectOwnerConnectContract = await governor.connect(
            projectOwner
          );

          const enteranceFee =
            await projectOwnerConnectContract.getEnteranceFee();
          const payFee = await projectOwnerConnectContract.paySubmitFee({
            value: enteranceFee,
          });
          await payFee.wait(1);
          projectOwnerIndex =
            await projectOwnerConnectContract.getCurrentProjectId();

          const encodedFunctionCall =
            projectOwnerConnectContract.interface.encodeFunctionData(
              FUNC_FUND,
              [args, s_fundRaisingGoalAmount, s_fundingTime, projectOwnerIndex]
            );

          const proposalTx = await projectOwnerConnectContract.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            args
          );
          const proposeReceipt = await proposalTx.wait(1);
          const proposalId = proposeReceipt.events[0].args.proposalId;
          console.log(proposalId.toString());
        });

        it("Make the vote!", async () => {
          const voter2ConnectTokenContract = governor.connect(voter2);
          let txCastVote = await voter2ConnectTokenContract.castVote(
            "33305536448279361826260693304629530695162329813830343837048230642993916376403",
            1
          );
          await txCastVote.wait(1);

          const voter3ConnectTokenContract = governor.connect(voter3);
          txCastVote = await voter3ConnectTokenContract.castVote(
            "33305536448279361826260693304629530695162329813830343837048230642993916376403",
            0
          );
          await txCastVote.wait(1);

          const deployerConnectTokenContract = governor.connect(deployer);
          txCastVote = await deployerConnectTokenContract.castVote(
            "33305536448279361826260693304629530695162329813830343837048230642993916376403",
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

          const args = "QmeqcGRJSAUJecnyHNUbxg53YPErLodFnvuNq92qAhVMQQ";
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
      });

      /* describe("setup other accounts onlyones", () => {
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
