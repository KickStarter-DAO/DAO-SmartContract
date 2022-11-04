const { ethers, network } = require("hardhat");
const { storeImages, storeProjectData } = require("./uploadToPinata");
const fs = require("fs");
const {
  s_projectID,
  s_projectName,
  s_website,
  s_description,
  s_video,
  s_fundRaisingGoalAmount,
  s_roadMap,
  s_otherSources,
  FUNC,
  NEW_VALUE,
  PROPOSAL_DESCRIPTION,
  developmentChains,
  VOTING_DELAY,
  proposalsFile,
  FUNC_FUND,
} = require("../helper-config");

const { moveBlocks } = require("../utils/move-blocks");

const imageLocation = "./images";

const projectDataTemplate = {
  projectName: "",
  website: "",
  description: "",
  images1: "",
  images2: "",
  images3: "",
  images4: "",
  images5: "",
  video: "",
  fundRaisingGoalAmount: "",
  roadMap: "",
  otherSources: "",
  projectID: "",
};

async function submitAndPropose(
  projectName,
  website,
  description,
  video,
  fundRaisingGoalAmount,
  roadMap,
  otherSources,
  images1,
  images2,
  images3,
  images4,
  images5
) {
  const { responses: imageUploadResponses, files } = await storeImages(
    imageLocation
  );

  let projectMetaData = { ...projectDataTemplate };

  projectMetaData.projectName = projectName;
  projectMetaData.website = website;
  projectMetaData.description = description;

  projectMetaData.images1 = `ipfs://${imageUploadResponses[0].IpfsHash}`;
  projectMetaData.images2 = `ipfs://${imageUploadResponses[1].IpfsHash}`;
  projectMetaData.images3 = `ipfs://${imageUploadResponses[2].IpfsHash}`;
  /* projectMetaData.images4 = `ipfs://${imageUploadResponses[3].IpfsHash}`;
  projectMetaData.images5 = `ipfs://${imageUploadResponses[4].IpfsHash}`; */

  projectMetaData.video = video;
  projectMetaData.fundRaisingGoalAmount = fundRaisingGoalAmount;
  projectMetaData.roadMap = roadMap;
  projectMetaData.otherSources = otherSources;

  //console.log(projectMetaData);
  const ProjectMetadataUploadResponse = await storeProjectData(projectMetaData);
  console.log(`ipfs://${ProjectMetadataUploadResponse.IpfsHash}`);

  const proposalDescription = ProjectMetadataUploadResponse.IpfsHash;

  const governor = await ethers.getContract("GovernerContract");
  const fundProject = await ethers.getContract("FundProject");

  console.log(proposalDescription);
  const args = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(proposalDescription)
  );

  const hexOfFundFunction = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes(FUNC_FUND)
  );

  const encodedFunctionCall = hexOfFundFunction.toString() + args.toString();
  const proposalTx = await governor.propose(
    [fundProject.address],
    [0],
    [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(encodedFunctionCall))],
    args
  );
  const proposeReceipt = await proposalTx.wait(1);

  if (developmentChains.includes(network.name)) {
    await moveBlocks(VOTING_DELAY + 1);
  }
  const proposalId = proposeReceipt.events[0].args.proposalId;
  let proposals = JSON.parse(fs.readFileSync(proposalsFile), "utf8");
  proposals[network.config.chainId.toString()].push(proposalId.toString());
  fs.writeFileSync(proposalsFile, JSON.stringify(proposals));

  console.log(`Proposing ${FUNC_FUND} on ${fundProject.address}`);
  console.log(`Proposal description: \n ${proposalDescription}`);
  console.log(`encodedFunctioncall ${encodedFunctionCall}`);

  /* const hexOfFundFunction = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes(FUNC_FUND)
  );
  const hexOfProposalDescription = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes(proposalDescription)
  );

  const encodedFunctionCall =
    hexOfFundFunction.toString() + hexOfProposalDescription.toString();

  const proposalTx = await governor.propose(
    [fundProject.address],
    [0],
    [ethers.utils.hexlify(ethers.utils.toUtf8Bytes(encodedFunctionCall))],
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

  console.log(`Proposing ${FUNC_FUND} on ${fundProject.address}`);
  console.log(`Proposal description: \n ${proposalDescription}`);
  console.log(`encodedFunctioncall ${encodedFunctionCall}`); */

  return ProjectMetadataUploadResponse.IpfsHash;
}

submitAndPropose(
  s_projectName,
  s_website,
  s_description,
  s_video,
  s_fundRaisingGoalAmount,
  s_roadMap,
  s_otherSources
)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
