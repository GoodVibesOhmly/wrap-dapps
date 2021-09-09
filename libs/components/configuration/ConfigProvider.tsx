import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Config, FarmConfig, InitialConfig } from './types';
import { FungibleToken, IndexerApi, NonFungibleToken, StatisticsApi, TokenType } from '@wrap-dapps/api';
import {LoadingScreen} from './LoadingScreen';

type ContextValue = undefined | Config;
const ConfigContext = React.createContext<ContextValue>(undefined);

export function useConfig() {
  const config = React.useContext(ConfigContext);
  if (config == null)
    throw new Error('config consumer must be used within a config provider');
  return config;
}

export function useTezosConfig() {
  const { tezos } = useConfig();
  return tezos;
}

export function useEthereumConfig() {
  const { ethereum } = useConfig();
  return ethereum;
}

export function useNonFungibleTokens() {
  const { nonFungibleTokens } = useConfig();
  return nonFungibleTokens;
}

export function useIndexerApi() {
  const { indexerUrl } = useConfig();
  return useMemo(() => new IndexerApi(indexerUrl), [indexerUrl]);
}

const getTimeFromRetryCounter = (counter: number) => Math.pow(2, counter) - 1;

const stoppedFarms = {
  contracts: [
    {
      totalStaked: '0',
      contract: 'KT1SZVLvLDQvqx6qMbF8oXZe2tfP7bJMASy2',
      token: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
      tokenId: '19'
    },
    {
      totalStaked: '0',
      contract: 'KT1AnsHEdYKEdM62QCNpZGc5PfpXhftcdu22',
      token: 'KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd',
      tokenId: '0'
    }
  ]
};

export enum ConfigStatus {
  UNINITIALIZED,
  LOADING,
  LOADED,
}

type Props = {
  initConfig: InitialConfig
}

export function ConfigProvider({ children, initConfig }: PropsWithChildren<Props>) {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>(
    ConfigStatus.UNINITIALIZED
  );
  const [config, setConfig] = useState<ContextValue>();
  const [retryTime, setRetryTime] = useState<number>(0);

  useEffect(() => {
    setConfigStatus(ConfigStatus.LOADING);
    const localConfigKey = `wrap-config-${initConfig.environmentName}`;
    const localConfig = localStorage.getItem(localConfigKey);

    if (localConfig != null) {
      setConfig(JSON.parse(localConfig));
      setConfigStatus(ConfigStatus.LOADED);
    }

    const indexerApi = new IndexerApi(initConfig.indexerUrl);
    const statisticsApi = new StatisticsApi(initConfig.statisticsUrl);

    const loadConfig = async () => {
      const indexerConfig = await indexerApi.getConfiguration();
      const farmingConfiguration = await indexerApi.fetchFarmingConfiguration();
      const stakingApies = await statisticsApi.fetchStakingApy();

      const farms = farmingConfiguration.contracts.reduce(
        (validFarms: FarmConfig[], farmConfiguration) => {
          const tokenMetadata = indexerConfig.tokens.find(
            (t) =>
              t.tezosWrappingContract === farmConfiguration.token &&
              t.tezosTokenId === farmConfiguration.tokenId
          );
          if (tokenMetadata) {
            const apy = stakingApies.find(s => s.farmingContract === farmConfiguration.contract);
            validFarms.push({
              maxTotalStakedLevelProcessed: farmConfiguration.maxLevelProcessed,
              farmContractAddress: farmConfiguration.contract,
              farmContractLink:
                initConfig.tzktLink + farmConfiguration.contract,
              farmTotalStaked: farmConfiguration.totalStaked,
              farmStakedToken: initConfig.farmInput,
              rewardTokenName: tokenMetadata.tezosName,
              rewardTokenThumbnailUri: tokenMetadata.thumbnailUri,
              rewardTokenContractAddress: farmConfiguration.token,
              rewardTokenId: parseInt(farmConfiguration.tokenId),
              rewardTokenDecimals: tokenMetadata.decimals,
              rewardTokenSymbol: tokenMetadata.tezosSymbol,
              rewards: farmConfiguration.rewards,
              apy: apy ? parseFloat(apy.apy).toFixed(0) : undefined,
              apr: apy ? parseFloat(apy.apr).toFixed(0) : undefined
            });
          }
          return validFarms;
        },
        []
      );

      const oldFarms = stoppedFarms.contracts.reduce((validFarms: FarmConfig[], farmConfiguration) => {
        const tokenMetadata = indexerConfig.tokens.find(
          (t) =>
            t.tezosWrappingContract === farmConfiguration.token &&
            t.tezosTokenId === farmConfiguration.tokenId
        );
        if (tokenMetadata) {
          validFarms.push({
            maxTotalStakedLevelProcessed: 0,
            farmContractAddress: farmConfiguration.contract,
            farmContractLink: initConfig.tzktLink + farmConfiguration.contract,
            farmTotalStaked: farmConfiguration.totalStaked,
            farmStakedToken: initConfig.farmInput,
            rewardTokenName: tokenMetadata.tezosName,
            rewardTokenThumbnailUri: tokenMetadata.thumbnailUri,
            rewardTokenContractAddress: farmConfiguration.token,
            rewardTokenId: parseInt(farmConfiguration.tokenId),
            rewardTokenDecimals: tokenMetadata.decimals,
            rewardTokenSymbol: tokenMetadata.tezosSymbol,
            rewards: undefined
          });
        }
        return validFarms;
      }, []);


      const config = {
        environmentName: initConfig.environmentName,
        indexerUrl: initConfig.indexerUrl,
        statisticsUrl: initConfig.statisticsUrl,
        tzktLink: initConfig.tzktLink,
        etherscanLink: initConfig.etherscanLink,
        ethereum: {
          ...initConfig.ethereum,
          custodianContractAddress: indexerConfig.ethereumWrapContract
        },
        tezos: {
          ...initConfig.tezos,
          minterContractAddress: indexerConfig.tezosMinterContract,
          quorumContractAddress: indexerConfig.tezosQuorumContract
        },
        wrapSignatureThreshold: indexerConfig.wrapRequiredSignatures,
        unwrapSignatureThreshold: indexerConfig.unwrapRequiredSignatures,
        fungibleTokens: indexerConfig.tokens
          .filter((t) => t.type === TokenType.ERC20)
          .reduce<Record<string, FungibleToken>>((acc, e) => {
            if (e.type !== TokenType.ERC20) {
              return acc;
            }
            acc[e.ethereumSymbol] = e;
            return acc;
          }, {}),
        nonFungibleTokens: indexerConfig.tokens
          .filter((t) => t.type === TokenType.ERC721)
          .reduce<Record<string, NonFungibleToken>>((acc, e) => {
            if (e.type !== TokenType.ERC721) {
              return acc;
            }
            acc[e.ethereumSymbol] = e;
            return acc;
          }, {}),
        fees: indexerConfig.fees,
        farms,
        farmInput: initConfig.farmInput,
        oldFarms
      };
      localStorage.setItem(localConfigKey, JSON.stringify(config));
      setConfig(config);
      setConfigStatus(ConfigStatus.LOADED);
    };

    const loadingWithRetries = async (counter = 1) => {
      try {
        await loadConfig();
      } catch (_) {
        const retrySecond = getTimeFromRetryCounter(counter);
        console.warn(`Error fetching indexer config, retry in ${retrySecond}`);
        setRetryTime(retrySecond);
        await setTimeout(
          () => loadingWithRetries(counter + 1),
          retrySecond * 1000
        );
      }
    };

  // noinspection JSIgnoredPromiseFromCall
    loadingWithRetries();
  }, []);

  return (
    <>
      {configStatus !== ConfigStatus.LOADED ? (
          <LoadingScreen retryTime={retryTime}/>
        ):(
        <ConfigContext.Provider value={config}>
          {children}
        </ConfigContext.Provider>
      )}
    </>
  );
}
