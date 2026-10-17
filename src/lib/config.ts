export const PROJECT_DEPLOYMENT = "0x7079320d70566B02f208925C2aa366Eff870c567";
export const CONTRACT_ADDRESS = (String(import.meta.env.VITE_CONTRACT_ADDRESS ?? "").trim() || PROJECT_DEPLOYMENT) as `0x${string}` | "";

// Same-origin proxy declared in BOTH vite.config.ts and vercel.json.
// Every read, every receipt poll and the write client use this one URL.
export const RPC_PATH = "/genlayer-rpc";

export const STUDIONET_CHAIN_ID = 61999;
export const STUDIONET_CHAIN_HEX = "0xf22f";
// Only used when MetaMask must add the network (wallet_addEthereumChain needs an absolute URL).
export const WALLET_ADD_RPC = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

export const SOURCE_SHA256 = "53647f007c58545d0cfc8dc23adb7b0d5b562e85ad9133a0d7c2eb395b6ff69e";

export const RECEIPT_TIMEOUT_MS = 150_000;
export const RECEIPT_POLL_MS = 3_000;
