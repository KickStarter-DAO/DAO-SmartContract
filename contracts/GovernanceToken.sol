// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
    uint256 public s_initialSupply = 1000000e18;
    address private immutable i_owner;

    event TokenTransfer(
        address indexed _from,
        address indexed _to,
        uint256 _amount
    );

    modifier onlyOwner() {
        require(i_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    constructor()
        ERC20("GovernanceToken", "GT")
        ERC20Permit("GovernanceToken")
    {
        i_owner = msg.sender;
        _mint(msg.sender, s_initialSupply);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
        emit TokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20Votes)
        onlyOwner
    {
        super._mint(to, amount);
    }

    function mintToken(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burnToken(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20Votes)
    {
        super._burn(account, amount);
    }
}
