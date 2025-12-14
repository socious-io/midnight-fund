import type { CrowdfundingContractProviders, DeployedCrowdfundingAPI } from "@crowdfunding/crowdfunding-api";
import type { DAppConnectorWalletAPI, ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";


export interface WalletAndProvider{
    readonly wallet: DAppConnectorWalletAPI,
    readonly uris: ServiceUriConfig,
    readonly providers: CrowdfundingContractProviders
}

export interface WalletAPI {
  wallet: DAppConnectorWalletAPI;
  coinPublicKey: string;
  encryptionPublicKey: string;
  uris: ServiceUriConfig;
}


export interface CrowdfundingDeployment{
  status: "inprogress" | "deployed" | "failed",
  api: DeployedCrowdfundingAPI;
}