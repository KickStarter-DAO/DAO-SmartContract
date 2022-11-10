const { ethers } = require("hardhat");

const networkConfig = {
  5: {
    name: "goerli",
    enteranceFee: ethers.utils.parseEther("0.01"),
    daoPercentage: "10",
  },
  31337: {
    name: "hardhat",
    enteranceFee: ethers.utils.parseEther("0.01"),
    daoPercentage: "10",
  },
};

const developmentChains = ["hardhat", "localhost"];
const INITIAL_SUPPLY = "1000000000000000000000000";
const MIN_DELAY = 0;
const VOTING_DELAY = 0;
const VOTING_PERIOD = 200;
const QUORUM_PERCENTAGE = 0;
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const NEW_VALUE = 77;
const FUNC = "store";
const FUNC_FUND = "apporoveFundingByDao";
const FUNC_CANCEL_APPOROVEL = "cancelApporovelFundingByDao";
const PROPOSAL_DESCRIPTION = "Propasol #1: Store 77 in the Box!";
const proposalsFile = "./proposals.json";
const s_projectID = 1;
const s_projectName = "Sample Project";
const s_website = "www.sampleProject.com";
const s_description = "Amazing way to make money";
const s_video =
  "https://www.youtube.com/watch?v=5abamRO41fE&list=RD5abamRO41fE&start_radio=1&ab_channel=Slipknot";
const s_fundRaisingGoalAmount = 10000; // in wei
const s_roadMap = "Just click the video";
const s_otherSources = "You dont need anything else";
const s_fundingTime = 60; // 10 sec.

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
  s_projectID,
  s_projectName,
  s_website,
  s_description,
  s_video,
  s_fundRaisingGoalAmount,
  s_roadMap,
  s_otherSources,
  s_fundingTime,
  FUNC_FUND,
  FUNC_CANCEL_APPOROVEL,
};
