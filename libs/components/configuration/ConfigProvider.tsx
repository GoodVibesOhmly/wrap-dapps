import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Config, InitialConfig } from './types';
import { FungibleToken, IndexerApi, NonFungibleToken, TokenType } from '@wrap-dapps/api';
import { CircularProgress, Container } from '@material-ui/core';

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

type Props = {
  initConfig: InitialConfig
}

export function ConfigProvider({ children, initConfig }: PropsWithChildren<Props>) {
  const [config, setConfig] = useState<ContextValue>();

  useEffect(() => {
    const indexerApi = new IndexerApi(initConfig.indexerUrl);

    const loadConfig = async () => {
      const indexerConfig = await indexerApi.getConfiguration();

      const config = {
        environmentName: initConfig.environmentName,
        indexerUrl: initConfig.indexerUrl,
        statisticsUrl: initConfig.statisticsUrl,
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
        fees: indexerConfig.fees
      };
      setConfig(config);
    };
    // noinspection JSIgnoredPromiseFromCall
    loadConfig();
  }, []);

  return (
    <>
      {!config ? (
        <Container maxWidth='lg'
                   sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 10 }}>
          <CircularProgress color='primary' />
        </Container>
      ) : (
        <ConfigContext.Provider value={config}>
          {children}
        </ConfigContext.Provider>
      )}
    </>
  );
}
