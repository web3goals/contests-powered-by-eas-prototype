import { baseGoerli, Chain } from "wagmi/chains";

interface ChainConfig {
  chain: Chain;
  contracts: {
    profile: `0x${string}`;
  };
  eas: {
    contract: `0x${string}`;
    contestSchemaUid: `0x${string}`;
    evaluationSchemaUid: `0x${string}`;
    graphQl: string;
  };
}

/**
 * Get chain configs defined by environment variables.
 */
export function getSupportedChainConfigs(): ChainConfig[] {
  const chainConfigs: ChainConfig[] = [];
  if (
    process.env.NEXT_PUBLIC_BASE_GOERLI_PROFILE_CONTRACT_ADDRESS &&
    process.env.NEXT_PUBLIC_BASE_GOERLI_EAS_CONTRACT_ADDRESS &&
    process.env.NEXT_PUBLIC_BASE_GOERLI_EAS_CONTEST_SCHEMA_UID &&
    process.env.NEXT_PUBLIC_BASE_GOERLI_EAS_EVALUATION_SCHEMA_UID &&
    process.env.NEXT_PUBLIC_BASE_GOERLI_EAS_GRAPH_QL
  ) {
    chainConfigs.push({
      chain: {
        ...baseGoerli,
        rpcUrls: {
          default: {
            http: ["https://base-goerli.public.blastapi.io"],
          },
          public: {
            http: ["https://base-goerli.public.blastapi.io"],
          },
        },
      },
      contracts: {
        profile: process.env
          .NEXT_PUBLIC_BASE_GOERLI_PROFILE_CONTRACT_ADDRESS as `0x${string}`,
      },
      eas: {
        contract: process.env
          .NEXT_PUBLIC_BASE_GOERLI_EAS_CONTRACT_ADDRESS as `0x${string}`,
        contestSchemaUid: process.env
          .NEXT_PUBLIC_BASE_GOERLI_EAS_CONTEST_SCHEMA_UID as `0x${string}`,
        evaluationSchemaUid: process.env
          .NEXT_PUBLIC_BASE_GOERLI_EAS_EVALUATION_SCHEMA_UID as `0x${string}`,
        graphQl: process.env.NEXT_PUBLIC_BASE_GOERLI_EAS_GRAPH_QL,
      },
    });
  }
  return chainConfigs;
}

/**
 * Get chains using supported chain configs.
 */
export function getSupportedChains(): Chain[] {
  return getSupportedChainConfigs().map((chainConfig) => chainConfig.chain);
}

/**
 * Get the first chain config from supported chains.
 */
export function getDefaultSupportedChainConfig(): ChainConfig {
  const chainConfigs = getSupportedChainConfigs();
  if (chainConfigs.length === 0) {
    throw new Error("Supported chain config is not found");
  } else {
    return chainConfigs[0];
  }
}

/**
 * Return config of specified chain if it supported, otherwise return config of default supported chain.
 */
export function chainToSupportedChainConfig(
  chain: Chain | undefined
): ChainConfig {
  for (const config of getSupportedChainConfigs()) {
    if (config.chain.id === chain?.id) {
      return config;
    }
  }
  return getDefaultSupportedChainConfig();
}
