// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./ERC20.sol";

/// @custom:security-contact anandkumar@iitbhilai.ac.in
contract DAOKickStarter is ERC20 {

    //@dev it take 160 bits(20bytes) storage of EVM of slot1
    address private Owner;

    bool private _paused;
    event Paused(address account);

    event Unpaused(address account);
    constructor() ERC20("DAOKickStarter", "DAO") {
        _paused=false;
        Owner=msg.sender;
        _mint(msg.sender, 100000000 * 10 ** 18);
    }


    modifier onlyOwner() {
     require(Owner ==msg.sender, "Ownable: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    function pause() public onlyOwner {
        _paused=true;
        emit  Paused(msg.sender);
    }

    function unpause() public onlyOwner {
        _paused=false;
        emit Unpaused(msg.sender);
    }
 

    function _mint(address to, uint256 amount)
        internal override 
         onlyOwner
    {
        super._mint(to, amount);
    }


    function _burn(address account, uint256 amount)
        internal
        override(ERC20)
    {
        super._burn(account, amount);
    }
}
