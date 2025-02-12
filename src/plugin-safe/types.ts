export enum Chains {
    arbitrum = 42161,
    avalanche = 43114,
    celo = 42220,
    linea = 59144,
    optimism = 10,
}

export interface TokenMetadata {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    type: string;
}

export interface TrustWalletTokenMetadata {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
    type: string;
    pairs: string[];
}

export interface ViaProtocolTokenMetadata {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    chainId: number;
    logoURI: string;
    coingeckoId: string;
    listedIn: string[];
}

export interface TrustWalletGithubJson {
    name: string;
    logoURI: string;
    timestamp: string;
    tokens: TrustWalletTokenMetadata[];
}

export interface SwapContent {
    sellTokenSymbol: string;
    sellAmount: number;
    buyTokenSymbol: string;
    chain: string;
}

export interface LineaTokenListResponse {
    items: {
        address: string;
        decimals: string;
        name: string;
        symbol: string;
        type: string;
    }[];
}

export interface OptimismTokenListResponse {
    name: string;
    logoURI: string;
    keywords: string[];
    timestamp: string;
    tokens: {
        chainId: number;
        address: string;
        name: string;
        symbol: string;
        decimals: number;
        logoURI: string;
        extensions: {
            optimismBridgeAddress: string;
            baseBridgeAddress: string;
            opListId: string;
            opTokenId: string;
        }
    }[];
}
