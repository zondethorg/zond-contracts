require("dotenv").config();
const contractCompiler = require("./contract-compiler");
const { Web3 } = require("@theqrl/web3");
const { getHexSeedFromMnemonic } = require("./utils/getHexSeedFromMnemonic");

const web3 = new Web3(
  new Web3.providers.HttpProvider(process.env.PROVIDER_URL)
);

const mnemonic = process.env.MNEMONIC;
if (!mnemonic || mnemonic === "your_mnemonic_here") {
  console.error(
    "You must supply a Dilithium mnemonic in the .env file (MNEMONIC=...)"
  );
  process.exit(1);
}

const hexseed = getHexSeedFromMnemonic(mnemonic);
const acc = web3.zond.accounts.seedToAccount(hexseed);
web3.zond.wallet?.add(hexseed);
web3.zond.transactionConfirmationBlocks =
  Number(process.env.TX_REQUIRED_CONFIRMATIONS) || 2;

const NAME = process.env.TOKEN_NAME || "Mock Token";
const SYMBOL = process.env.TOKEN_SYMBOL || "MOCK";
const DECIMALS = parseInt(process.env.TOKEN_DECIMALS || "18", 10);

const rawSupply = BigInt(
  web3.utils
    .toWei(process.env.TOKEN_SUPPLY || "1000000", "ether") // 1 000 000 * 10¹⁸
);

const receiptHandler = (receipt) => {
  console.log("\n✅  MockERC20 deployed!");
  console.log("   Contract address:", receipt.contractAddress);
  console.log("   TX hash         :", receipt.transactionHash, "\n");
};

const deployMockErc20 = async () => {
  console.log("Deploying MockERC20 from:", acc.address);
  console.log(
    `Params →  name=${NAME}, symbol=${SYMBOL}, decimals=${DECIMALS}, initialSupply=${rawSupply.toString()}`
  );

  const output = contractCompiler.GetCompilerOutput();

  if (output.errors?.length > 0) {
    console.error("Compilation failed:", output.errors);
    process.exit(1);
  }

  const fileKey = Object.keys(output.contracts).find((k) =>
    /MockERC20\.hyp$/i.test(k)
  );
  if (!fileKey)
    throw new Error(
      "MockERC20.hyp not found in compiler output - did you add it to the build list?"
    );

  const artefact = output.contracts[fileKey]["MockERC20"];
  const { abi } = artefact;
  const bytecode = artefact.zvm.bytecode.object;

  const contract = new web3.zond.Contract(abi);
  const deployOptions = {
    data: bytecode,
    arguments: [NAME, SYMBOL, DECIMALS, rawSupply],
  };

  const contractDeploy = contract.deploy(deployOptions);
  const estimatedGas = await contractDeploy.estimateGas({ from: acc.address });

  const txObj = {
    type: "0x2",
    gas: estimatedGas,
    from: acc.address,
    data: contractDeploy.encodeABI(),
  };

  await web3.zond
    .sendTransaction(txObj, undefined, { checkRevertBeforeSending: false })
    .on("confirmation", console.log)
    .on("receipt", receiptHandler)
    .on("error", console.error);
};

deployMockErc20().catch((e) => {
  console.error("Deployment failed:", e);
  process.exit(1);
});
