// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
contract DAOMember{

    address Owner;
    uint16 Timelock;
    uint256 INITIALTIME;
    address [] DAOMEMBER;
    mapping(address=>bool) public isDAOMember;

    event LogWithrawReward(address[] indexed DAOMember, uint reward);
    event RemoveDaoMember(address indexed Daomember);

    constructor(address[] memory _daoMember, uint16 _TimeLock){
        Owner=msg.sender;
        INITIALTIME=block.timestamp;
        Timelock=_TimeLock;
        for(uint i; i< _daoMember.length; ++i) {
            address daoMember = _daoMember[i];
            require(daoMember!= address(0), "invalid owner");
            require(!isDAOMember[daoMember], "owner is not unique");

            isDAOMember[daoMember]=true;
            DAOMEMBER.push(daoMember);
        }
    }

    modifier OnlyDAOOwner () {
        require (msg.sender==Owner);
        _;
    }


    function AddDAOMember(address  _newDAOMember) public OnlyDAOOwner {
        require( _newDAOMember!= address(0), "invalid owner");
        require(!isDAOMember[ _newDAOMember], "owner is not unique");
        isDAOMember[_newDAOMember]=true;
        DAOMEMBER.push(_newDAOMember);

    }


    function RemoveDAOMember(address _doaMember) internal OnlyDAOOwner{
        require(isDAOMember[ _doaMember], "you are not dao member");
        uint NoOfMember=DAOMEMBER.length;
        for (uint i ; i<NoOfMember;++i){
            if (DAOMEMBER[i]==_doaMember){
                isDAOMember[ _doaMember]=false;
                DAOMEMBER[i]=DAOMEMBER[NoOfMember-1];
                DAOMEMBER.pop();
                break;
            }

        }
        emit RemoveDaoMember(_doaMember);
    }

    //set _newTimeLock for next reward withdraw
    function WithrawReward(uint16 _newTimeLock) public OnlyDAOOwner{
        require(block.timestamp-INITIALTIME>Timelock,"timelock isn't over");
        uint NoOfDAOMember=DAOMEMBER.length+1;
        uint reward=address(this).balance/NoOfDAOMember;
        for (uint i; i<DAOMEMBER.length;++i){
            payable (DAOMEMBER[i]).transfer(reward);
        }
        INITIALTIME=block.timestamp;
        Timelock=_newTimeLock;
        emit LogWithrawReward(DAOMEMBER,reward);
    }


    function getDAOMember() public view returns(address[] memory){
        return DAOMEMBER;
    }

    receive() external payable {}



}

