import {
  MerkleTreePath,
  WitnessContext,
} from "@midnight-ntwrk/compact-runtime";
import { Ledger } from "./managed/crowdfunding/contract/index.cjs";

export type CrowdfundingPrivateState = {
  readonly secrete_key: Uint8Array;
};

export const createCrowdfundingPrivateState = (secrete_key: Uint8Array) => ({
  secrete_key,
});

export const witnesses = {
  local_secret_key: ({
    privateState,
  }: WitnessContext<Ledger, CrowdfundingPrivateState>): [
    CrowdfundingPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secrete_key],

  // Generates proof that a user is part of the contributors onchain
  findContributor: (
    context: WitnessContext<Ledger, CrowdfundingPrivateState>,
    item: Uint8Array
  ): [CrowdfundingPrivateState, MerkleTreePath<Uint8Array>] => {
    return [
      context.privateState,
      context.ledger.contributors.findPathForLeaf(item)!,
    ];
  },

  // Confirms if a project has expired
  confirm_project_expiration: (
    { privateState }: WitnessContext<Ledger, CrowdfundingPrivateState>,
    duration: bigint,
    startDate: bigint
  ): [CrowdfundingPrivateState, boolean] => {
    const millisecondsPerHour = 1000 * 60 * 60 * 24;
    const durationInMilliseconds = millisecondsPerHour * Number(duration);
    const expiryDate = Number(startDate) + durationInMilliseconds;
    const currentDate = Date.now();
    
    return [privateState, expiryDate >= currentDate];
  },
};
