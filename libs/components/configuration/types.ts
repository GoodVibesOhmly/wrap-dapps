import { FungibleToken, IndexerFarmConfigurationRewardsPayload, NonFungibleToken } from '@wrap-dapps/api';
import { NetworkType } from '@airgap/beacon-sdk';
import {Fees} from "@wrap-dapps/api";

export interface EthereumConfig {
  rpcUrl: string;
  networkId: number;
  networkName: string;
  formaticApiKey: string;
  portisDAppId: string;
  custodianContractAddress: string;
}

export interface TezosConfig {
  rpcUrl: string;
  networkId: NetworkType;
  networkName: string;
  minterContractAddress: string;
  quorumContractAddress: string;
}

export interface Config {
  environmentName: string;
  indexerUrl: string;
  statisticsUrl: string;
  tzktLink: string;
  ethereum: EthereumConfig;
  tezos: TezosConfig;
  wrapSignatureThreshold: number;
  unwrapSignatureThreshold: number;
  fungibleTokens: Record<string, FungibleToken>;
  nonFungibleTokens: Record<string, NonFungibleToken>;
  fees: Fees;
  farms: FarmConfig[];
  farmInput: FarmStakedToken;
  oldFarms: FarmConfig[];
  etherscanLink: string;
}

export interface InitialConfig {
  environmentName: string;
  indexerUrl: string;
  statisticsUrl: string;
  ethereum: {
    rpcUrl: string;
    networkId: number;
    networkName: string;
    formaticApiKey: string;
    portisDAppId: string;
  };
  tezos: {
    rpcUrl: string;
    networkId: NetworkType;
    networkName: string;
  };
  tzktLink: string;
  farmInput: FarmStakedToken;
  etherscanLink: string;
}

export enum Environment {
  TESTNET = 'TESTNET',
  MAINNET = 'MAINNET',
}

export interface FarmConfig {
  maxTotalStakedLevelProcessed: number;
  farmContractAddress: string;
  farmContractLink: string;
  farmTotalStaked: string;
  farmStakedToken: FarmStakedToken;
  rewardTokenName: string;
  rewardTokenThumbnailUri: string;
  rewardTokenContractAddress: string;
  rewardTokenId: number;
  rewardTokenDecimals: number;
  rewardTokenSymbol: string;
  rewards: IndexerFarmConfigurationRewardsPayload | undefined;
  apy?: string;
  apr?: string;
}

interface FarmStakedToken {
  contractAddress: string;
  thumbnailUri: string;
  tokenId: number;
  symbol: string;
  name: string;
  decimals: number;
}