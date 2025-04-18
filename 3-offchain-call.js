require('dotenv').config()
const contractCompiler = require("./contract-compiler")
const { Web3 } = require('@theqrl/web3')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))

if (!process.env.BRIDGE_CONTRACT_ADDRESS || process.env.BRIDGE_CONTRACT_ADDRESS === "your_bridge_contract_address_here") {
    console.log("You need to enter your bridge contract address in .env file for this to work.")
    process.exit(1)
}

const checkBridgeInfo = async () => {
    console.log('Checking ZondBridge contract balance at:', process.env.BRIDGE_CONTRACT_ADDRESS)

    const output = contractCompiler.GetCompilerOutput()
    const contractABI = output.contracts['ZondBridge.hyp']['ZondBridge'].abi
    const contract = new web3.zond.Contract(contractABI, process.env.BRIDGE_CONTRACT_ADDRESS)

    // Get bridge contract balance
    const balance = await web3.zond.getBalance(process.env.BRIDGE_CONTRACT_ADDRESS)
    console.log("Bridge Contract Balance:", web3.utils.fromWei(balance, 'ether'), "ZND")

    // Get other contract information
    const [relayer, treasury, nonce] = await Promise.all([
        contract.methods.RELAYER().call(),
        contract.methods.FEE_TREASURY().call(),
        contract.methods.nonce().call()
    ])

    console.log("Relayer Address:", relayer)
    console.log("Treasury Address:", treasury)
    console.log("Current Nonce:", nonce)
}

checkBridgeInfo()
