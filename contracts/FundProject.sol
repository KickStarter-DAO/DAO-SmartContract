// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";
import "hardhat/console.sol";

error FundProject__NotApporovedByDao();
error FundProject__UpkeepNeeded();
error FundProject__TransferFailed(uint256 _projectId);
error FundProject__NotEnoughPayment();
error FundProject__withdrawFund();
error FundProject__WithdrawTransferFailed();
error FundProject__EnteranceFeeNeeded();

contract FundProject is Ownable, AutomationCompatibleInterface {
    enum ProjectFundingStatus {
        ONPROGRESS,
        SUCCESS,
        FAILED,
        CANCELED
    }

    uint256 public projectId = 1;

    uint public lastTimeStamp;
    uint256 public daoPercentage;
    uint256 public enteranceFee;

    mapping(uint256 => bool) public _isFunding;
    mapping(uint256 => mapping(uint256 => uint256)) public projectToTime; // projectId => projectFundingTime => timestamp of add
    mapping(uint256 => uint256) public time;

    mapping(string => uint256) public hashToProjectId;
    mapping(uint256 => string) public idToHash;
    mapping(uint256 => mapping(address => uint256)) public funders; // projectId => funderAddress => funderBalance
    mapping(uint256 => uint256) public projectFunds;
    mapping(uint256 => uint256) public projectFundingGoalAmount;
    mapping(uint256 => bool) public _isApporovedByDao;
    mapping(uint256 => address) public projectOwnerAddress;
    mapping(uint256 => ProjectFundingStatus) public _ProjectFundingStatus;
    mapping(address => bool) public _isEnteranceFeePaid;
    mapping(address => uint256[]) public investedProjects; // investor address => investedProjects
    mapping(uint256 => address) public projectOwnerAddressIndex;

    event projectSuccessfullyFunded(uint256 indexed _projectId);
    event projectFundingFailed(uint256 indexed _projectId);
    event enteranceFeePaid(address indexed _projectOwner);
    event projectGoesToFunding(uint256 indexed _projectId);
    event withdrawFundSuccessfully(
        address indexed __investor,
        uint256 indexed __projectId
    );

    modifier isApporovedByDao(uint256 _projecID) {
        if (!_isApporovedByDao[_projecID])
            revert FundProject__NotApporovedByDao();
        _;
    }

    constructor(uint256 _enteranceFee, uint256 _daoPercentage) {
        lastTimeStamp = block.timestamp;
        daoPercentage = _daoPercentage;
        enteranceFee = _enteranceFee;
    }

    function fund(uint256 _projecID)
        public
        payable
        isApporovedByDao(_projecID)
    {
        funders[_projecID][msg.sender] += msg.value;
        projectFunds[_projecID] += msg.value;
        investedProjects[msg.sender] = [_projecID]; // need testing
    }

    function apporoveFundingByDao(
        string memory _ipfsHash,
        uint256 _fundingGoalAmount,
        uint256 _time,
        uint256 _projectOwnerAddressIndex
    ) external onlyOwner {
        // only dao can call it
        if (
            !_isEnteranceFeePaid[
                projectOwnerAddressIndex[_projectOwnerAddressIndex]
            ]
        ) {
            revert FundProject__EnteranceFeeNeeded();
        } else {
            projectToTime[projectId][_time] = block.timestamp;
            _ProjectFundingStatus[projectId] = ProjectFundingStatus.ONPROGRESS;
            time[projectId] = _time;
            projectFundingGoalAmount[projectId] = _fundingGoalAmount;
            hashToProjectId[_ipfsHash] = projectId;
            idToHash[projectId] = _ipfsHash;
            projectOwnerAddress[projectId] = projectOwnerAddressIndex[
                _projectOwnerAddressIndex
            ];
            _isApporovedByDao[projectId] = true;
            _isFunding[projectId] = true;
            emit projectGoesToFunding(projectId);
            projectId++;
        }
    }

    function cancelApporovelFundingByDao(uint256 _projecID) external onlyOwner {
        // only dao can call it
        _isApporovedByDao[_projecID] = false;
        _isFunding[projectId] = false;
        _ProjectFundingStatus[projectId] = ProjectFundingStatus.CANCELED;
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        for (uint projectIndex = 1; projectIndex <= projectId; projectIndex++) {
            if (_isFunding[projectIndex]) {
                bool timePassed = (block.timestamp -
                    (projectToTime[projectIndex][time[projectIndex]])) >
                    time[projectIndex];
                upkeepNeeded = (timePassed);
                if (upkeepNeeded) {
                    performData = abi.encodePacked(projectIndex);
                    break;
                }
            }
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert FundProject__UpkeepNeeded();
        }

        uint256 ProjectId = uint256(bytes32(performData));
        _isFunding[ProjectId] = false;
        _isApporovedByDao[ProjectId] = false;

        if (projectFunds[ProjectId] > projectFundingGoalAmount[ProjectId]) {
            _ProjectFundingStatus[ProjectId] = ProjectFundingStatus.SUCCESS;
            uint256 fundsToSent = (projectFunds[ProjectId] *
                (100 - daoPercentage)) / 100;
            projectFunds[ProjectId] = 0;
            (bool success, ) = (projectOwnerAddress[ProjectId]).call{
                value: fundsToSent
            }("");
            if (!success) {
                revert FundProject__TransferFailed(projectFunds[ProjectId]);
            }

            emit projectSuccessfullyFunded(ProjectId);
        } else {
            _ProjectFundingStatus[ProjectId] = ProjectFundingStatus.FAILED;
            emit projectFundingFailed(ProjectId);
        }
    }

    function paySubmitFee() public payable {
        if (msg.value < enteranceFee) {
            revert FundProject__NotEnoughPayment();
        } else {
            _isEnteranceFeePaid[msg.sender] = true;
            projectOwnerAddressIndex[projectId] = msg.sender;
            emit enteranceFeePaid(msg.sender);
        }
    }

    function withdrawFund(uint256 _projectID) public {
        if (_ProjectFundingStatus[_projectID] == ProjectFundingStatus.FAILED) {
            uint256 fundToSent = funders[_projectID][msg.sender];
            funders[_projectID][msg.sender] = 0;
            (bool success, ) = (payable(msg.sender)).call{value: fundToSent}(
                ""
            );
            if (!success) {
                revert FundProject__WithdrawTransferFailed();
            }
            emit withdrawFundSuccessfully(msg.sender, projectId);
        } else {
            revert FundProject__withdrawFund();
        }
    }

    function _isApporoveFundingByDao(uint256 _projecID)
        external
        view
        returns (bool)
    {
        return _isApporovedByDao[_projecID];
    }

    function _getHashOfProjectData(uint256 _projecID)
        public
        view
        returns (string memory)
    {
        return idToHash[_projecID];
    }

    function _getProjectId(string memory _ipfsHash)
        public
        view
        returns (uint256)
    {
        return hashToProjectId[_ipfsHash];
    }

    function _getBalanceOfProject(uint256 _projecID)
        public
        view
        returns (uint256)
    {
        return projectFunds[_projecID];
    }

    function _getFundingGoalAmount(uint256 _projecID)
        public
        view
        returns (uint256)
    {
        return projectFundingGoalAmount[_projecID];
    }

    function is_funding(uint256 _projectID) public view returns (bool) {
        return _isFunding[_projectID];
    }

    function _getProjectStatus(uint256 _projectID)
        public
        view
        returns (ProjectFundingStatus)
    {
        return _ProjectFundingStatus[_projectID];
    }

    function getEnteranceFee() public view returns (uint256) {
        return enteranceFee;
    }

    function isEnteranceFeePaid(address account) public view returns (bool) {
        return _isEnteranceFeePaid[account];
    }

    function getFunderBalance(uint256 _projectID)
        public
        view
        returns (uint256)
    {
        return funders[_projectID][msg.sender];
    }

    function getInvestedProjects(address investor)
        public
        view
        returns (uint256[] memory)
    {
        return investedProjects[investor]; // need testing
    }

    function getDaoPercentage() public view returns (uint256) {
        return daoPercentage;
    }

    function getTimeleft(uint256 _projectID)
        public
        view
        returns (uint256 a, uint256 b)
    {
        a = block.timestamp - projectToTime[_projectID][time[_projectID]];
        b = time[_projectID];
    }

    function getCurrentProjectId() public view returns (uint256) {
        return projectId;
    }
}
