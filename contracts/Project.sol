//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
contract Project{
    struct Project_Details{
        string ProjectName;
        string ProjectWebsite;
        string ProjectDescription;
    }

    struct Project_Owner_Details{
        string Owner;
        string Email;
        string Country;
        bool RegistrationStatus;

    }

    struct Status{
        bool OwnerRegistrationStatus;
        bool ProjectRegistrationStatus;
    }

    mapping (address=>Project_Owner_Details) public ProjectOwnerDetails;
    mapping(address=>Status) public TrackStatus;
    mapping (address =>mapping(uint=>Project_Details)) public  ProjectDetails;

    function RegisterOwner(string memory Owner,
        string memory Email,
        string memory Country
        ) public {
            require(!TrackStatus[msg.sender].OwnerRegistrationStatus,"Your registration has already done");

            ProjectOwnerDetails[msg.sender]=Project_Owner_Details(Owner,Email,Country);
            TrackStatus[msg.sender]=Status(true, false);
                }

    

        







}



// deployed
// 	transaction cost 557009 gas
// gas 640561 gas


// function register
// 	132280 gas
// transaction cost	115026 gas