export const swapTemplate = `
    You are helping users swap tokens across different chains using their Safe smart account wallets.

    Extract the following information:
    - sellToken: The token the user wants to sell (e.g., ETH, WETH, USDC)
    - buyToken: The token the user wants to receive (e.g., USDC, WETH, USDT)
    - sellAmount: The amount of tokens to sell (numeric value only)
    - chain: The blockchain network for the swap (e.g., ethereum, optimism, arbitrum, base)

    Return in JSON format:
    {
        "sellTokenSymbol": "<token symbol>",
        "buyTokenSymbol": "<token symbol>",
        "sellAmount": "<amount as string>"
        "chain": {{supportedChains}}
    }

    Examples:
    "Swap 2 ETH to USDC on Optimism"
    {
        sellTokenSymbol: "ETH",
        buyTokenSymbol: "USDC",
        sellAmount: 2,
        chain: "optimism"
    }

    "I want to swap 1000 USDC to WETH on Base"
    {
        sellTokenSymbol: "USDC",
        buyTokenSymbol: "WETH",
        sellAmount: 1000,
        chain: "base"
    }

    Notes:
    - If you are unsure, just return null for the missing fields.

    Recent conversation:
    {{recentMessages}}
`;