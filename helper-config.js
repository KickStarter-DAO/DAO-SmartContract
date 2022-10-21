const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
  },
  31337: {
    name: "hardhat",
  },
};

const developmentChains = ["hardhat", "localhost"];
const INITIAL_SUPPLY = (10e18).toString();
const MIN_DELAY = 3600;
const VOTING_PERIOD = 5;
const VOTING_DELAY = 1;
const QUORUM_PERCENTAGE = 4;

module.exports = {
  developmentChains,
  networkConfig,
  INITIAL_SUPPLY,
  MIN_DELAY,
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
};
