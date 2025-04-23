const { getHexSeedFromMnemonic } = require("./utils/getHexSeedFromMnemonic");
require('dotenv').config()
const contractCompiler = require("./contract-compiler")
const { Web3 } = require('@theqrl/web3')
const crypto = require('crypto')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))

const mnemonic = process.env.MNEMONIC

if (!mnemonic || mnemonic === "your_mnemonic_here") {
    console.log("You need to enter a dilithium mnemonic in .env file for this to work.")
    process.exit(1)
}

const hexseed = getHexSeedFromMnemonic(mnemonic)

const acc = web3.zond.accounts.seedToAccount(hexseed)
web3.zond.wallet?.add(hexseed)
web3.zond.transactionConfirmationBlocks = parseInt(process.env.TX_REQUIRED_CONFIRMATIONS, 10) || 2

// Environment variables for ZondAtomicSwap
const atomicSwapContractAddress = process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS
const secret = process.env.SECRET
const recipientAddress = process.env.RECIPIENT_ADDRESS
const expiryTs = process.env.EXPIRY_TS ? 
    BigInt(process.env.EXPIRY_TS).toString() : 
    BigInt(Math.floor(Date.now() / 1000) + 3600).toString() // Default to 1 hour from now
const tokenAddress = process.env.TOKEN_ADDRESS || 'Z0000000000000000000000000000000000000000' // ZND or ERC-20
const amount = process.env.AMOUNT || '1000000000000000000' // Default to 1 ZND

// Compute H = sha256(secret)
const H = '0x' + crypto.createHash('sha256').update(secret).digest('hex')

// Load ZondAtomicSwap ABI from compiled contracts
const output = contractCompiler.GetCompilerOutput()

const zondAtomicSwapABI = output.contracts['ZondAtomicSwap.hyp']['ZondAtomicSwap'].abi

const zondAtomicSwap = new web3.zond.Contract(zondAtomicSwapABI, atomicSwapContractAddress)

const lockSwap = async () => {
    try {
        console.log('Attempting to lock assets using ZondAtomicSwap from account:', acc.address)
        console.log('Recipient address:', recipientAddress)
        console.log('Expiry timestamp:', expiryTs)
        console.log('Token address:', tokenAddress)
        console.log('Amount:', amount)
        console.log('Hash H:', H)

        // If locking an ERC-20 token, approve the ZondAtomicSwap contract first
        if (tokenAddress.toLowerCase() !== 'z0000000000000000000000000000000000000000') {
            // Load IERC20 ABI
            const ierc20ABI = contractCompiler.GetCompilerOutput().contracts['IERC20.hyp']['IERC20'].abi
            const tokenContract = new web3.zond.Contract(ierc20ABI, tokenAddress)

            // Approve the ZondAtomicSwap contract to spend the tokens
            const approveTx = tokenContract.methods.approve(atomicSwapContractAddress, amount)
            const estimatedGasApprove = await approveTx.estimateGas({ from: acc.address })

            const approveTxObj = {
                type: '0x2',
                gas: estimatedGasApprove,
                from: acc.address,
                to: tokenAddress,
                data: approveTx.encodeABI(),
                value: '0x0'
            }

            console.log('Approving ZondAtomicSwap contract to spend tokens...')
            await web3.zond.sendTransaction(approveTxObj, undefined, { checkRevertBeforeSending: true })
                .on('confirmation', (confirmationNumber, receipt) => {
                    console.log(`Approval transaction confirmed: ${confirmationNumber}`, receipt)
                })
                .on('receipt', (receipt) => {
                    console.log('Approval transaction receipt:', receipt)
                })
                .on('error', (error) => {
                    console.error('Approval transaction error:', error)
                    throw error
                })
        }

        // Prepare the lock transaction
        const lockTx = zondAtomicSwap.methods.lock(
            H,
            recipientAddress,
            expiryTs,
            tokenAddress,
            amount
        )

        const txParams = {
            from: acc.address,
            to: atomicSwapContractAddress,
            data: lockTx.encodeABI(),
            gasPrice: await web3.zond.getGasPrice(),
        }

        // Estimate gas for lock transaction
        const estimatedGasLock = await lockTx.estimateGas({
            from: acc.address,
            value: tokenAddress.toLowerCase() === 'z0000000000000000000000000000000000000000' ? amount : '0x0'
        })

        txParams.gas = estimatedGasLock

        // If locking ZND, include the value
        if (tokenAddress.toLowerCase() === 'z0000000000000000000000000000000000000000') {
            txParams.value = amount
        } else {
            txParams.value = '0x0'
        }

        console.log('Sending lock transaction...')
        await web3.zond.sendTransaction(txParams, undefined, { checkRevertBeforeSending: true })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log(`Lock transaction confirmed: ${confirmationNumber}`, receipt)
            })
            .on('receipt', (receipt) => {
                console.log('Lock transaction receipt:', receipt)
            })
            .on('error', (error) => {
                console.error('Lock transaction error:', error)
            })

    } catch (error) {
        console.error('Error in lockSwap:', error)
    }
}

lockSwap()
