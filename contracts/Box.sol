// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



contract Box {
    uint256 private value;
    address immutable Owner;

    // Emitted when the stored value changes
    event ValueChanged(uint256 newValue);

    constructor(){
    Owner=msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(Owner ==msg.sender, "Ownable: caller is not the owner");
        _;
    }

    // Stores a new value in the contract
    function store(uint256 newValue) public onlyOwner {
        value = newValue;
        emit ValueChanged(newValue);
    }

    // Reads the last stored value
    function retrieve() public view returns (uint256) {
        return value;
    }
}
