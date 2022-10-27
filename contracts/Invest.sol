//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
import "workshop/project.sol";

contract Invest is Project {
    
    //emit after successfull registration of Investor
    event LogRegistrationInvestor(address indexed, bool RegistrationStatus);

    //emit after successfull investment by investor
    event Loginvestment(address indexed investor, uint UniqueId, string timestamp );


    struct InvestorDetails{
        string  Name;
        string  Email;
        string  Country;
    }
    
    // list of register investors
    mapping (address=>InvestorDetails) ListOfInvestor;

    
    // store (key, value)=(investor ,registration successful or not)
    mapping(address=>bool) InvestorRegistration;


    // store (key, value)=(investor addrress,investor Details)
    mapping(address=>mapping(uint=>uint)) Investment;

    function registerInvestor(
            string memory Owner,
            string memory Email,
            string memory Country
            ) public {
                require(!InvestorRegistration[msg.sender],"Your registration has already done");

                ListOfInvestor[msg.sender]=InvestorDetails(Owner,Email,Country);
                InvestorRegistration[msg.sender]=true;
                emit LogRegistrationInvestor(msg.sender, true);
            }

            
    function invest(uint UniqueId, string memory timestamp)  public payable returns(bool){
        require(InvestorRegistration[msg.sender],"Your registration has not done");
        Project_Status storage project_Status=ProjectStatus[List_Of_Verified_project[UniqueId]][UniqueId];
        project_Status.Funded+=msg.value;
        project_Status.Fund_History.push(investorFund(msg.sender,msg.value,timestamp));
        Investment[msg.sender][UniqueId]+=msg.value;
        emit Loginvestment(msg.sender, UniqueId, timestamp);
        return true;
    }

    //for investor after funded in projects
    function getDAOToken(uint Uniqueid) public returns(bool){
        
    }






}


