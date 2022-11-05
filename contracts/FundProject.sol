// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FundProject is Ownable {
    error FundProject__NotApporovedByDao();

    uint256 public projectId = 1;

    mapping(string => uint256) public hashToProjectId;
    mapping(uint256 => string) public idToHash;
    mapping(uint256 => mapping(address => uint256)) public funders;
    mapping(uint256 => bool) public _isApporovedByDao;

    modifier isApporovedByDao(uint256 _projecID) {
        if (!_isApporovedByDao[_projecID])
            revert FundProject__NotApporovedByDao();
        _;
    }

    function fund(uint256 _projecID)
        public
        payable
        isApporovedByDao(_projecID)
    {
        funders[_projecID][msg.sender] += msg.value;
    }

    function apporoveFundingByDao(string memory _ipfsHash) external onlyOwner {
        // only dao can call this function (after deployement we will transfer ownership to dao)
        hashToProjectId[_ipfsHash] = projectId;
        idToHash[projectId] = _ipfsHash;
        _isApporovedByDao[projectId] = true;
        projectId++;
    }

    function cancelApporovelFundingByDao(uint256 _projecID) external onlyOwner {
        // only dao can call this function (after deployement we will transfer ownership to dao)
        _isApporovedByDao[_projecID] = false;
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
}
