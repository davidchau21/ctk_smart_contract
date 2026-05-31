// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CryptoTrackerToken
 * @dev ERC20 Token for CryptoTracker Quest and Gaming Ecosystem
 */
contract CryptoTrackerToken is ERC20, ERC20Burnable, Pausable, Ownable {
    // Maximum supply: 10,000,000 CTK
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;

    constructor(address initialOwner) ERC20("CryptoTracker Token", "CTK") Ownable(initialOwner) {
        // Set the initial owner who can pause and mint tokens (backend wallet)
    }

    /**
     * @dev Pauses all token transfers.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Mints new tokens. Only callable by the owner (backend system).
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "CTK: Max supply exceeded");
        _mint(to, amount);
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
