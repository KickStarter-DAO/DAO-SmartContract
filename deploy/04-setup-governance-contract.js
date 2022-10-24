const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const {
  developmentChains,
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
  ADDRESS_ZERO,
} = require("../helper-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const governor = await ethers.getContract("GovernerContract", deployer);
  const timelock = await ethers.getContract("TimeLock", deployer);

  console.log("Setting up roles...");

  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  const proposerTx = await timelock.grantRole(proposerRole, governor.address);
  await proposerTx.wait(1);
  const executorTx = await timelock.grantRole(executorRole, ADDRESS_ZERO);
  await executorTx.wait(1);
  const revokeTx = await timelock.revokeRole(adminRole, deployer);
  await revokeTx.wait(1);
};

module.exports.tags = ["all", "setupGovernanceContract"];
