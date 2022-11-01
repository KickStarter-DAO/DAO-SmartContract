//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.9;
import "./project.sol";


contract Voters is Project{


    //emit after successfull registration of Investor
    event LogRegistrationVoter(address indexed, bool RegistrationStatus);

struct VotersDetails{
        string  Name;
        string  Email;
        string  Country;
    }

 // list of register Votyers
    mapping (address=>VotersDetails) ListOfVoters;

// store (key, value)=(investor ,registration successful or not)
    mapping(address=>bool) VotersRegistration;

    // store (key, value)=(investor ,vote done or not)
    mapping(address=>bool) VoteComplition;


    function registerVoters(
                string memory Owner,
                string memory Email,
                string memory Country
                ) public {
                    require(!VotersRegistration[msg.sender],"Your registration has already done");

                    ListOfVoters[msg.sender]=VotersDetails(Owner,Email,Country);
                    VotersRegistration[msg.sender]=true;
                    emit LogRegistrationVoter(msg.sender, true);
                }

            
    function StartVote(uint UniqueId) internal returns (bool){
        require(VotersRegistration[msg.sender],"Voter resistration hasn't done.");
        require(!Owner_Registraton_Status[msg.sender],"Project Owner cann't vote.");
        require(!VoteComplition[msg.sender],"already voted!");


       ///body




    

    }




}