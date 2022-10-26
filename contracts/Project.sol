//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
contract Project{
    address DAO_OWNER;
    uint64 Project_Submition_Fee;
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
        uint16 No_of_votes;
        investorFund[] Fund_History;
        bool Rejected;

    }
    struct investorFund{
        address investor;
        uint16 Funding;
    }



    // Project_Details[] List_Of_projects;
    mapping (address=>Project_Owner_Details) public ProjectOwnerDetails;
    mapping(address=>mapping(uint256=>Project_Status)) public ProjectStatus;
    mapping (address =>mapping(uint=>Project_Details)) public  ProjectDetails;
    mapping(address=>mapping (uint256=>uint)) public ProjectSubmissionFee;

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
        string memory ProjectDescription) public payable  {
    require(msg.value>=Project_Submition_Fee,"you must pay submission fee.");
    require(Registraton_Status[msg.sender],"Your ownership registration has not done.");
    require(!ProjectDetails[msg.sender][UniqueId].ProjectRegistration,"Project is already registered.");
    ProjectDetails[msg.sender][UniqueId]=Project_Details(true,ProjectName,ProjectWebsite,ProjectDescription);
    ProjectSubmissionFee[msg.sender][UniqueId]=msg.value;
    emit LogRegistrationProject(UniqueId, true);
    }

    modifier OnlyDAO(){
        require(msg.sender==DAO_OWNER,"you're not DAO member");
        _;
    }

    function ProjectVerification_BY_DAO(bool Project_review) public  OnlyDAO{
        
    }

    
    





            

    

        







}


