const { ethers, network } = require("hardhat");
const {
  FUNC_FUND,
  developmentChains,
  MIN_DELAY,
  s_fundRaisingGoalAmount,
  s_fundingTime,
} = require("../helper-config");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");
const fs = require("fs");

async function queue_and_execute_afterSubmit() {
  const proposalDescription = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
  const args = "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu";
  const nodeAccount2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // account2 from node

  const fundProjectContract = await ethers.getContract("GovernerContract");

  const encodedFunctionCall = fundProjectContract.interface.encodeFunctionData(
    FUNC_FUND,
    [args, s_fundRaisingGoalAmount, s_fundingTime, nodeAccount2]
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
  console.log("Executed!");

  let projectId = await governor._getProjectId(args);
  console.log(`ProjectID = ${projectId.toString()}`);
  console.log(await governor._isApporoveFundingByDao(projectId));
}

queue_and_execute_afterSubmit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
