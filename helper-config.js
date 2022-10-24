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
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const NEW_VALUE = 77;
const FUNC = "store";
const PROPOSAL_DESCRIPTION = "Propasol #1: Store 77 in the Box!";
const proposalsFile = "./proposals.json";

module.exports = {
  developmentChains,
  networkConfig,
  INITIAL_SUPPLY,
  MIN_DELAY,
  VOTING_PERIOD,
  VOTING_DELAY,
  QUORUM_PERCENTAGE,
  ADDRESS_ZERO,
  NEW_VALUE,
  FUNC,
  PROPOSAL_DESCRIPTION,
  proposalsFile,
};
