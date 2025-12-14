import { combineLatest, concat, from, map, Observable, tap } from "rxjs";

import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  CrowdfundingPrivateState,
  CoinInfo,
  createCrowdfundingPrivateState,
  witnesses,
} from "@crowdfunding/crowdfunding-contract";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import { encodeTokenType, nativeToken } from "@midnight-ntwrk/ledger";
import {
  CrowdfundingContract,
  CrowdfundingContractProviders,
  CrowdfundingPrivateStateId,
  DeployedCrowdfundingOnchainContract,
  DerivedCrowdfundingContractState,
} from "./common-types.js";

const CrowdfundingContractInstance: CrowdfundingContract = new Contract(
  witnesses
);

export interface DeployedCrowdfundingAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedCrowdfundingContractState>;
  createProject: (
    _projectID: string,
    title: string,
    desc: string,
    coinType: string,
    duration: number,
    contributionGoal: number
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "createProject">>;
  withdrawProjectFunds: (
    _projectID: string
  ) => Promise<
    FinalizedCallTxData<CrowdfundingContract, "withdrawProjectFunds">
  >;
  contributeProject: (
    _projectID: string,
    amount: number
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "contributeProject">>;
  endProject: (
    _projectID: string
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "endProject">>;
  cancelProject: (
    _projectID: string
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "cancelProject">>;
  requestRefund: (
    _projectID: string,
    refund_amount: number,
    amountDeposited: number
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "requestRefund">>;
  updateProject: (
    _projectID: string,
    title: string,
    desc: string,
    contributionGoal: number,
    duration: number
  ) => Promise<FinalizedCallTxData<CrowdfundingContract, "updateProject">>;
}
/**
 * NB: Declaring a class implements a given type, means it must contain all defined properties and methods, then take on other extra properties or class
 */

export class CrowdfundingAPI implements DeployedCrowdfundingAPI {
  deployedContractAddress: string;
  state: Observable<DerivedCrowdfundingContractState>;

  // Within the constructor set the two properties of the API Class Object
  // Using access modifiers on parameters create a property instances for that parameter and stores it as part of the object
  /**
   * @param allReadyDeployedContract
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: CrowdfundingContractProviders,
    public readonly allReadyDeployedContract: DeployedCrowdfundingOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              })
            )
          ),
        concat(
          from(providers.privateStateProvider.get(CrowdfundingPrivateStateId))
        ),
      ],
      (ledgerState, privateState) => {
        return {
          protocolTVL: utils.createDeriveProtocolTVLArray(
            ledgerState.protocolTVL
          ),
          projects: utils.createDerivedProjectsArray(ledgerState.projects),
        };
      }
    );
  }

  static async deployCrowdfundingContract(
    providers: CrowdfundingContractProviders,
    logger?: Logger
  ): Promise<CrowdfundingAPI> {
    logger?.info("deploy contract");
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployedContract = await deployContract<CrowdfundingContract>(
      providers,
      {
        contract: CrowdfundingContractInstance,
        initialPrivateState: await CrowdfundingAPI.getPrivateState(providers),
        privateStateId: CrowdfundingPrivateStateId,
      }
    );

    logger?.trace("Deployment successfull", {
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new CrowdfundingAPI(providers, deployedContract, logger);
  }

  static async joinCrowdfundingContract(
    providers: CrowdfundingContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<CrowdfundingAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const existingContract = await findDeployedContract<CrowdfundingContract>(
      providers,
      {
        contract: CrowdfundingContractInstance,
        contractAddress: contractAddress,
        privateStateId: CrowdfundingPrivateStateId,
        initialPrivateState: await CrowdfundingAPI.getPrivateState(providers),
      }
    );

    logger?.trace("Found Contract...", {
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new CrowdfundingAPI(providers, existingContract, logger);
  }

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  async createProject(
    _projectID: string,
    title: string,
    desc: string,
    coinType: string,
    duration: number,
    contributionGoal: number
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "createProject">> {
    this.logger?.info(`Creating project with id ${_projectID}....`);

    const txData = await this.allReadyDeployedContract.callTx.createProject(
      utils.hexStringToUint8Array(_projectID),
      BigInt(contributionGoal),
      BigInt(duration),
      encodeTokenType(coinType),
      BigInt(Date.now()),
      title,
      desc
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "createProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async contributeProject(
    _projectID: string,
    amount: number
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "contributeProject">> {
    this.logger?.info(`Contributing to project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.contributeProject(
      this.coin(amount),
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "contributeProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

  async endProject(
    _projectID: string
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "endProject">> {
    this.logger?.info(`Ending project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.endProject(
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "endProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async cancelProject(
    _projectID: string
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "cancelProject">> {
    this.logger?.info(`Canceling project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.cancelProject(
      utils.hexStringToUint8Array(_projectID)
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "cancelProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async requestRefund(
    _projectID: string,
    refund_amount: number,
    amountDeposited: number
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "requestRefund">> {
    this.logger?.info(
      `Refunding ${refund_amount} worth of assets deposited to project with id ${_projectID}...`
    );

    const txData = await this.allReadyDeployedContract.callTx.requestRefund(
      utils.hexStringToUint8Array(_projectID),
      BigInt(refund_amount),
      BigInt(amountDeposited)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "requestRefund",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async updateProject(
    _projectID: string,
    title: string,
    desc: string,
    contributionGoal: number,
    duration: number
  ): Promise<FinalizedCallTxData<CrowdfundingContract, "updateProject">> {
    this.logger?.info(`Updating project with id ${_projectID}...`);

    const txData = await this.allReadyDeployedContract.callTx.updateProject(
      utils.hexStringToUint8Array(_projectID),
      title,
      desc,
      BigInt(contributionGoal),
      BigInt(duration)
    );
    this.logger?.trace({
      transactionAdded: {
        circuit: "updateProject",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  async withdrawProjectFunds(
    _projectID: string
  ): Promise<
    FinalizedCallTxData<CrowdfundingContract, "withdrawProjectFunds">
  > {
    this.logger?.info(
      `Withdrawing funds from project with id ${_projectID}...`
    );

    const txData =
      await this.allReadyDeployedContract.callTx.withdrawProjectFunds(
        utils.hexStringToUint8Array(_projectID)
      );

    this.logger?.trace({
      transactionAdded: {
        circuit: "withdrawProjectFunds",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });
    return txData;
  }

  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: CrowdfundingContractProviders
  ): Promise<CrowdfundingPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      CrowdfundingPrivateStateId
    );
    return (
      existingPrivateState ??
      createCrowdfundingPrivateState(utils.randomNonceBytes(32))
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";
