const { getHexSeedFromMnemonic } = require("./utils/getHexSeedFromMnemonic");
require('dotenv').config()
const contractCompiler = require("./contract-compiler")
const { Web3 } = require('@theqrl/web3')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))

const mnemonic = process.env.MNEMONIC

if (!mnemonic || mnemonic === "your_mnemonic_here") {
    console.log("You need to enter a dilithium mnemonic in .env file for this to work.")
    process.exit(1)
}

const hexseed = getHexSeedFromMnemonic(mnemonic)

const acc = web3.zond.accounts.seedToAccount(hexseed)
web3.zond.wallet?.add(hexseed)
web3.zond.transactionConfirmationBlocks = process.env.TX_REQUIRED_CONFIRMATIONS || 2

// EVM address that will receive the wrapped ZND
const evmRecipientAddress = process.env.EVM_RECIPIENT_ADDRESS
console.log("EVM recipient address:", evmRecipientAddress)
const bridgeContractAddress = process.env.BRIDGE_CONTRACT_ADDRESS
console.log("Bridge contract address:", bridgeContractAddress)

const lockZND = async () => {
    console.log('Attempting to lock ZND using the bridge from account:', acc.address)

    let output = contractCompiler.GetCompilerOutput()

    const contractABI = output.contracts['ZondBridge.hyp']['ZondBridge'].abi
    const contract = new web3.zond.Contract(contractABI, bridgeContractAddress)

    const amount = web3.utils.toWei('1', 'ether') // Lock 1 ZND
    const lockZNDCall = contract.methods.lockZND(evmRecipientAddress)
    const estimatedGas = await lockZNDCall.estimateGas({
        "from": acc.address,
        "value": amount
    })

    const txObj = {
        type: '0x2',
        gas: estimatedGas,
        from: acc.address,
        to: bridgeContractAddress,
        data: lockZNDCall.encodeABI(),
        value: amount
    }

    await web3.zond.sendTransaction(txObj, undefined, { checkRevertBeforeSending: true })
        .on('confirmation', console.log)
        .on('receipt', console.log)
        .on('error', console.error)
}

lockZND()
