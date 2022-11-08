// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/AutomationCompatible.sol";

contract FundProject is Ownable, AutomationCompatibleInterface {
    error FundProject__NotApporovedByDao();
    error FundProject__UpkeepNeeded();
    error FundProject__TransferFailed(uint256 _projectId);
    error FundProject__NotEnoughPayment();

    uint256 public projectId = 1;

    uint public lastTimeStamp;
    uint256 public daoPercentage;
    uint256 public enteranceFee;
    address payable projectOwners;

    mapping(uint256 => bool) public _isFunding;
    mapping(uint256 => mapping(uint256 => uint256)) public projectToTime; // projectId => projectFundingTime => timestamp of add
    mapping(uint256 => uint256) public time;

    mapping(string => uint256) public hashToProjectId;
    mapping(uint256 => string) public idToHash;
    mapping(uint256 => mapping(address => uint256)) public funders;
    mapping(uint256 => uint256) public projectFunds;
    mapping(uint256 => uint256) public projectFundingGoalAmount;
    mapping(uint256 => bool) public _isApporovedByDao;
    mapping(uint256 => address) public projectOwnerAddress;

    event projectSuccessfullyFunded(uint256 indexed _projectId);

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
    }

    function apporoveFundingByDao(
        string memory _ipfsHash,
        uint256 _fundingGoalAmount,
        uint256 _time,
        address _projectOwnerAddress
    ) external onlyOwner {
        // only dao can call this function (after deployement we will transfer ownership to dao)
        projectToTime[projectId][_time] = block.timestamp;
        time[projectId] = _time;
        projectFundingGoalAmount[projectId] = _fundingGoalAmount;
        hashToProjectId[_ipfsHash] = projectId;
        idToHash[projectId] = _ipfsHash;
        projectOwnerAddress[projectId] = _projectOwnerAddress;
        _isApporovedByDao[projectId] = true;
        _isFunding[projectId] = true;
        projectId++;
    }

    function cancelApporovelFundingByDao(uint256 _projecID) external onlyOwner {
        // only dao can call this function (after deployement we will transfer ownership to dao)
        _isApporovedByDao[_projecID] = false;
        _isFunding[projectId] = false;
    }

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        upkeepNeeded = (_isFunding[projectId] &&
            (block.timestamp - projectToTime[projectId][time[projectId]]) >
            projectToTime[projectId][time[projectId]]);
    }

    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert FundProject__UpkeepNeeded();
        }
        _isFunding[projectId] = false;
        _isApporovedByDao[projectId] = false;

        if (projectFunds[projectId] > projectFundingGoalAmount[projectId]) {
            uint256 fundsToSent = (projectFunds[projectId] * daoPercentage) /
                100;
            (bool success, ) = (projectOwnerAddress[projectId]).call{
                value: fundsToSent
            }("");
            if (!success) {
                revert FundProject__TransferFailed(projectFunds[projectId]);
            }

            emit projectSuccessfullyFunded(projectId);
        }
    }

    function paySubmitFee() public payable {
        if (msg.value < enteranceFee) {
            revert FundProject__NotEnoughPayment();
        }
        projectOwners = payable(msg.sender);
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
}
