//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
contract Project{

    // DAO owner /              //if need add more than one DAO Owner
    address DAO_OWNER;

    // at the time of project registraation owner must pay
    uint96 Project_Submition_Fee;
    constructor(uint64 Fee){
        DAO_OWNER=msg.sender;
        Project_Submition_Fee=Fee;

    }

    event LogRegistrationOwner( address indexed Owner, bool RegistrationStatus);
    event LogRegistrationProject(uint256 UniqueId,bool RegistrationStatus);

    struct Project_Details{
        bool ProjectRegistration;
        string ProjectName;
        string ProjectWebsite;
        string ProjectDescription;
        uint256 Funding_Goal;
    }

    struct Project_Owner_Details{
        string Owner;
        string Email;
        string Country;
    }


    struct Project_Status{
        bool Project_review;
        bool Funding_Status;
        uint16 Funded;
        uint16 No_of_votes;
        investorFund[] Fund_History;
        bool Rejected;
    }

    struct investorFund{
        address investor;
        uint16 Funding;
    }

// store (key, value)=(projectOwner,registration successful or not)
    mapping (address=>bool) public Owner_Registraton_Status;

// store (key, value)=(projectOwner,project Details)
    mapping (address=>Project_Owner_Details) public ProjectOwnerDetails;

// store (key,UniqueId, value)=(projectOwner, UniqueId,Project_status)
//uniqueId is given by DAO at time of project registration
// each project has a specific uniqueId 
    mapping(address=>mapping(uint256=>Project_Status)) public ProjectStatus;

// store (key,UniqueId, value)=(projectOwner, UniqueId,Project_Details)
    mapping (address =>mapping(uint=>Project_Details)) public  ProjectDetails;

// store (key,value)=(projectOwner, ProjectSubmissionFee by owner)
// project Owner must pay minimum project submission fee (like intial stake)
    mapping(address=>mapping (uint256=>uint)) public ProjectSubmissionFee;

// store (key, value)=(UniqueId,Project_Owner_Address)
// pupose:
//          investor can find list of completly verified projects(by DAO) and invest these projects only
    mapping(uint=>address) List_Of_Verified_project;

    function RegisterOwner(
        string memory Owner,
        string memory Email,
        string memory Country
        ) public {
            require(!Owner_Registraton_Status[msg.sender],"Your registration has already done");

            ProjectOwnerDetails[msg.sender]=Project_Owner_Details(Owner,Email,Country);
            Owner_Registraton_Status[msg.sender]=true;
            emit LogRegistrationOwner(msg.sender, true);
        }

    function RegisterProject(
        uint256 UniqueId,
        string memory ProjectName,
        string memory ProjectWebsite,
        string memory ProjectDescription,
        uint Funding_Goal) public payable  {
    require(msg.value>=Project_Submition_Fee,"you must pay submission fee.");
    require(Owner_Registraton_Status[msg.sender],"Your ownership registration has not done.");
    require(!ProjectDetails[msg.sender][UniqueId].ProjectRegistration,"Project is already registered.");
    ProjectDetails[msg.sender][UniqueId]=Project_Details(true,ProjectName,ProjectWebsite,ProjectDescription,Funding_Goal);
    ProjectSubmissionFee[msg.sender][UniqueId]=msg.value;
    emit LogRegistrationProject(UniqueId, true);
    }

    modifier OnlyDAO(){
        require(msg.sender==DAO_OWNER,"you're not DAO member");
        _;
    }


    function ProjectVerification_BY_DAO(address project_Owner,uint UniqueId) public  OnlyDAO returns(bool success){
        ProjectStatus[project_Owner][UniqueId].Project_review=true;
        return true;
    }
    function initializeFunding(address project_Owner,uint UniqueId) public  OnlyDAO returns(bool success){
        require(ProjectStatus[project_Owner][UniqueId].Project_review,"review this project first");
        ProjectStatus[project_Owner][UniqueId].Funding_Status=true;
        List_Of_Verified_project[UniqueId]=project_Owner;
        return true;
    }

    
    





            

    

        







}


