require('dotenv').config()
const contractCompiler = require("./contract-compiler")
const { Web3 } = require('@theqrl/web3')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))
const { getHexSeedFromMnemonic } = require("./utils/getHexSeedFromMnemonic");

const mnemonic = process.env.MNEMONIC

if (!mnemonic || mnemonic === "your_mnemonic_here") {
    console.log("You need to enter a dilithium mnemonic in .env file for this to work.")
    process.exit(1)
}

const hexseed = getHexSeedFromMnemonic(mnemonic)

const acc = web3.zond.accounts.seedToAccount(hexseed)
web3.zond.wallet?.add(hexseed)
web3.zond.transactionConfirmationBlocks = process.env.TX_REQUIRED_CONFIRMATIONS || 2

const receiptHandler = function (receipt) {
    console.log("Contract address ", receipt.contractAddress)
}

const relayerAddress = process.env.RELAYER_ADDRESS
const treasuryAddress = process.env.TREASURY_ADDRESS

const deployZondBridgeContract = async () => {
    console.log('Attempting to deploy ZondBridge contract from account:', acc.address)

    const output = contractCompiler.GetCompilerOutput()

    const contractABI = output.contracts['ZondBridge.hyp']['ZondBridge'].abi
    const contractByteCode = output.contracts['ZondBridge.hyp']['ZondBridge'].zvm.bytecode.object
    const contract = new web3.zond.Contract(contractABI)

    const deployOptions = { data: contractByteCode, arguments: [relayerAddress, treasuryAddress] }
    const contractDeploy = contract.deploy(deployOptions)
    const estimatedGas = await contractDeploy.estimateGas({ from: acc.address })
    const txObj = { type: '0x2', gas: estimatedGas, from: acc.address, data: contractDeploy.encodeABI() }

    await web3.zond.sendTransaction(txObj, undefined, { checkRevertBeforeSending: false })
        .on('confirmation', console.log)
        .on('receipt', receiptHandler)
        .on('error', console.error)
}

deployZondBridgeContract()
