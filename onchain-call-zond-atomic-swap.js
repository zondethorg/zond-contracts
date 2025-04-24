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

const atomicSwapContractAddress = process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS
const secret = process.env.SECRET
const recipientAddress = process.env.EVM_RECIPIENT_ADDRESS
const expiryTs = process.env.EXPIRY_TS
  ? BigInt(process.env.EXPIRY_TS).toString()
  : BigInt(Math.floor(Date.now() / 1000) + 3600).toString()

const tokenAddress = process.env.TOKEN_ADDRESS || 'Z0000000000000000000000000000000000000000'

const amountLocked = process.env.AMOUNT || '1000000000000000000'

const desiredAssetAddr = process.env.EVM_DESIRED_ASSET_ADDRESS
if (!desiredAssetAddr) {
  console.error('EVM_DESIRED_ASSET_ADDRESS missing from .env')
  process.exit(1)
}
const desiredAmount = process.env.EVM_DESIRED_AMOUNT || amountLocked

const H = '0x' + crypto.createHash('sha256').update(secret).digest('hex')

const output = contractCompiler.GetCompilerOutput()
const zondAtomicSwapABI = output.contracts['ZondAtomicSwap.hyp']['ZondAtomicSwap'].abi
const zondAtomicSwap = new web3.zond.Contract(zondAtomicSwapABI, atomicSwapContractAddress)

const IERC20_ABI = output.contracts['IERC20.hyp']['IERC20'].abi

const lockSwap = async () => {
  try {
    console.log('Locker', acc.address)
    console.log('Recipient (EVM)', recipientAddress)
    console.log('Asset locked', tokenAddress)
    console.log('Amount locked', amountLocked)
    console.log('Desired asset (EVM)', desiredAssetAddr)
    console.log('Desired amount', desiredAmount)
    console.log('Expiry', expiryTs)
    console.log('Hash H', H)

    if (tokenAddress.toLowerCase() !== 'z0000000000000000000000000000000000000000') {
      const tokenContract = new web3.zond.Contract(IERC20_ABI, tokenAddress)
      const approveTx = tokenContract.methods.approve(
        atomicSwapContractAddress,
        amountLocked
      );
      const gasApprove = await approveTx.estimateGas({ from: acc.address });

      await web3.zond.sendTransaction({
        type: '0x2',
        from: acc.address,
        to: tokenAddress,
        gas: gasApprove,
        data: approveTx.encodeABI(),
        value: '0x0'
      }, undefined, { checkRevertBeforeSending: true })
      .once('receipt', r => console.log('Approve receipt', r.transactionHash))
    }

    const lockTx = zondAtomicSwap.methods.lock(
      H,
      recipientAddress,
      expiryTs,
      tokenAddress,
      amountLocked,
      desiredAssetAddr,
      desiredAmount
    )

    const txParams = {
      from: acc.address,
      to: atomicSwapContractAddress,
      data: lockTx.encodeABI(),
      gasPrice: await web3.zond.getGasPrice(),
      value:
        tokenAddress.toLowerCase() === "z0000000000000000000000000000000000000000"
          ? amountLocked
          : "0x0",
    };

    txParams.gas = await lockTx.estimateGas({
      from: acc.address,
      value: txParams.value
    })

    console.log('Sending lock() …')
    await web3.zond.sendTransaction(txParams, undefined, { checkRevertBeforeSending: true })
      .once('receipt', r => console.log('Lock receipt', r.transactionHash))
      .once('error', console.error)

  } catch (err) {
    console.error('lockSwap error:', err)
  }
}

lockSwap()
