const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains, INITIAL_SUPPLY } = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const governanceToken = await deploy("GovernanceToken", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`governanceToken deployed at ${governanceToken.address}`);
  /* await delegate(governanceToken.address, deployer);
   console.log(`Delegated!`); */

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(governanceToken.address, []);
  }
};

/* const delegate = async (governanceTokenAddress, delegatedAccount) => {
  const governanceToken = await ethers.getContractAt(
    "GovernanceToken",
    governanceTokenAddress
  );
  const tx = await governanceToken.delegate(delegatedAccount);
  await tx.wait(1);
  console.log(
    `Checkpoint ${await governanceToken.numCheckpoints(delegatedAccount)}`
  );
}; */

module.exports.tags = ["all", "governanceToken"];
