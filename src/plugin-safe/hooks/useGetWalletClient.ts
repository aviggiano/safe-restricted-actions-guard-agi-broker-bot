import {
    createWalletClient,
    http,
    publicActions,
    createTestClient,
    WalletClient,
    PublicClient,
    walletActions,
    Chain,
    defineChain,
} from "viem";

import {
    arbitrum,
    avalanche,
    celo,
    hardhat,
    linea,
    optimism,
} from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import Safe from "@safe-global/protocol-kit";

const CHAIN_CONFIG: Record<number, { chain: Chain; rpcUrl: string }> = {
    10: {
        chain: optimism,
        rpcUrl: process.env.OPTIMISM_RPC_URL,
    },
    42161: {
        chain: arbitrum,
        rpcUrl: process.env.ARBITRUM_RPC_URL,
    },
    43114: {
        chain: avalanche,
        rpcUrl: process.env.AVALANCHE_RPC_URL,
    },
    59144: {
        chain: linea,
        rpcUrl: process.env.LINEA_RPC_URL,
    },
    42220: {
        chain: celo,
        rpcUrl: process.env.CELO_RPC_URL,
    },
} as const;

export const getWalletClient = (
    chainId: number,
    privateKey: `0x${string}`
): WalletClient & PublicClient => {
    const account = privateKeyToAccount(privateKey);

    if (process.env.NODE_ENV === "development") {
        return createTestClient({
            chain: hardhat,
            transport: http(),
            mode: "hardhat",
            account: privateKeyToAccount(
                process.env.WALLET_PRIVATE_KEY as `0x${string}`
            ),
        })
            .extend(walletActions)
            .extend(publicActions) as WalletClient & PublicClient;
    }

    const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
    if (!config) throw new Error(`Chain ID ${chainId} not supported by 0x`);

    const chain = defineChain({
        ...config.chain,
        fees: { 
            ...config.chain.fees,
            baseFeeMultiplier: 1.5,
        },
    });

    return createWalletClient({
        chain,
        transport: http(config.rpcUrl),
        account,
    }).extend(publicActions) as WalletClient & PublicClient;
};

export const getSafe = async (chainId: number, privateKey: `0x${string}`, safeAddress: `0x${string}`) => {
    const config = CHAIN_CONFIG[chainId as keyof typeof CHAIN_CONFIG];
    if (!config) throw new Error(`Chain ID ${chainId} not supported by 0x`);

    console.log("Getting safe for:", { chainId, safeAddress });

    return ((Safe as any).default as any).init({
        provider: config.rpcUrl,
        signer: privateKey,
        safeAddress: safeAddress,
    }) as Safe;
};
