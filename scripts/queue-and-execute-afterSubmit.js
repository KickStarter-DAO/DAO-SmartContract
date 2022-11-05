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
  const proposalDescription = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
  const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
  const fundProjectContract = await ethers.getContract("FundProject");
  let projectId = await fundProjectContract._getProjectId(args);
  console.log(projectId.toString());
  console.log(await fundProjectContract._isapporoveFundingByDao(projectId));
  const encodedFunctionCall = fundProjectContract.interface.encodeFunctionData(
    FUNC_FUND,
    [args]
  );
  const descriptionHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(proposalDescription)
  );

  const governor = await ethers.getContract("GovernerContract");
  console.log("Queueing...");
  const queueTx = await governor.queue(
    [fundProjectContract.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await queueTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveTime(MIN_DELAY + 1);
    await moveBlocks(1);
  }

  console.log("Executing...");
  const executeTx = await governor.execute(
    [fundProjectContract.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  );
  await executeTx.wait(1);

  projectId = await fundProjectContract._getProjectId(args);
  console.log(projectId.toString());
  console.log(await fundProjectContract._isapporoveFundingByDao(projectId));
}

queue_and_execute_afterSubmit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
