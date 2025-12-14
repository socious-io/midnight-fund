# Midnight Fund
Compact smart contracts on Midnight for Crowdfunding Platforms.

### Key Features

- **Create Projects**: Create crowdfunding projects with goals, durations, and descriptions
- **Contribute in Projects**: Contribute funds to active projects
- **Manage Projects**: Update, end, cancel, and withdraw funds from projects
- **Request Refunds**: Get refunds from projects that didn't meet their goals
- **Privacy-Preserving**: Built on Midnight Network with zero-knowledge proofs for transaction privacy
- **State Management**: Track project status, contributions, and protocol TVL

## Quick Start

### 1. Install Dependencies

```sh
yarn install
```

### 2. Fetch ZK Parameters

- Navigate to the `cli` folder:
```sh
cd packages/cli
```

- Run zk-params script for proof server:
```sh
./fetch-zk-params.sh
```

This downloads all required ZK parameters (k=10 to k=17) to `.cache/midnight/zk-params/`.

### 3. Configure Environment Variables

#### For Testnet:

- Navigate to the `ui` folder
```sh
cd packages/ui
```

- Add the `.env` variables
```sh
echo "VITE_NETWORK_ID=TestNet
VITE_LOGGING_LEVEL=trace" > .env
```

#### For Standalone (Local Development):

- Navigate to the `ui` folder
```sh
cd packages/ui
```

- Add the `.env` variables (use `Undeployed` as the Network ID for local development)
```sh
echo "VITE_NETWORK_ID=Undeployed
VITE_LOGGING_LEVEL=trace" > .env
```

### 4. Build All Packages

```sh
yarn build:all
```

This compiles the contract, builds the API, and builds the UI.

### 5. Start Infrastructure

Choose one option:

#### Option A: Testnet (connects to Midnight public testnet)

```sh
cd packages/cli && docker compose -f testnet.yml up
```

#### Option B: Standalone (runs your own local network)

```sh
cd packages/cli && docker compose -f standalone.yml up
```

Or use the root script:
```sh
yarn infra:up
```

**Ports:**
- Node: `9944`
- Indexer: `8088`
- Proof Server: `6300`

### 6. Configure Wallet

- Open **Midnight Lace Wallet**
- Go to **Settings** → **Network**
- Select:
  - **TestNet** for Option A
  - **Undeployed** for Option B (Standalone infrastructure)

### 7. Fund Wallet (Standalone only)

If using Standalone infrastructure, fund your wallet address:

- Go to the `cli` folder:
```sh
cd packages/cli
```

- Run the `fund` command to receive Midnight test tokens (tDUST), replace `mn_shield-addr_undeployed...` with your Undeployed network address:

```sh
yarn fund mn_shield-addr_undeployed...
```

Or use the root script:
```sh
yarn fund mn_shield-addr_undeployed...
```

### 8. Start Development Server

```sh
cd packages/ui && yarn start
```

Open `http://localhost:8080` in your browser.

## Root Scripts

```sh
yarn build:all       # Build everything
yarn infra:up        # Start standalone infrastructure
yarn infra:down      # Stop standalone infrastructure
yarn infra:logs      # View infrastructure logs
yarn fund <address>  # Fund wallet (standalone mode)
```

## Project Structure

```
midnight-fund/
├── packages/
│   ├── contract/     # Crowdfunding Compact contract
│   ├── api/          # API layer
│   ├── ui/           # React frontend
│   └── cli/          # Infrastructure & CLI tools
│       ├── standalone.yml  # Local network compose
│       ├── testnet.yml     # Testnet compose
│       └── src/            # Funding scripts
├── compact/          # Compact compiler
└── .cache/           # ZK params (gitignored)
```

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
