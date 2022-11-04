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
} = require("../helper-config");

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

const imageLocation = "./images";

async function submit(
  projectID,
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
  projectMetaData.projectID = projectID;
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

  console.log(projectMetaData);
  const ProjectMetadataUploadResponse = await storeProjectData(projectMetaData);
  console.log(`ipfs://${ProjectMetadataUploadResponse.IpfsHash}`);

  return ProjectMetadataUploadResponse.IpfsHash;
}

submit(
  s_projectID,
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
