// Chain registry — mirrors 01_architecture.md + 11_fees.md
// Logos use CoinGecko coin images (real, public).

export type ChainId =
  | "ethereum" | "arbitrum" | "base" | "optimism" | "bnb" | "polygon" | "avalanche"
  | "zksync" | "linea" | "scroll"
  | "solana" | "bitcoin" | "litecoin" | "bitcoin-cash" | "dogecoin"
  | "tron" | "ton" | "monero" | "zcash" | "cosmos" | "osmosis" | "injective"
  | "xrp";

export type ChainKind = "evm" | "svm" | "utxo" | "tron" | "ton" | "cosmos" | "xrp" | "zcash" | "monero";

export interface Chain {
  id: ChainId;
  name: string;
  shortName: string;
  symbol: string;          // native token
  kind: ChainKind;
  decimals: number;
  logo: string;            // chain logo url
  nativeCoinId: string;    // CoinGecko id for native token price
  bip44: number;           // coin_type
  fixedFeeUsd: [number, number]; // [min, max]
  confirmations: number;
  blockTimeMs: number;
  explorerTx: (h: string) => string;
  explorerAddr: (a: string) => string;
  addressPrefix?: string;
  toVault: "maya" | "thorchain" | "near" | "direct" | "bridge"; // route to ZEC vault
  shielded?: boolean;
}

const cg = (id: string) => `https://assets.coingecko.com/coins/images/${id}/large.png`;

export const CHAINS: Chain[] = [
  { id: "ethereum", name: "Ethereum", shortName: "ETH", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("279/large/ethereum.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 12, blockTimeMs: 12000,
    explorerTx: (h) => `https://etherscan.io/tx/${h}`,
    explorerAddr: (a) => `https://etherscan.io/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "arbitrum", name: "Arbitrum One", shortName: "ARB", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("16547/large/arb.jpg"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 250,
    explorerTx: (h) => `https://arbiscan.io/tx/${h}`,
    explorerAddr: (a) => `https://arbiscan.io/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "base", name: "Base", shortName: "BASE", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("279/large/ethereum.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 2000,
    explorerTx: (h) => `https://basescan.org/tx/${h}`,
    explorerAddr: (a) => `https://basescan.org/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "optimism", name: "Optimism", shortName: "OP", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("25244/large/Optimism.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 2000,
    explorerTx: (h) => `https://optimistic.etherscan.io/tx/${h}`,
    explorerAddr: (a) => `https://optimistic.etherscan.io/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "bnb", name: "BNB Smart Chain", shortName: "BNB", symbol: "BNB", kind: "evm", decimals: 18,
    logo: cg("825/large/bnb-icon2_2x.png"), nativeCoinId: "binancecoin", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 15, blockTimeMs: 3000,
    explorerTx: (h) => `https://bscscan.com/tx/${h}`,
    explorerAddr: (a) => `https://bscscan.com/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "polygon", name: "Polygon", shortName: "POL", symbol: "POL", kind: "evm", decimals: 18,
    logo: cg("32440/large/polygon.png"), nativeCoinId: "matic-network", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 30, blockTimeMs: 2000,
    explorerTx: (h) => `https://polygonscan.com/tx/${h}`,
    explorerAddr: (a) => `https://polygonscan.com/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "avalanche", name: "Avalanche C", shortName: "AVAX", symbol: "AVAX", kind: "evm", decimals: 18,
    logo: cg("12559/large/Avalanche_Circle_RedWhite_Trans.png"), nativeCoinId: "avalanche-2", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 2000,
    explorerTx: (h) => `https://snowtrace.io/tx/${h}`,
    explorerAddr: (a) => `https://snowtrace.io/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "zksync", name: "zkSync Era", shortName: "ZKS", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("25344/large/zk.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 1000,
    explorerTx: (h) => `https://explorer.zksync.io/tx/${h}`,
    explorerAddr: (a) => `https://explorer.zksync.io/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "linea", name: "Linea", shortName: "LINEA", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("279/large/ethereum.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 2000,
    explorerTx: (h) => `https://lineascan.build/tx/${h}`,
    explorerAddr: (a) => `https://lineascan.build/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "scroll", name: "Scroll", shortName: "SCRL", symbol: "ETH", kind: "evm", decimals: 18,
    logo: cg("279/large/ethereum.png"), nativeCoinId: "ethereum", bip44: 60,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 3000,
    explorerTx: (h) => `https://scrollscan.com/tx/${h}`,
    explorerAddr: (a) => `https://scrollscan.com/address/${a}`,
    addressPrefix: "0x", toVault: "maya" },
  { id: "solana", name: "Solana", shortName: "SOL", symbol: "SOL", kind: "svm", decimals: 9,
    logo: cg("4128/large/solana.png"), nativeCoinId: "solana", bip44: 501,
    fixedFeeUsd: [0.001, 0.001], confirmations: 32, blockTimeMs: 400,
    explorerTx: (h) => `https://solscan.io/tx/${h}`,
    explorerAddr: (a) => `https://solscan.io/account/${a}`,
    toVault: "near" },
  { id: "bitcoin", name: "Bitcoin", shortName: "BTC", symbol: "BTC", kind: "utxo", decimals: 8,
    logo: cg("1/large/bitcoin.png"), nativeCoinId: "bitcoin", bip44: 0,
    fixedFeeUsd: [0.5, 2.0], confirmations: 3, blockTimeMs: 600000,
    explorerTx: (h) => `https://mempool.space/tx/${h}`,
    explorerAddr: (a) => `https://mempool.space/address/${a}`,
    addressPrefix: "bc1", toVault: "thorchain" },
  { id: "litecoin", name: "Litecoin", shortName: "LTC", symbol: "LTC", kind: "utxo", decimals: 8,
    logo: cg("2/large/litecoin.png"), nativeCoinId: "litecoin", bip44: 2,
    fixedFeeUsd: [0.1, 0.5], confirmations: 6, blockTimeMs: 150000,
    explorerTx: (h) => `https://blockchair.com/litecoin/transaction/${h}`,
    explorerAddr: (a) => `https://blockchair.com/litecoin/address/${a}`,
    addressPrefix: "ltc1", toVault: "thorchain" },
  { id: "bitcoin-cash", name: "Bitcoin Cash", shortName: "BCH", symbol: "BCH", kind: "utxo", decimals: 8,
    logo: cg("780/large/bitcoin-cash-circle.png"), nativeCoinId: "bitcoin-cash", bip44: 145,
    fixedFeeUsd: [0.1, 0.3], confirmations: 6, blockTimeMs: 600000,
    explorerTx: (h) => `https://blockchair.com/bitcoin-cash/transaction/${h}`,
    explorerAddr: (a) => `https://blockchair.com/bitcoin-cash/address/${a}`,
    addressPrefix: "q", toVault: "thorchain" },
  { id: "dogecoin", name: "Dogecoin", shortName: "DOGE", symbol: "DOGE", kind: "utxo", decimals: 8,
    logo: cg("5/large/dogecoin.png"), nativeCoinId: "dogecoin", bip44: 3,
    fixedFeeUsd: [0.1, 0.5], confirmations: 6, blockTimeMs: 60000,
    explorerTx: (h) => `https://dogechain.info/tx/${h}`,
    explorerAddr: (a) => `https://dogechain.info/address/${a}`,
    addressPrefix: "D", toVault: "thorchain" },
  { id: "tron", name: "TRON", shortName: "TRX", symbol: "TRX", kind: "tron", decimals: 6,
    logo: cg("1094/large/tron-logo.png"), nativeCoinId: "tron", bip44: 195,
    fixedFeeUsd: [0.5, 1.0], confirmations: 19, blockTimeMs: 3000,
    explorerTx: (h) => `https://tronscan.org/#/transaction/${h}`,
    explorerAddr: (a) => `https://tronscan.org/#/address/${a}`,
    addressPrefix: "T", toVault: "bridge" },
  { id: "ton", name: "TON", shortName: "TON", symbol: "TON", kind: "ton", decimals: 9,
    logo: cg("17980/large/ton_symbol.png"), nativeCoinId: "the-open-network", bip44: 607,
    fixedFeeUsd: [0.05, 0.05], confirmations: 1, blockTimeMs: 5000,
    explorerTx: (h) => `https://tonviewer.com/transaction/${h}`,
    explorerAddr: (a) => `https://tonviewer.com/${a}`,
    addressPrefix: "EQ", toVault: "bridge" },
  { id: "monero", name: "Monero", shortName: "XMR", symbol: "XMR", kind: "monero", decimals: 12,
    logo: cg("69/large/monero_logo.png"), nativeCoinId: "monero", bip44: 128,
    fixedFeeUsd: [0.01, 0.01], confirmations: 10, blockTimeMs: 120000,
    explorerTx: (h) => `https://xmrchain.net/tx/${h}`,
    explorerAddr: (a) => `https://xmrchain.net/address/${a}`,
    addressPrefix: "4", toVault: "direct", shielded: true },
  { id: "zcash", name: "Zcash", shortName: "ZEC", symbol: "ZEC", kind: "zcash", decimals: 8,
    logo: cg("486/large/circle-zcash-color.png"), nativeCoinId: "zcash", bip44: 133,
    fixedFeeUsd: [0.006, 0.006], confirmations: 5, blockTimeMs: 75000,
    explorerTx: (h) => `https://blockchair.com/zcash/transaction/${h}`,
    explorerAddr: (a) => `https://blockchair.com/zcash/address/${a}`,
    addressPrefix: "zs1", toVault: "direct", shielded: true },
  { id: "cosmos", name: "Cosmos Hub", shortName: "ATOM", symbol: "ATOM", kind: "cosmos", decimals: 6,
    logo: cg("1481/large/cosmos_hub.png"), nativeCoinId: "cosmos", bip44: 118,
    fixedFeeUsd: [0.01, 0.01], confirmations: 1, blockTimeMs: 7000,
    explorerTx: (h) => `https://www.mintscan.io/cosmos/txs/${h}`,
    explorerAddr: (a) => `https://www.mintscan.io/cosmos/account/${a}`,
    addressPrefix: "cosmos1", toVault: "thorchain" },
  { id: "osmosis", name: "Osmosis", shortName: "OSMO", symbol: "OSMO", kind: "cosmos", decimals: 6,
    logo: cg("16724/large/osmo.png"), nativeCoinId: "osmosis", bip44: 118,
    fixedFeeUsd: [0.01, 0.01], confirmations: 1, blockTimeMs: 6000,
    explorerTx: (h) => `https://www.mintscan.io/osmosis/txs/${h}`,
    explorerAddr: (a) => `https://www.mintscan.io/osmosis/account/${a}`,
    addressPrefix: "osmo1", toVault: "thorchain" },
  { id: "injective", name: "Injective", shortName: "INJ", symbol: "INJ", kind: "cosmos", decimals: 18,
    logo: cg("12882/large/Secondary_Symbol.png"), nativeCoinId: "injective-protocol", bip44: 60,
    fixedFeeUsd: [0.01, 0.01], confirmations: 1, blockTimeMs: 1000,
    explorerTx: (h) => `https://explorer.injective.network/transaction/${h}`,
    explorerAddr: (a) => `https://explorer.injective.network/account/${a}`,
    addressPrefix: "inj", toVault: "thorchain" },
  { id: "xrp", name: "XRP Ledger", shortName: "XRP", symbol: "XRP", kind: "xrp", decimals: 6,
    logo: cg("44/large/xrp-symbol-white-128.png"), nativeCoinId: "ripple", bip44: 144,
    fixedFeeUsd: [0.001, 0.001], confirmations: 1, blockTimeMs: 4000,
    explorerTx: (h) => `https://livenet.xrpl.org/transactions/${h}`,
    explorerAddr: (a) => `https://livenet.xrpl.org/accounts/${a}`,
    addressPrefix: "r", toVault: "bridge" },
];

export const getChain = (id: string): Chain | undefined => CHAINS.find((c) => c.id === id);
export const evmChains = () => CHAINS.filter((c) => c.kind === "evm");
export const vaultRouteLabel = (c: Chain): string => {
  switch (c.toVault) {
    case "direct": return "Direct ZEC";
    case "maya": return "Maya Protocol";
    case "thorchain": return "THORChain";
    case "near": return "NEAR Intents";
    case "bridge": return "Bridge → Maya";
  }
};
