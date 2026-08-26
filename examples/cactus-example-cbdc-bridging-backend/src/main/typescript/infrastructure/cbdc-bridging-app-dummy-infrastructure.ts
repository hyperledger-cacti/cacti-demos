import express, { type Express } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import bodyParser from "body-parser";
import { Knex } from "knex";

import {
  Logger,
  Checks,
  LogLevelDesc,
  LoggerProvider,
  Secp256k1Keys,
} from "@hyperledger-cacti/cactus-common";
import {
  Configuration,
  GetApproveAddressApi,
  SATPGatewayConfig,
  TokenType,
} from "@hyperledger-cacti/cactus-plugin-satp-hermes";
import {
  IWebServiceEndpoint,
  LedgerType,
} from "@hyperledger-cacti/cactus-core-api";
import { GatewayIdentity } from "@hyperledger-cacti/cactus-plugin-satp-hermes";
import { SessionReference } from "../types";

import { ApproveEndpointV1 } from "../web-services/approve-endpoint";
import { GetSessionsDataEndpointV1 } from "../web-services/get-all-session-data-endpoints";
import { GetBalanceEndpointV1 } from "../web-services/get-balance-endpoint";
import { MintEndpointV1 } from "../web-services/mint-endpoint";
import { TransactEndpointV1 } from "../web-services/transact-endpoint";
import { TransferEndpointV1 } from "../web-services/transfer-endpoint";
import { GetAmountApprovedEndpointV1 } from "../web-services/get-amount-approved-endpoint";

import {
  AdminApi,
  TransactionApi,
  TransactRequest,
} from "@hyperledger-cacti/cactus-plugin-satp-hermes";
import { BesuEnvironment } from "./cbdc-besu-environment";
import { Container } from "dockerode";
import { createPGDatabase, setupDBTable } from "./db-infrastructure";
import {
  DEFAULT_PORT_GATEWAY_CLIENT,
  DEFAULT_PORT_GATEWAY_SERVER,
  DEFAULT_PORT_GATEWAY_OAPI,
} from "@hyperledger-cacti/cactus-plugin-satp-hermes";
import { setupGatewayDockerFiles } from "./utils";
import {
  ISATPGatewayRunnerConstructorOptions,
  SATPGatewayRunner,
} from "@hyperledger-cacti/cactus-test-tooling";

import Docker from "dockerode";

import http from "node:http";
import { createMonitorSystem } from "./monitoring-infrastructure";
import { LedgerId } from "../types";

export interface ICbdcBridgingAppDummyInfrastructureOptions {
  logLevel?: LogLevelDesc;
}

export class CbdcBridgingAppDummyInfrastructure {
  public static readonly CLASS_NAME = "CbdcBridgingAppDummyInfrastructure";

  private static readonly networkName = "CDBC_Network";

  private static readonly DOCKER_IMAGE_VERSION = "2026-02-02-1458";
  private static readonly DOCKER_IMAGE_NAME = "tomassilva2187/satp-gateway";

  private readonly log: Logger;
  private readonly logLevel: LogLevelDesc;

  private readonly besuAEnvironment: BesuEnvironment;
  private readonly besuBEnvironment: BesuEnvironment;

  private db_local_config1?: Knex.Config;
  private db_remote_config1?: Knex.Config;
  private db_local_config2?: Knex.Config;
  private db_remote_config2?: Knex.Config;
  private db_local1?: Container;
  private db_remote1?: Container;
  private db_local2?: Container;
  private db_remote2?: Container;
  private monitorService?: Container;

  private besuAGatewayRunner?: SATPGatewayRunner;
  private besuBGatewayRunner?: SATPGatewayRunner;

  private besuAGatewayAddress = "besu-a-gateway.satp-hermes";
  private besuBGatewayAddress = "besu-b-gateway.satp-hermes";

  private besuAGatewayApproveAddress?: string;
  private besuBGatewayApproveAddress?: string;

  private besuAGatewayTransactApi?: TransactionApi;
  private besuAGatewayAdminApi?: AdminApi;
  private besuBGatewayTransactApi?: TransactionApi;
  private besuBGatewayAdminApi?: AdminApi;

  private endpoints?: IWebServiceEndpoint[];

  private webApplication?: Express;
  private webServer?: http.Server;

  public get className(): string {
    return CbdcBridgingAppDummyInfrastructure.CLASS_NAME;
  }

  constructor(
    public readonly options: ICbdcBridgingAppDummyInfrastructureOptions,
  ) {
    const fnTag = `${this.className}#constructor()`;
    Checks.truthy(options, `${fnTag} arg options`);

    this.logLevel = (this.options.logLevel || "INFO") as LogLevelDesc;
    const label = this.className;

    this.log = LoggerProvider.getOrCreate({ level: this.logLevel, label });

    this.besuAEnvironment = new BesuEnvironment(this.logLevel, {
      dockerNetwork: CbdcBridgingAppDummyInfrastructure.networkName,
      networkId: "BesuLedgerCBDCNetworkA",
      assetId: "BesuCBDCAssetA",
      assetReferenceId: "SATP-ERC20-BESU",
      label: "BesuEnvironmentA",
    });
    this.besuBEnvironment = new BesuEnvironment(this.logLevel, {
      dockerNetwork: CbdcBridgingAppDummyInfrastructure.networkName,
      networkId: "BesuLedgerCBDCNetworkB",
      assetId: "BesuCBDCAssetB",
      assetReferenceId: "SATP-ERC20-BESU",
      label: "BesuEnvironmentB",
    });
  }

  public async start(): Promise<void> {
    try {
      this.log.info(`Starting dummy infrastructure... (this can take a while)`);
      this.log.info(`Starting Ledgers...`);
      // This is necessary because there is a race condition when creating networks
      const docker = new Docker();
      const networks = await docker.listNetworks();
      const networkExists = networks.some(
        (n) => n.Name === CbdcBridgingAppDummyInfrastructure.networkName,
      );
      if (!networkExists) {
        await docker.createNetwork({
          Name: CbdcBridgingAppDummyInfrastructure.networkName,
          Driver: "bridge",
        });
      }

      await Promise.all([
        this.besuAEnvironment.init(),
        this.besuBEnvironment.init(),
      ]);
      this.log.info(`Deploying contracts...`);
      await Promise.all([
        this.besuAEnvironment.deployAndSetupContracts(),
        this.besuBEnvironment.deployAndSetupContracts(),
      ]);
      this.log.info(`Creating databases...`);
      await this.createDBs();
      this.log.info(`Creating Monitoring Service...`);
      await this.createMonitorSystem();
      this.log.info(`Creating SATP Gateways...`);
      await this.createSATPGateways();
      this.log.debug("creating api server...");
      await this.createApiServer();
      this.log.debug("api server created successfully");
    } catch (ex) {
      this.log.error(`Starting of dummy infrastructure crashed: `, ex);
      throw ex;
    }
  }

  public async stop(): Promise<void> {
    try {
      this.log.info(`Stopping...`);
      await Promise.all([
        this.besuAGatewayRunner?.stop(),
        this.besuBGatewayRunner?.stop(),
      ]);
      await Promise.all([
        this.besuAGatewayRunner?.destroy(),
        this.besuBGatewayRunner?.destroy(),
      ]);

      await this.db_local1?.stop();
      await this.db_local1?.remove();
      await this.db_remote1?.stop();
      await this.db_remote1?.remove();
      await this.db_local2?.stop();
      await this.db_local2?.remove();
      await this.db_remote2?.stop();
      await this.db_remote2?.remove();
      await this.monitorService?.stop();
      await this.monitorService?.remove();

      await Promise.all([
        this.besuAEnvironment.tearDown(),
        this.besuBEnvironment.tearDown(),
      ]);

      if (this.webServer) {
        await new Promise<void>((resolve, reject) => {
          this.webServer?.close((err) => {
            if (err) {
              this.log.error(`Failed to close web server: ${err}`);
              reject(err);
            } else {
              this.log.info(`Web server closed`);
              resolve();
            }
          });
        });
      }

      this.log.info(`Stopped OK`);
    } catch (ex) {
      this.log.error(`Stopping crashed: `, ex);
      throw ex;
    }
  }

  public async createDBs() {
    ({ config: this.db_local_config1, container: this.db_local1 } =
      await createPGDatabase({
        network: CbdcBridgingAppDummyInfrastructure.networkName,
        postgresUser: "user123123",
        postgresPassword: "password",
      }));

    ({ config: this.db_remote_config1, container: this.db_remote1 } =
      await createPGDatabase({
        network: CbdcBridgingAppDummyInfrastructure.networkName,
        postgresUser: "user123123",
        postgresPassword: "password",
      }));

    ({ config: this.db_local_config2, container: this.db_local2 } =
      await createPGDatabase({
        network: CbdcBridgingAppDummyInfrastructure.networkName,
        postgresUser: "user123123",
        postgresPassword: "password",
      }));

    ({ config: this.db_remote_config2, container: this.db_remote2 } =
      await createPGDatabase({
        network: CbdcBridgingAppDummyInfrastructure.networkName,
        postgresUser: "user123123",
        postgresPassword: "password",
      }));

    await setupDBTable(this.db_remote_config1);
    await setupDBTable(this.db_remote_config2);
  }

  private async createMonitorSystem(): Promise<void> {
    this.monitorService = await createMonitorSystem({});
  }

  public async createSATPGateways(): Promise<void> {
    const fnTag = `${this.className}#createSATPGateways()`;
    this.log.info(`${fnTag} Creating SATP Gateways...`);

    const besuAGatewayKeyPair = Secp256k1Keys.generateKeyPairsBuffer();
    const besuBGatewayKeyPair = Secp256k1Keys.generateKeyPairsBuffer();

    const besuAGatewayIdentity = {
      id: "BesuAGateway",
      name: "CustomGateway",
      version: [
        {
          Core: "v02",
          Architecture: "v02",
          Crash: "v02",
        },
      ],
      connectedDLTs: [
        {
          id: this.besuAEnvironment.network.id,
          ledgerType: LedgerType.Besu2X,
        },
      ],
      proofID: "mockProofID10",
      address: `http://${this.besuAGatewayAddress}`,
      gatewayClientPort: DEFAULT_PORT_GATEWAY_CLIENT,
      gatewayServerPort: DEFAULT_PORT_GATEWAY_SERVER,
      gatewayOapiPort: DEFAULT_PORT_GATEWAY_OAPI,
      pubKey: Buffer.from(besuAGatewayKeyPair.publicKey).toString("hex"),
    } as GatewayIdentity;

    const besuBGatewayIdentity = {
      id: "BesuBGateway",
      name: "CustomGateway",
      version: [
        {
          Core: "v02",
          Architecture: "v02",
          Crash: "v02",
        },
      ],
      connectedDLTs: [
        {
          id: this.besuBEnvironment.network.id,
          ledgerType: LedgerType.Besu2X,
        },
      ],
      proofID: "mockProofID11",
      address: `http://${this.besuBGatewayAddress}`,
      // Keep in-container SATP ports at defaults to match the gateway image's
      // internal listeners and healthcheck expectations.
      gatewayClientPort: DEFAULT_PORT_GATEWAY_CLIENT,
      gatewayServerPort: DEFAULT_PORT_GATEWAY_SERVER,
      gatewayOapiPort: DEFAULT_PORT_GATEWAY_OAPI,
      pubKey: Buffer.from(besuBGatewayKeyPair.publicKey).toString("hex"),
    } as GatewayIdentity;

    const besuAConfig = await this.besuAEnvironment.createBesuDockerConfig();
    const besuBConfig = await this.besuBEnvironment.createBesuDockerConfig();

    const besuAGatewayOptions: Partial<SATPGatewayConfig> = {
      gid: besuAGatewayIdentity,
      logLevel: this.logLevel,
      counterPartyGateways: [besuBGatewayIdentity],
      localRepository: this.db_local_config1
        ? ({
            client: this.db_local_config1.client,
            connection: this.db_local_config1.connection,
          } as any)
        : undefined,
      remoteRepository: this.db_remote_config1
        ? ({
            client: this.db_remote_config1.client,
            connection: this.db_remote_config1.connection,
          } as any)
        : undefined,
      environment: "production",
      ccConfig: {
        bridgeConfig: [besuAConfig],
      },
      enableCrashRecovery: false,
      keyPair: {
        publicKey: Buffer.from(besuAGatewayKeyPair.publicKey).toString("hex"),
        privateKey: besuAGatewayKeyPair.privateKey.toString("hex"),
      },
      ontologyPath: "/opt/cacti/satp-hermes/ontologies",
    };

    const besuBGatewayOptions: Partial<SATPGatewayConfig> = {
      gid: besuBGatewayIdentity,
      logLevel: this.logLevel,
      counterPartyGateways: [besuAGatewayIdentity],
      localRepository: this.db_local_config2
        ? ({
            client: this.db_local_config2.client,
            connection: this.db_local_config2.connection,
          } as any)
        : undefined,
      remoteRepository: this.db_remote_config2
        ? ({
            client: this.db_remote_config2.client,
            connection: this.db_remote_config2.connection,
          } as any)
        : undefined,
      environment: "production",
      ccConfig: {
        bridgeConfig: [besuBConfig],
      },
      enableCrashRecovery: false,
      keyPair: {
        publicKey: Buffer.from(besuBGatewayKeyPair.publicKey).toString("hex"),
        privateKey: besuBGatewayKeyPair.privateKey.toString("hex"),
      },
      ontologyPath: "/opt/cacti/satp-hermes/ontologies",
    };

    const besuAGatewayDockerFiles =
      setupGatewayDockerFiles(besuAGatewayOptions);
    const besuBGatewayDockerFiles =
      setupGatewayDockerFiles(besuBGatewayOptions);

    const besuAGatewayRunnerOptions: ISATPGatewayRunnerConstructorOptions = {
      containerImageVersion:
        CbdcBridgingAppDummyInfrastructure.DOCKER_IMAGE_VERSION,
      containerImageName: CbdcBridgingAppDummyInfrastructure.DOCKER_IMAGE_NAME,
      serverPort: DEFAULT_PORT_GATEWAY_SERVER,
      clientPort: DEFAULT_PORT_GATEWAY_CLIENT,
      oapiPort: DEFAULT_PORT_GATEWAY_OAPI,
      logLevel: this.logLevel,
      emitContainerLogs: true,
      configPath: besuAGatewayDockerFiles.configPath,
      logsPath: besuAGatewayDockerFiles.logsPath,
      ontologiesPath: besuAGatewayDockerFiles.ontologiesPath,
      networkName: CbdcBridgingAppDummyInfrastructure.networkName,
      url: this.besuAGatewayAddress,
    };

    const besuBGatewayRunnerOptions: ISATPGatewayRunnerConstructorOptions = {
      containerImageVersion:
        CbdcBridgingAppDummyInfrastructure.DOCKER_IMAGE_VERSION,
      containerImageName: CbdcBridgingAppDummyInfrastructure.DOCKER_IMAGE_NAME,
      serverPort: DEFAULT_PORT_GATEWAY_SERVER + 100,
      clientPort: DEFAULT_PORT_GATEWAY_CLIENT + 100,
      oapiPort: DEFAULT_PORT_GATEWAY_OAPI + 100,
      logLevel: this.logLevel,
      emitContainerLogs: true,
      configPath: besuBGatewayDockerFiles.configPath,
      logsPath: besuBGatewayDockerFiles.logsPath,
      ontologiesPath: besuBGatewayDockerFiles.ontologiesPath,
      networkName: CbdcBridgingAppDummyInfrastructure.networkName,
      url: this.besuBGatewayAddress,
    };

    this.besuAGatewayRunner = new SATPGatewayRunner(besuAGatewayRunnerOptions);
    this.log.debug("starting gatewayRunner...");
    await this.besuAGatewayRunner.start();
    this.log.debug("gatewayRunner started successfully");

    this.besuBGatewayRunner = new SATPGatewayRunner(besuBGatewayRunnerOptions);
    this.log.debug("starting gatewayRunner...");
    await this.besuBGatewayRunner.start();
    this.log.debug("gatewayRunner started successfully");

    const besuAGatewayApproveAddressApi = new GetApproveAddressApi(
      new Configuration({
        basePath: `http://${await this.besuAGatewayRunner.getOApiHost()}`,
      }),
    );

    const reqApproveBesuAAddress =
      await besuAGatewayApproveAddressApi.getApproveAddress(
        {
          id: this.besuAEnvironment.network.id,
          ledgerType: LedgerType.Besu2X,
        },
        TokenType.Fungible,
      );

    if (!reqApproveBesuAAddress?.data.approveAddress) {
      throw new Error("Approve address is undefined");
    }

    this.besuAGatewayApproveAddress =
      reqApproveBesuAAddress.data.approveAddress;
    this.besuAEnvironment.setApproveAddress(this.besuAGatewayApproveAddress);

    const besuBGatewayApproveAddressApi = new GetApproveAddressApi(
      new Configuration({
        basePath: `http://${await this.besuBGatewayRunner.getOApiHost()}`,
      }),
    );
    const reqApproveBesuBAddress =
      await besuBGatewayApproveAddressApi.getApproveAddress(
        {
          id: this.besuBEnvironment.network.id,
          ledgerType: LedgerType.Besu2X,
        },
        TokenType.Fungible,
      );

    if (!reqApproveBesuBAddress?.data.approveAddress) {
      throw new Error("Approve address is undefined");
    }

    this.besuBGatewayApproveAddress =
      reqApproveBesuBAddress.data.approveAddress;
    this.besuBEnvironment.setApproveAddress(this.besuBGatewayApproveAddress);

    if (!this.besuAGatewayApproveAddress) {
      throw new Error("Besu A approve address is undefined");
    }
    if (!this.besuBGatewayApproveAddress) {
      throw new Error("Besu B approve address is undefined");
    }

    await this.besuAEnvironment.giveRoleToBridge(
      this.besuAGatewayApproveAddress,
    );
    await this.besuBEnvironment.giveRoleToBridge(
      this.besuBGatewayApproveAddress,
    );

    this.besuAGatewayTransactApi = new TransactionApi(
      new Configuration({
        basePath: `http://${await this.besuAGatewayRunner.getOApiHost()}`,
      }),
    );
    this.besuAGatewayAdminApi = new AdminApi(
      new Configuration({
        basePath: `http://${await this.besuAGatewayRunner.getOApiHost()}`,
      }),
    );
    this.besuBGatewayTransactApi = new TransactionApi(
      new Configuration({
        basePath: `http://${await this.besuBGatewayRunner.getOApiHost()}`,
      }),
    );
    this.besuBGatewayAdminApi = new AdminApi(
      new Configuration({
        basePath: `http://${await this.besuBGatewayRunner.getOApiHost()}`,
      }),
    );

    this.log.info(`SATP Gateways created`);
  }

  public getBesuAEnvironment(): BesuEnvironment {
    return this.besuAEnvironment;
  }

  public getBesuBEnvironment(): BesuEnvironment {
    return this.besuBEnvironment;
  }

  // Backwards-compatible accessor retained for callers that still use this name.
  public getBesuEnvironment(): BesuEnvironment {
    return this.besuAEnvironment;
  }

  // Backwards-compatible accessor retained for callers that still use this name.
  public getFabricEnvironment(): BesuEnvironment {
    return this.besuBEnvironment;
  }

  public async mintTokens(
    ledgerId: LedgerId,
    user: string,
    amount: number,
  ): Promise<void> {
    const ledger = this.getEnvironmentByLedgerId(ledgerId);
    await ledger.mintTokensBesu(user, amount);
  }

  public async approveTokens(
    ledgerId: LedgerId,
    user: string,
    amount: number,
  ): Promise<void> {
    const ledger = this.getEnvironmentByLedgerId(ledgerId);
    await ledger.approveNTokensBesu(user, amount);
  }

  public async getBalance(ledgerId: LedgerId, user: string): Promise<number> {
    const ledger = this.getEnvironmentByLedgerId(ledgerId);
    return ledger.getBesuBalance(user);
  }

  public async getAmountApproved(
    ledgerId: LedgerId,
    user: string,
  ): Promise<string> {
    const ledger = this.getEnvironmentByLedgerId(ledgerId);
    return ledger.getAmountApprovedBesu(user);
  }

  public async transferTokens(
    ledgerId: LedgerId,
    from: string,
    to: string,
    amount: number,
  ): Promise<void> {
    const ledger = this.getEnvironmentByLedgerId(ledgerId);
    await ledger.transferTokensBesu(from, to, amount);
  }

  private async createApiServer(): Promise<void> {
    this.webApplication = express();
    this.webApplication.use(bodyParser.json({ limit: "250mb" }));
    this.webApplication.use(cors());
    const webServices = await this.getOrCreateWebServices();

    try {
      for (const service of webServices) {
        this.log.debug(`Registering web service: ${service.getPath()}`);
        await service.registerExpress(this.webApplication);
      }
    } catch (ex) {
      this.log.error(`Failed to register web services: `, ex);
      throw ex;
    }
    this.webServer = http.createServer(this.webApplication);

    await new Promise<void>((resolve, reject) => {
      if (!this.webServer) {
        throw new Error("web server is not defined");
      }
      this.webServer.listen(9999, () => {
        this.log.info(`web server started and listening on port ${9999}`);
        resolve();
      });
      this.webServer.on("error", (error) => {
        this.log.error(`web server failed to start: ${error}`);
        reject(error);
      });
    });
  }

  public async getOrCreateWebServices(): Promise<IWebServiceEndpoint[]> {
    const fnTag = `${CbdcBridgingAppDummyInfrastructure.CLASS_NAME}#getOrCreateWebServices()`;
    this.log.info(`${fnTag}, Registering webservices`);

    if (Array.isArray(this.endpoints)) {
      return this.endpoints;
    }

    const approveEndpointV1 = new ApproveEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const gelAllSessionDataEndpointV1 = new GetSessionsDataEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const getBalanceEndpointV1 = new GetBalanceEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const mintEndpointV1 = new MintEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const transactEndpointV1 = new TransactEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const transferEndpointV1 = new TransferEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const getApprovedEndpointV1 = new GetAmountApprovedEndpointV1({
      infrastructure: this,
      logLevel: this.options.logLevel,
    });

    const theEndpoints = [
      approveEndpointV1,
      gelAllSessionDataEndpointV1,
      getBalanceEndpointV1,
      mintEndpointV1,
      transactEndpointV1,
      transferEndpointV1,
      getApprovedEndpointV1,
    ];
    this.endpoints = theEndpoints;

    return theEndpoints;
  }

  public async getSessionsData(gateway: string): Promise<SessionReference[]> {
    this.log.debug(`Getting sessions data from ${gateway}`);
    const api = this.getAdminApiByLedgerId(gateway as LedgerId);
    try {
      if (api === undefined) {
        throw new Error("API is undefined");
      }
      const response = await api.getSessionIds();

      if (response.status !== 200) {
        return [
          {
            id: "MockID",
            status: "undefined",
            substatus: "undefined",
            sourceLedger: "undefined",
            receiverLedger: "undefined",
          },
        ];
      }

      const ids = response.data;

      const sessionsData = [];
      for (const id of ids) {
        try {
          const sessionData = await api.getStatus(id);
          const data: SessionReference = {
            id,
            status: sessionData.data.status,
            substatus: sessionData.data.substatus,
            sourceLedger: sessionData.data.originNetwork.dltProtocol,
            receiverLedger: sessionData.data.destinationNetwork.dltProtocol,
          };

          sessionsData.push(data);
        } catch (error) {
          sessionsData.push({
            id: "MockID",
            status: "undefined",
            substatus: "undefined",
            sourceLedger: "undefined",
            receiverLedger: "undefined",
          });
        }
      }
      return sessionsData;
    } catch (error) {
      console.log(error);
      return [
        {
          id: "MockID",
          status: "undefined",
          substatus: "undefined",
          sourceLedger: "undefined",
          receiverLedger: "undefined",
        },
      ];
    }
  }

  public async bridgeTokens(
    sender: string,
    recipient: string,
    sourceChain: string,
    destinationChain: string,
    amount: number,
  ) {
    this.log.debug(
      `Bridging tokens from ${sourceChain} to ${destinationChain}`,
    );
    if (sourceChain === destinationChain) {
      throw new Error(
        `Bridge operation requires different ledgers. Received ${sourceChain}`,
      );
    }

    const sourceLedger = this.getEnvironmentByLedgerId(sourceChain as LedgerId);
    const destinationLedger = this.getEnvironmentByLedgerId(
      destinationChain as LedgerId,
    );
    const sourceAddress = sourceLedger.getEthAddress(sender);
    const destinationAddress = destinationLedger.getEthAddress(recipient);
    const sourceAsset = sourceLedger.getBesuAsset(sourceAddress, `${amount}`);
    const receiverAsset = destinationLedger.getBesuAsset(
      destinationAddress,
      `${amount}`,
    );
    const api = this.getTransactApiByLedgerId(sourceChain as LedgerId);

    if (api === undefined) {
      throw new Error("API is undefined");
    }

    try {
      const request: TransactRequest = {
        contextID: uuidv4(),
        sourceAsset,
        receiverAsset,
      };
      await api.transact(request);
    } catch (error) {
      this.log.error(
        `Error bridging tokens from ${sourceChain} to ${destinationChain}`,
      );
      throw error;
    }
  }

  private getEnvironmentByLedgerId(ledgerId: LedgerId): BesuEnvironment {
    if (ledgerId === "BESU_A") {
      return this.besuAEnvironment;
    }
    if (ledgerId === "BESU_B") {
      return this.besuBEnvironment;
    }
    throw new Error(`Unsupported ledger id: ${ledgerId}`);
  }

  private getTransactApiByLedgerId(
    ledgerId: LedgerId,
  ): TransactionApi | undefined {
    if (ledgerId === "BESU_A") {
      return this.besuAGatewayTransactApi;
    }
    if (ledgerId === "BESU_B") {
      return this.besuBGatewayTransactApi;
    }
    return undefined;
  }

  private getAdminApiByLedgerId(ledgerId: LedgerId): AdminApi | undefined {
    if (ledgerId === "BESU_A") {
      return this.besuAGatewayAdminApi;
    }
    if (ledgerId === "BESU_B") {
      return this.besuBGatewayAdminApi;
    }
    return undefined;
  }
}
