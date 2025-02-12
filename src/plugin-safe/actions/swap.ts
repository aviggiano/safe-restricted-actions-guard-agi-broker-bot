import {
    Action,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    elizaLogger,
    ModelClass,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { Address, decodeErrorResult, encodeFunctionData, erc20Abi, parseUnits, PublicClient, toHex } from "viem";
import { CHAIN_EXPLORERS, ALLOWED_TOKENS, UNISWAP_V3_SWAP_ROUTER_ADDRESS } from "../constants.ts";
import { getSafe, getWalletClient } from "../hooks/useGetWalletClient.ts";
import { restrictedActionsGuardAbi } from "../abi/restrictedActionsGuardAbi.ts";
import {
    FeeAmount,
} from "@uniswap/v3-sdk";
import {
    Token,
    CurrencyAmount,
} from "@uniswap/sdk-core";
import { OperationType } from "@safe-global/types-kit";
import { Chains, SwapContent } from "../types.ts";
import { z } from "zod";
import { swapTemplate } from "../templates.ts";
import { EVMTokenRegistry } from "../EVMtokenRegistry.ts";
import { swapRouter02Abi } from "../abi/swapRouter02Abi.ts";
import { SigningMethod } from "@safe-global/protocol-kit";

export const SwapSchema = z.object({
    sellTokenSymbol: z.string().nullable(),
    sellAmount: z.number().nullable(),
    buyTokenSymbol: z.string().nullable(),
    chain: z.string().nullable(),
});

const allowance = async (client: PublicClient, tokenAddress: Address, ownerAddress: Address, spenderAddress: Address) => {
    elizaLogger.info("Getting allowance for:", { tokenAddress, ownerAddress, spenderAddress });
    return await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [ownerAddress, spenderAddress],
    });
}

export const swap: Action = {
    name: "SWAP",
    similes: [
        "TRADE",
        "EXCHANGE",
        "SWAP_TOKENS_SAFE_SMART_ACCOUNT",
        "SWAP_TOKENS_SAFE_SMART_WALLET",
        "TOKEN_SWAP_SAFE",
        "TOKEN_SWAP_SAFE_SMART_ACCOUNT",
        "TOKEN_SWAP_SAFE_SMART_WALLET",
        "TRADE_TOKENS_SAFE",
        "TRADE_TOKENS_SAFE_SMART_ACCOUNT",
        "TRADE_TOKENS_SAFE_SMART_WALLET",
        "EXCHANGE_TOKENS_SAFE",
        "EXCHANGE_TOKENS_SAFE_SMART_ACCOUNT",
        "EXCHANGE_TOKENS_SAFE_SMART_WALLET",
    ],
    description: "Execute a token swap using a Safe Smart Account",
    validate: async (runtime: IAgentRuntime) => {
        return (
            !!runtime.getSetting("SAFE_OWNER_PRIVATE_KEY") &&
            !!runtime.getSetting("SAFE_ADDRESS")
        );
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: Record<string, unknown>,
        callback: HandlerCallback
    ) => {
        try {
            const supportedChains = Object.keys(Chains).join(" | ");

            state = !state
                ? await runtime.composeState(message, { supportedChains })
                : await runtime.updateRecentMessageState(state);

            const context = composeContext({
                state,
                template: swapTemplate,
            });

            const content = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: SwapSchema as any,
            });

            if (!isSwapContent(content.object)) {
                const missingFields = getMissingSwapContent(
                    content.object
                );
                callback({
                    text: `Need more information about the swap. Please provide me ${missingFields}`,
                });
                return;
            }

            elizaLogger.info("Swap content:", content.object);

            const { sellTokenSymbol, sellAmount, buyTokenSymbol, chain } =
                content.object;

            const chainId = Chains[chain.toLowerCase() as keyof typeof Chains];
            if (!chainId) {
                callback({
                    text: `Unsupported chain: ${chain}. Supported chains are: ${Object.keys(
                        Chains
                    )
                        .filter((k) => isNaN(Number(k)))
                        .join(", ")}`,
                });
                return;
            }

            const evmTokenRegistry = EVMTokenRegistry.getInstance();
            if (evmTokenRegistry.isChainSupported(chainId)) {
                await evmTokenRegistry.initializeChain(chainId);
            } else {
                callback({
                    text: `Chain ${chain} is not supported for token swaps.`,
                });
                return;
            }

            const sellTokenMetadata = evmTokenRegistry.getTokenBySymbol(
                sellTokenSymbol,
                chainId
            );
            const buyTokenMetadata = evmTokenRegistry.getTokenBySymbol(
                buyTokenSymbol,
                chainId
            );

            if (!sellTokenMetadata || !buyTokenMetadata) {
                const missingTokens = [];
                if (!sellTokenMetadata) missingTokens.push(`'${sellTokenSymbol}'`);
                if (!buyTokenMetadata) missingTokens.push(`'${buyTokenSymbol}'`);

                callback({
                    text: `Token${missingTokens.length > 1 ? 's' : ''} ${missingTokens.join(' and ')} not found on ${chain}. Please check the token symbols and chain.`,
                });
                return;
            }

            elizaLogger.info("Swap details:", {
                sellToken: sellTokenMetadata,
                buyToken: buyTokenMetadata,
                amount: sellAmount,
                chain
            });

            const sellAmountBaseUnits = parseUnits(
                sellAmount.toString(),
                sellTokenMetadata.decimals
            ).toString();

            const client = getWalletClient(chainId, runtime.getSetting("SAFE_OWNER_PRIVATE_KEY") as `0x${string}`);

            const INPUT_AMOUNT = sellAmountBaseUnits;
            const OUTPUT_AMOUNT = "0";

            const sellToken = new Token(chainId, sellTokenMetadata.address, sellTokenMetadata.decimals, sellTokenMetadata.symbol, sellTokenMetadata.name);
            const buyToken = new Token(chainId, buyTokenMetadata.address, buyTokenMetadata.decimals, buyTokenMetadata.symbol, buyTokenMetadata.name);

            const safe = await getSafe(chainId, runtime.getSetting("SAFE_OWNER_PRIVATE_KEY") as `0x${string}`, runtime.getSetting("SAFE_ADDRESS") as `0x${string}`);

            const protocolKit = await safe.connect({
                provider: client,
                signer: runtime.getSetting("SAFE_OWNER_PRIVATE_KEY") as `0x${string}`
            })

            const safeAddress = await safe.getAddress();

            elizaLogger.info("Safe address:", safeAddress);

            elizaLogger.info("approve", UNISWAP_V3_SWAP_ROUTER_ADDRESS[chainId]);

            if (await allowance(client, sellToken.address as Address, safeAddress as Address, UNISWAP_V3_SWAP_ROUTER_ADDRESS[chainId] as Address) < BigInt(INPUT_AMOUNT)) {

                const approve = await safe.createTransaction({
                    transactions: [
                        {
                            to: sellToken.address,
                            value: "0",
                            data: encodeFunctionData({
                                abi: erc20Abi,
                                functionName: "approve",
                                args: [UNISWAP_V3_SWAP_ROUTER_ADDRESS[chainId] as Address, BigInt(INPUT_AMOUNT)],
                            }),
                            operation: OperationType.Call,
                        }
                    ],
                    onlyCalls: false,
                });

                const signedApprove = await protocolKit.signTransaction(
                    approve,
                    SigningMethod.ETH_SIGN_TYPED_DATA_V4
                )

                const approveTxResponse = await safe.executeTransaction(signedApprove);

                elizaLogger.info("Waiting for receipt", approveTxResponse.hash);

                const approveReceipt = await client.waitForTransactionReceipt({
                    hash: approveTxResponse.hash as `0x${string}`,
                });

                if (approveReceipt.status === "success") {
                    elizaLogger.info(`Approve transaction: [${approveReceipt.transactionHash}]`);
                    callback({
                        text: `✅ Approve transaction executed successfully!\nView on Explorer: ${CHAIN_EXPLORERS[chainId]}/tx/${approveReceipt.transactionHash}`,
                        content: { hash: approveReceipt.transactionHash as `0x${string}`, status: "success" },
                    });
                } else {
                    callback({
                        text: `❌ Approve transaction failed! Check transaction: ${CHAIN_EXPLORERS[chainId]}/tx/${approveReceipt.transactionHash}`,
                        content: { hash: approveReceipt.transactionHash as `0x${string}`, status: "failed" },
                    });
                    return false;
                }
            } else {
                callback({
                    text: `✅ Approve transaction already executed!`,
                });
            }

            const swapCalldata = encodeFunctionData({
                abi: swapRouter02Abi,
                functionName: 'exactInputSingle',
                args: [{
                    tokenIn: sellToken.address,
                    tokenOut: buyToken.address,
                    fee: FeeAmount.MEDIUM,
                    recipient: safeAddress,
                    amountIn: INPUT_AMOUNT,
                    amountOutMinimum: OUTPUT_AMOUNT,
                    sqrtPriceLimitX96: 0,
                }]
            });

            elizaLogger.info("Swap", UNISWAP_V3_SWAP_ROUTER_ADDRESS[chainId]);

            const swap = await safe.createTransaction({
                transactions: [
                    {
                        to: UNISWAP_V3_SWAP_ROUTER_ADDRESS[chainId],
                        value: '0',
                        data: swapCalldata,
                        operation: OperationType.Call,
                    }
                ],
                onlyCalls: false,
            });

            const signedSwap = await protocolKit.signTransaction(
                swap,
                SigningMethod.ETH_SIGN_TYPED_DATA_V4
            )

            const swapTxResponse = await safe.executeTransaction(signedSwap);

            elizaLogger.info("Waiting for receipt", swapTxResponse.hash);

            const swapReceipt = await client.waitForTransactionReceipt({
                hash: swapTxResponse.hash as `0x${string}`,
            });

            elizaLogger.info("Done");

            if (swapReceipt.status === "success") {
                elizaLogger.info(`Swap transaction: [${swapReceipt.transactionHash}]`);
                callback({
                    text: `✅ Swap transaction executed successfully!\nView on Explorer: ${CHAIN_EXPLORERS[chainId]}/tx/${swapReceipt.transactionHash}`,
                    content: { hash: swapReceipt.transactionHash as `0x${string}`, status: "success" },
                });
                return true;
            } else {
                callback({
                    text: [`❌ Swap transaction failed! Check transaction: ${CHAIN_EXPLORERS[chainId]}/tx/${swapReceipt.transactionHash}`, `Allowed tokens: ${ALLOWED_TOKENS[chainId].join(', ')}`].join('\n'),
                    content: { hash: swapReceipt.transactionHash as `0x${string}`, status: "failed" },
                });
                return false;
            }
        } catch (error) {
            elizaLogger.error("Swap execution failed:", error);
            const errorMessage = tryGetError(error);
            callback({
                text: `❌ Failed to execute swap: ${errorMessage}`,
                content: { error: errorMessage },
            });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1 WETH for USDC using my Safe smart account on Arbitrum",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me execute the swap for you.",
                    action: "SWAP",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1000 USDC for USDT using my Safe wallet on Avalanche",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I will execute the swap for you.",
                    action: "SWAP",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to swap 5 cEUR for cUSD using my Safe account on Celo",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Executing swap.",
                    action: "SWAP",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to swap 1000 USDC for ETH using my Safe on Linea",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Executing swap now...",
                    action: "SWAP",
                },
            },
        ],
    ],
};

export const isSwapContent = (
    object: any
): object is SwapContent => {
    if (SwapSchema.safeParse(object).success) {
        return true;
    }
    return false;
};

export const getMissingSwapContent = (
    content: Partial<SwapContent>
): string => {
    const missingFields = [];

    if (typeof content.sellTokenSymbol !== "string")
        missingFields.push("sell token");
    if (typeof content.buyTokenSymbol !== "string")
        missingFields.push("buy token");
    if (typeof content.sellAmount !== "number")
        missingFields.push("sell amount");
    if (typeof content.chain !== "string")
        missingFields.push("chain");

    return missingFields.join(" and ");
};

function tryGetError(error: any): string {
    try {
        const decodedError = decodeErrorResult({
            abi: restrictedActionsGuardAbi,
            data: error.cause.raw
        })
        return `${decodedError.errorName}(${decodedError.args?.join(',')})`;
    } catch (error) {
        return error.message || String(error);
    }
}