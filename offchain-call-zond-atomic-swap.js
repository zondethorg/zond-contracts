require('dotenv').config();
const contractCompiler = require('./contract-compiler');
const { Web3 } = require('@theqrl/web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL));
const crypto = require('crypto')

if (!process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS ||
    process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS === 'your_atomic_swap_contract_address_here') {
    console.error('⚠️  Set ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS in .env'); process.exit(1);
}

const output = contractCompiler.GetCompilerOutput();
const contractABI = output.contracts['ZondAtomicSwap.hyp']['ZondAtomicSwap'].abi;
const contract = new web3.zond.Contract(contractABI, process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS);

const printContractSummary = async () => {
    const [balanceWei, owner, paused] = await Promise.all([
        web3.zond.getBalance(process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS),
        contract.methods.owner().call(),
        contract.methods.paused().call(),
    ]);

    console.log(`\n📡  ZondAtomicSwap @ ${process.env.ZOND_ATOMIC_SWAP_CONTRACT_ADDRESS}`);
    console.log('---------------------------------------------');
    console.log('Balance          :', web3.utils.fromWei(balanceWei, 'ether'), 'ZND');
    console.log('Owner            :', owner);
    console.log('Paused?          :', paused, '\n');
};

const showSwap = async (swapID) => {
    const s = await contract.methods.swaps(swapID).call();
    if (s.locker === '0x0000000000000000000000000000000000000000') {
        console.log('🔍  Swap not found on-chain'); return;
    }

    console.table({
        swapID,
        assetLocked: s.assetLocked === '0x0000000000000000000000000000000000000000' ? 'ZND (native)' : s.assetLocked,
        amountLocked: web3.utils.fromWei(s.amountLocked, 'ether'),
        locker: s.locker,
        recipientRaw: s.recipientRaw,
        desiredAssetRaw: s.desiredAssetRaw,
        desiredAmount: s.desiredAmount,
        expiryTs: new Date(Number(s.expiryTs) * 1000).toISOString(),
        claimed: s.claimed,
    });
};

(async () => {
  await printContractSummary();

  const [,, locker, secret, recipientRaw] = process.argv;
  if (locker && secret && recipientRaw) {
    const hashSecret = '0x' + crypto.createHash('sha256').update(secret).digest('hex')
    const swapID = await contract.methods.previewSwapID(locker, hashSecret, recipientRaw).call();
    await showSwap(swapID);
  }
})().catch(console.error);
