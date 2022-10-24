const { ethers, network } = require("hardhat");
const {
  FUNC,
  NEW_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
} = require("../helper-config");
const { moveBlocks } = require("../utils/move-blocks");
const fs = require("fs");

async function propose(args, functionToCall, proposalDescription) {
  const governor = await ethers.getContract("GovernerContract");
  const box = await ethers.getContract("Box");

  const encodedFunctionCall = box.interface.encodeFunctionData(
    functionToCall,
    args
  );
  console.log(`Proposing ${functionToCall} on ${box.address} with ${args}`);
  console.log(`Proposal description: \n ${proposalDescription}`);

  const proposalTx = await governor.propose(
    [box.address],
    [0],
    [encodedFunctionCall],
    proposalDescription
  );
  const proposeReceipt = await proposalTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }
  const proposalId = proposeReceipt.events[0].args.proposalId;
  let proposals = JSON.parse(fs.readFileSync(proposalsFile), "utf8");
  proposals[network.config.chainId.toString()].push(proposalId.toString());
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals));
}

propose([NEW_VALUE], FUNC, PROPOSAL_DESCRIPTION)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
