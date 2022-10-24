const { ethers, network } = require("hardhat");
const {
  proposalsFile,
  developmentChains,
  VOTING_PERIOD,
} = require("../helper-config");
const { moveBlocks } = require("../utils/move-blocks");
const fs = require("fs");

const index = 0;

async function vote(proposalIndex) {
  const proposals = JSON.parse(fs.readFileSync(proposalsFile, "utf8"));
  const proposalId = proposals[network.config.chainId][proposalIndex];
  // 0 = aganist, 1 = for, 2= abstain
  const voteWay = 1;
  const governor = await ethers.getContract("GovernerContract");
  const reason = "Just I want!";
  const voteTxResponse = await governor.castVoteWithReason(
    proposalId,
    voteWay,
    reason
  );
  await voteTxResponse.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_PERIOD + 1);
  }
  console.log("Voted! Ready to gooo!");
}

vote(index)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
