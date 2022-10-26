//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
contract Project{


    event LogRegistrationOwner( address indexed Owner, bool RegistrationStatus);
    event LogRegistrationProject(uint256 UniqueId,bool RegistrationStatus);
    struct Project_Details{
        bool ProjectRegistration;
        string ProjectName;
        string ProjectWebsite;
        string ProjectDescription;
    }

    struct Project_Owner_Details{
        string Owner;
        string Email;
        string Country;

    }

    mapping (address=>bool) public Registraton_Status;


    struct Project_Status{
        bool Project_review;
        uint16 Funding;
        uint16 Funded;
        bool Rejected;
    }




    // Project_Details[] List_Of_projects;
    mapping (address=>Project_Owner_Details) public ProjectOwnerDetails;
    mapping(address=>mapping(uint256=>Project_Status)) public ProjectStatus;
    mapping (address =>mapping(uint=>Project_Details)) public  ProjectDetails;

    function RegisterOwner(
        string memory Owner,
        string memory Email,
        string memory Country
        ) public {
            require(!Registraton_Status[msg.sender],"Your registration has already done");

            ProjectOwnerDetails[msg.sender]=Project_Owner_Details(Owner,Email,Country);
            Registraton_Status[msg.sender]=true;
            emit LogRegistrationOwner(msg.sender, true);
        }

    function RegisterProject(
        uint256 UniqueId,
        string memory ProjectName,
        string memory ProjectWebsite,
        string memory ProjectDescription) public  {
    require(Registraton_Status[msg.sender],"Your ownership registration has not done");
    require(!ProjectDetails[msg.sender][UniqueId].ProjectRegistration,"Project is already registered");
    ProjectDetails[msg.sender][UniqueId]=Project_Details(true,ProjectName,ProjectWebsite,ProjectDescription);
    emit  LogRegistrationProject(UniqueId, true);
    }
    





            

    

        







}



// deployed
// 	transaction cost 557009 gas
// gas 640561 gas


// function register
// 	132280 gas
// transaction cost	115026 gas////95589 gas 