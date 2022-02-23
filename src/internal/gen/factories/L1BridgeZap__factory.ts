/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { L1BridgeZap, L1BridgeZapInterface } from "../L1BridgeZap";

const _abi = [
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_wethAddress",
        type: "address",
      },
      {
        internalType: "contract ISwap",
        name: "_baseSwap",
        type: "address",
      },
      {
        internalType: "contract ISynapseBridge",
        name: "_synapseBridge",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "WETH_ADDRESS",
    outputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "baseTokens",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "tokenIndex",
        type: "uint8",
      },
    ],
    name: "calculateRemoveLiquidityOneToken",
    outputs: [
      {
        internalType: "uint256",
        name: "availableTokenAmount",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "bool",
        name: "deposit",
        type: "bool",
      },
    ],
    name: "calculateTokenAmount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "tokenIndexFrom",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "tokenIndexTo",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "minDy",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "depositAndSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "depositETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "tokenIndexFrom",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "tokenIndexTo",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "minDy",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "depositETHAndSwap",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "redeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "to",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "redeemv2",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "liquidityAmounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "minToMint",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    name: "zapAndDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "liquidityAmounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "minToMint",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "liqDeadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "tokenIndexFrom",
        type: "uint8",
      },
      {
        internalType: "uint8",
        name: "tokenIndexTo",
        type: "uint8",
      },
      {
        internalType: "uint256",
        name: "minDy",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "swapDeadline",
        type: "uint256",
      },
    ],
    name: "zapAndDepositAndSwap",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class L1BridgeZap__factory {
  static readonly abi = _abi;
  static createInterface(): L1BridgeZapInterface {
    return new utils.Interface(_abi) as L1BridgeZapInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): L1BridgeZap {
    return new Contract(address, _abi, signerOrProvider) as L1BridgeZap;
  }
}
