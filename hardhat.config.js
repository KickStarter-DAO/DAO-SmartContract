require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_PROJECT_OWNER = process.env.PRIVATE_KEY_PROJECT_OWNER;
const PRIVATE_KEY_PROJECT_ACCOUNT2 = process.env.PRIVATE_KEY_PROJECT_ACCOUNT2;
const PRIVATE_KEY_PROJECT_ACCOUNT3 = process.env.PRIVATE_KEY_PROJECT_ACCOUNT3;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmations: 1,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [
        PRIVATE_KEY,
        PRIVATE_KEY_PROJECT_OWNER,
        PRIVATE_KEY_PROJECT_ACCOUNT2,
        PRIVATE_KEY_PROJECT_ACCOUNT3,
      ],
      chainId: 5,
      blockConfirmations: 6,
    },
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    projectOwner: 1,
    voter2: 2,
    voter3: 3,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 400000, // 400 seconds
  },
};
