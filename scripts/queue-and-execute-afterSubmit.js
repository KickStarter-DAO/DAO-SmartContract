const { ethers, network } = require("hardhat");
const {
  FUNC_FUND,
  NEW_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  MIN_DELAY,
} = require("../helper-config");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");
const fs = require("fs");

async function queue_and_execute_afterSubmit() {
  const proposalDescription = "QmeqcGRJSAUJecnyHNUbxg53YPErLodFnvuNq92qAhVMUU";

  const fundProjectContract = await ethers.getContract("FundProject");
}

queue_and_execute_afterSubmit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
