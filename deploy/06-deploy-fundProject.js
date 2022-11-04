const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  args = [];
  log("deploying FundProject contract...");
  const fundProject = await deploy("FundProject", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`FundProject deployed at ${fundProject.address}`);

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundProject.address, args);
  }
  const timeLock = await ethers.getContract("TimeLock");
  const fundProjectContract = await ethers.getContractAt(
    "FundProject",
    fundProject.address
  );
  const transferOwnerTx = await fundProjectContract.transferOwnership(
    timeLock.address
  );
  await transferOwnerTx.wait(1);
  log("fundProjectContract Ownership transfered!");
};

module.exports.tags = ["all", "funding"];
