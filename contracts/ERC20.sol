// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20 {
    mapping(address => uint256) public _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 public _totalSupply;

    string public _name;
    string public _symbol;


    event Transfer(address indexed _from, address indexed _to, uint256 value);
    event Approval(address indexed _owner,address indexed _spender,uint256  amount);

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

   
    function decimals() public pure returns (uint8) {
        return 18;
    }

  
     modifier validDestination(address to) {
    require(to != address(0x0),"ERC20: transfer from the zero address");
    require(to != address(this),"ERC20: transfer to the zero address");
    _;
}


    function transfer(address to, uint256 amount) public validDestination(to) returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }                                                                         

    
    function approve(address spender, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }


    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public validDestination(to) returns (bool) {
        _spendAllowance(from,msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

  
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal validDestination(to) returns(bool) {
        

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);

        return true;
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);

    }

        function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);

    }


    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal validDestination(spender) {

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = _allowances[owner][spender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }
}

   