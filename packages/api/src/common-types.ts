import {
  Contract,
  Witnesses,
  CrowdfundingPrivateState,
  Project,
  ProjectStatus,
} from "@crowdfunding/crowdfunding-contract";

import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const CrowdfundingPrivateStateId = "crowdfundingPrivateState";
export type CrowdfundingPrivateStateId = typeof CrowdfundingPrivateStateId;
export type CrowdfundingContract = Contract<
  CrowdfundingPrivateState,
  Witnesses<CrowdfundingPrivateState>
>;
export type TokenCircuitKeys = Exclude<
  keyof CrowdfundingContract["impureCircuits"],
  number | symbol
>;
export type CrowdfundingContractProviders = MidnightProviders<
  TokenCircuitKeys,
  CrowdfundingPrivateStateId,
  CrowdfundingPrivateState
>;
export type DeployedCrowdfundingOnchainContract =
  FoundContract<CrowdfundingContract>;
export type DerivedCrowdfundingContractState = {
  readonly protocolTVL: DerivedProtocolTotal[];
  readonly projects: DerivedProject[];
};

export type DerivedProtocolTotal = {
  id: string;
  pool_balance: {
    nonce: Uint8Array;
    color: Uint8Array;
    value: bigint;
    mt_index: bigint;
  };
};

export type DerivedProject = {
  id: string;
  project: Project;
};
