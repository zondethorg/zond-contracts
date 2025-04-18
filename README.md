# Zond Bridge Contract

This repository contains a bridge contract implementation for the Zond network, allowing users to lock ZND tokens and bridge them to an EVM-compatible chain.

## Step 1: Install the Zond POS Node

Follow the instructions at [https://test-zond.theqrl.org/install](https://test-zond.theqrl.org/install) to set up your Zond node.

## Step 2: Create a Zond Dilithium Wallet

1. Follow the [wallet creation instructions](https://test-zond.theqrl.org/creating-wallet) to create a Dilithium wallet
2. Note down your Dilithium public address and mnemonic phrase
3. Get testnet QRL by requesting in the [QRL Discord](https://www.theqrl.org/discord)

## Step 3: Set Up Environment

1. Clone this repository and install dependencies:
```bash
nvm use 22
npm install
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Configure your `.env` file with the following parameters:
```env
PROVIDER_URL=http://localhost:8545
MNEMONIC=your_mnemonic_here
BRIDGE_CONTRACT_ADDRESS=your_contract_address_here
TX_REQUIRED_CONFIRMATIONS=2
RELAYER_ADDRESS=your_relayer_address_here
TREASURY_ADDRESS=your_treasury_address_here
EVM_RECIPIENT_ADDRESS=your_evm_recipient_address_here
```

Environment variables explained:
- `PROVIDER_URL`: Your Zond node endpoint (default: http://localhost:8545)
- `MNEMONIC`: Your Dilithium wallet mnemonic phrase
- `BRIDGE_CONTRACT_ADDRESS`: The deployed bridge contract address (obtained after deployment)
- `TX_REQUIRED_CONFIRMATIONS`: Number of block confirmations required (default: 2)
- `RELAYER_ADDRESS`: Address of the bridge relayer (multisig/MPC)
- `TREASURY_ADDRESS`: Address to receive bridge fees
- `EVM_RECIPIENT_ADDRESS`: EVM address that will receive wrapped ZND

## Step 4: Deploy the Bridge Contract

Deploy the ZondBridge contract:

```bash
node 1-deploy.js
```

After successful deployment, copy the contract address from the output and update your `.env` file's `BRIDGE_CONTRACT_ADDRESS` field.

## Step 5: Interact with the Bridge

### Lock ZND Tokens
To lock ZND tokens and initiate a bridge transfer:
```bash
node 2-onchain-call.js
```
This will lock 1 ZND (configurable in the script) and emit a proof for the EVM chain.

### Check Bridge Information
To view bridge contract details and balance:
```bash
node 3-offchain-call.js
```
This will display:
- Bridge contract balance
- Relayer address
- Treasury address
- Current nonce

## Bridge Contract Features

The ZondBridge contract (`contracts/ZondBridge.hyp`) includes:
- Lock/unlock functionality for ZND tokens
- Fee mechanism (0.25% fee on transfers)
- Replay protection for burns
- Event emission for cross-chain verification
- Security features including relayer-only unlocks

## Development

- Built with Hyperion smart contract language
- Uses @theqrl/web3 for blockchain interaction
- Implements @theqrl/hypc for contract compilation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
