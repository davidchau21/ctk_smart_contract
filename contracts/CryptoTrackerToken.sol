// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CryptoTrackerToken
 * @dev ERC20 Token for CryptoTracker Quest and Gaming Ecosystem.
 * Includes ERC20Permit for gasless approvals, AccessControl for role-based security,
 * and Pausable/Burnable mechanisms.
 */
contract CryptoTrackerToken is ERC20, ERC20Burnable, ERC20Permit, Pausable, Ownable, AccessControl {
    // Maximum supply: 10,000,000 CTK
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;

    // Access control roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Custom errors for gas efficiency
    error ExceedsMaxSupply(uint256 attemptedTotal, uint256 maxSupply);
    error UnauthorizedCaller(bytes32 role, address caller);

    // Events
    event RewardTokensMinted(address indexed recipient, uint256 amount, address indexed minter);

    constructor(address initialOwner)
        ERC20("CryptoTracker Token", "CTK")
        ERC20Permit("CryptoTracker Token")
        Ownable(initialOwner)
    {
        // Setup initial admin and roles to the initial owner
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        _grantRole(PAUSER_ROLE, initialOwner);
    }

    /**
     * @dev Pauses all token transfers.
     * Callable by accounts with PAUSER_ROLE or the contract owner.
     */
    function pause() public {
        if (!hasRole(PAUSER_ROLE, _msgSender()) && owner() != _msgSender()) {
            revert UnauthorizedCaller(PAUSER_ROLE, _msgSender());
        }
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     * Callable by accounts with PAUSER_ROLE or the contract owner.
     */
    function unpause() public {
        if (!hasRole(PAUSER_ROLE, _msgSender()) && owner() != _msgSender()) {
            revert UnauthorizedCaller(PAUSER_ROLE, _msgSender());
        }
        _unpause();
    }

    /**
     * @dev Mints new tokens. Callable by accounts with MINTER_ROLE or the contract owner.
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public {
        if (!hasRole(MINTER_ROLE, _msgSender()) && owner() != _msgSender()) {
            revert UnauthorizedCaller(MINTER_ROLE, _msgSender());
        }
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(totalSupply() + amount, MAX_SUPPLY);
        }
        _mint(to, amount);
        emit RewardTokensMinted(to, amount, _msgSender());
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes minting and burning.
     * Overridden to implement the Pausable mechanism.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20)
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
