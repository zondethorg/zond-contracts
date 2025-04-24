require('dotenv').config()

const { getHexSeedFromMnemonic } = require("./utils/getHexSeedFromMnemonic")
const contractCompiler = require("./contract-compiler")
const { Web3 } = require('@theqrl/web3')
const crypto = require('crypto')

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))
const mnemonic = process.env.MNEMONIC
if (!mnemonic || mnemonic === 'your_mnemonic_here') {
  console.error('Put a Dilithium mnemonic into .env')
  process.exit(1)
}

const hexseed = getHexSeedFromMnemonic(mnemonic)
const acc = web3.zond.accounts.seedToAccount(hexseed)
web3.zond.wallet?.add(hexseed)
web3.zond.transactionConfirmationBlocks =
  parseInt(process.env.TX_REQUIRED_CONFIRMATIONS, 10) || 2

const tokenAddress = process.env.TOKEN_ADDRESS
const amount = process.env.AMOUNT
const recipientAddress = acc.address

const tokenContract = new web3.zond.Contract(IERC20_ABI, tokenAddress)

const transfer = async () => {
  try {
    console.log('Sender', acc.address)
    console.log('Recipient (EVM)', recipientAddress)
    console.log('Amount', amount)

    const txParams = {
      from: acc.address,
      to: tokenAddress,
      data: tokenContract.methods.transfer(recipientAddress, amount).encodeABI(),
      gas: await tokenContract.methods.transfer(recipientAddress, amount).estimateGas({ from: acc.address }),
      gasPrice: await web3.zond.getGasPrice(),
      value: '0x0'
    }

    await web3.zond.sendTransaction(txParams)
      .once('confirmation', console.log)
      .once('error', console.error)
  } catch (error) {
    console.error('Transfer failed:', error)
    process.exit(1)
  }
}

transfer()
