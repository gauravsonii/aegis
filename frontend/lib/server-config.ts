import { Keypair } from "@stellar/stellar-sdk";
import dotenv from "dotenv";
import { resolve } from "node:path";

for (const envPath of [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", ".env"),
  resolve(process.cwd(), "frontend", ".env"),
]) {
  dotenv.config({ path: envPath, override: false });
}

export type WalletConfig = {
  label: string;
  secret: string;
  publicKey: string;
};

export type AppConfig = {
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  reflectorId: string;
  usdcTokenId: string;
  commitVerifierId: string;
  tallyUpdateVerifierId?: string;
  tallyFinalizeVerifierId?: string;
  claimVerifierId: string;
  wallets: WalletConfig[];
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}

function wallet(label: string, secret: string | undefined): WalletConfig | null {
  if (!secret) {
    return null;
  }

  const keypair = Keypair.fromSecret(secret);
  return {
    label,
    secret,
    publicKey: keypair.publicKey(),
  };
}

export function getAppConfig(options: { allowMissing?: boolean } = {}): AppConfig | null {
  const wallets = [
    wallet("admin", process.env.ADMIN_SECRET_KEY),
    wallet("user2", process.env.USER2_SECRET_KEY),
    wallet("user3", process.env.USER3_SECRET_KEY),
  ].filter((entry): entry is WalletConfig => Boolean(entry));

  if (wallets.length === 0) {
    if (options.allowMissing) {
      return null;
    }
    throw new Error("no demo wallets found in .env");
  }

  const requiredEnvNames = [
    "STELLAR_RPC",
    "STELLAR_NETWORK",
    "MARKET_CONTRACT_ID",
    "REFLECTOR_ID",
    "USDC_TOKEN_ID",
    "COMMIT_VERIFIER_ID",
    "CLAIM_VERIFIER_ID",
  ];
  if (options.allowMissing && requiredEnvNames.some((name) => !process.env[name])) {
    return null;
  }

  return {
    rpcUrl: requireEnv("STELLAR_RPC"),
    networkPassphrase: requireEnv("STELLAR_NETWORK"),
    contractId: requireEnv("MARKET_CONTRACT_ID"),
    reflectorId: requireEnv("REFLECTOR_ID"),
    usdcTokenId: requireEnv("USDC_TOKEN_ID"),
    commitVerifierId: requireEnv("COMMIT_VERIFIER_ID"),
    tallyUpdateVerifierId: optionalEnv("TALLY_UPDATE_VERIFIER_ID"),
    tallyFinalizeVerifierId: optionalEnv("TALLY_FINALIZE_VERIFIER_ID"),
    claimVerifierId: requireEnv("CLAIM_VERIFIER_ID"),
    wallets,
  };
}
