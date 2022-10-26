//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

interface Project{

//emit after successfull registration of owner
event LogRegistrationOwner( address indexed Owner, bool RegistrationStatus);

//emit after successfull registration of project on DAO
event LogRegistrationProject(uint256 UniqueId,bool RegistrationStatus);

//  project details
struct Project_Details{
        bool ProjectRegistration;
        string ProjectName;
        string ProjectWebsite;
        string ProjectDescription;
    }

// project owner details
struct Project_Owner_Details{
        string Owner;
        string Email;
        string Country;
    }

//  project status 
struct Project_Status{
        bool Project_review;
        uint16 Funding;
        uint16 Funded;
        uint16 No_of_votes;
        // track history of fund in this project
        investorFund[] Fund_History;
        bool Rejected;
    }

//  investor details who funded in specific project
struct investorFund{
        address investor;
        uint16 Funding;
    }

// registration of project owner on DAO
function RegisterOwner(
        string memory Owner,
        string memory Email,
        string memory Country
        ) external ;

// registration of project on DAO
// UniqueId given by DAO to each project at time of registration    // by Uniqueid easy to track any project
function RegisterProject(
        uint256 UniqueId,
        string memory ProjectName,
        string memory ProjectWebsite,
        string memory ProjectDescription) external payable; 

}