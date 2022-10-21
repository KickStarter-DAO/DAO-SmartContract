// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    // minDelay: How long you have to wait before executing
    // proposers is the list of addresses that can purpose
    // executers: Who can execute when proposal passes
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executers
    ) TimelockController(minDelay, proposers, executers) {}
}
