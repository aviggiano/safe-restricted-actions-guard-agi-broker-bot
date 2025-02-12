import { Chains, TokenMetadata } from "./types.ts";

export const CHAIN_NAMES: Record<number, string> = {
    [Chains.optimism]: "Optimism",
    [Chains.arbitrum]: "Arbitrum",
    [Chains.avalanche]: "Avalanche",
    [Chains.linea]: "Linea",
    [Chains.celo]: "Celo",
} as const;

export const CHAIN_EXPLORERS: Record<number, string> = {
    [Chains.optimism]: "https://optimistic.etherscan.io",
    [Chains.arbitrum]: "https://arbiscan.io",
    [Chains.avalanche]: "https://snowtrace.io",
    [Chains.linea]: "https://lineascan.build",
    [Chains.celo]: "https://explorer.celo.org",
} as const;

export const ALLOWED_TOKENS: Record<number, string[]> = {
    [Chains.optimism]: ["USDC", "USDT", "WETH"],
    [Chains.arbitrum]: ["USDC", "USDT", "WETH"],
    [Chains.avalanche]: ["USDC", "USDT", "WAVAX"],
    [Chains.linea]: ["USDC", "USDT", "WETH"],
    [Chains.celo]: ["CUSD", "CEUR", "CELO"],
} as const;

export const UNISWAP_V3_FACTORY_ADDRESS: Record<number, string> = {
    [Chains.optimism]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [Chains.arbitrum]: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    [Chains.avalanche]: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD",
    [Chains.linea]: "0x31FAfd4889FA1269F7a13A66eE0fB458f27D72A9",
    [Chains.celo]: "0xAfE208a311B21f13EF87E33A90049fC17A7acDEc",
} as const;

export const UNISWAP_V3_SWAP_ROUTER_ADDRESS: Record<number, string> = {
    [Chains.optimism]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    [Chains.arbitrum]: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    [Chains.avalanche]: "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE",
    [Chains.linea]: "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
    [Chains.celo]: "0x5615CDAb10dc425a742d643d949a7F474C01abc4",
} as const;

export const NATIVE_TOKEN_ADDRESS =
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const NATIVE_TOKENS: Record<number, TokenMetadata> = {
    [Chains.optimism]: {
        chainId: Chains.optimism,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: NATIVE_TOKEN_ADDRESS,
        type: "NATIVE",
        logoURI:
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png",
    },
    [Chains.arbitrum]: {
        chainId: Chains.arbitrum,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: NATIVE_TOKEN_ADDRESS,
        type: "NATIVE",
        logoURI:
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png",
    },
    [Chains.avalanche]: {
        chainId: Chains.avalanche,
        name: "Avalanche",
        symbol: "AVAX",
        decimals: 18,
        address: NATIVE_TOKEN_ADDRESS,
        type: "NATIVE",
        logoURI:
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanche/info/logo.png",
    },
    [Chains.linea]: {
        chainId: Chains.linea,
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: NATIVE_TOKEN_ADDRESS,
        type: "NATIVE",
        logoURI:
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/linea/info/logo.png",
    },
    [Chains.celo]: {
        chainId: Chains.celo,
        name: "Celo",
        symbol: "CELO",
        decimals: 18,
        address: NATIVE_TOKEN_ADDRESS,
        type: "NATIVE",
        logoURI:
            "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/celo/info/logo.png",
    },
};
