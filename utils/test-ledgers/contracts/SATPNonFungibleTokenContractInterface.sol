// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

/*
 *  Smart Contract Interface to define the methods needed by SATP Wrapper Contract.
 */

interface SATPNonFungibleTokenContractInterface {
  // mint creates a new token with the given uniqueDescriptor and assigns it to the owner.
  function mint(address account, uint256 uniqueDescriptor) external returns (bool); 
  // burn destroys the given uniqueDescriptor token from the owner.
  function burn(uint256 uniqueDescriptor) external returns (bool);
  // lock transfers the given uniqueDescriptor token from 'from' to 'to', after approval.
  function lock(address from, address to, uint256 uniqueDescriptor) external returns (bool);
  // assign assigns the given uniqueDescriptor token from the owner to the target, without approval.
  function assign(address to, uint256 uniqueDescriptor) external returns (bool);
  // unlock transfers the given uniqueDescriptor token from 'from' to 'to', after approval.
  function unlock(address from, address to, uint256 uniqueDescriptor) external returns (bool);
  // checks if the given account has the given role.
  function hasBridgeRole(address account) external view returns (bool);
  // grants the bridge role to a specified account over a token of this contract.
  function grantBridgeRole(address account) external returns (bool);
  // ERC721 Receiver function to handle safe transfers.
  function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4);
  // checks if the account has handling permissions over the uniqueDescriptor token.
  function hasPermission(address account, uint256 uniqueDescriptor) external view returns (bool);
  // checks if the uniqueDescriptor token was approved to be handled by the account.
  function isApproved(address account, uint256 uniqueDescriptor) external view returns (bool);
}
