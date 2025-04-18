const { Web3 } = require('@theqrl/web3')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL))

const contractAddress = process.env.BRIDGE_CONTRACT_ADDRESS

const getCode = async () => {
    web3.zond.getCode(contractAddress, function (result, error) {
        if (error) {
            console.log(error)
        } else {
            console.log(result)
        }
    });
}

getCode()
