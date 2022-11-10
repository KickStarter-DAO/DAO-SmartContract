const { ethers, network } = require("hardhat");
const {
  developmentChains,
  VOTING_PERIOD,
  s_fundingTime,
} = require("../helper-config");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");

async function fund() {
  const provider = hre.ethers.provider;
  const governor = await ethers.getContract("GovernerContract");
  const projectId = await governor._getProjectId(
    "QmPwX1rNoYRmQAPDm8Dp7YSeFdxPKaczWaBu8NPgVpKufu"
  );
  const invest = ethers.utils.parseUnits("1", "ether");
  const investor = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // node account3
  const account2node = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  console.log((await provider.getBalance(investor)).toString());

  await ethers.getContract("GovernerContract", investor);
  const invTx = await governor.fund(projectId, { value: invest });
  await invTx.wait(1);
  console.log((await provider.getBalance(investor)).toString());

  /* if (developmentChains.includes(network.name)) {
    await moveTime(s_fundingTime + 1);
    await moveBlocks(1);
  }

  const tx = await governor.performUpkeep(
    ethers.utils.hexZeroPad(ethers.utils.hexlify(projectId), 32)
  ); */
}

fund()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
