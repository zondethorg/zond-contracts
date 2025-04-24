const fs = require("fs");
const hypc = require("@theqrl/hypc");

/* The main contract should be mentioned here */
var input = {
    language: 'Hyperion',
    sources: {
        'ZondAtomicSwap.hyp': {
            content: fs.readFileSync("./contracts/ZondAtomicSwap.hyp").toString(),
        },
        'IERC20.hyp': {
            content: fs.readFileSync("./contracts/openzeppelin-contracts/IERC20.hyp").toString(),
        },
        'MockERC20.hyp': {
            content: fs.readFileSync("./contracts/MockERC20.hyp").toString(),
        }
    },
    settings: {
        optimizer: {
            enabled: true
        },
        viaIR: true,
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

/* All imports of solidity contract should be mentioned here (if any) otherwise should be left blank */
function findImports(path) {
    if (path === '@openzeppelin-contracts/ReentrancyGuard.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/ReentrancyGuard.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/IERC20.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/IERC20.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/Address.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/Address.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/SafeERC20.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/SafeERC20.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/IERC1363.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/IERC1363.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/Errors.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/Errors.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/IERC165.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/IERC165.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/Ownable.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/Ownable.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/Pausable.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/Pausable.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/Context.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/Context.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/IERC20Metadata.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/IERC20Metadata.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/ERC20.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/ERC20.hyp").toString()
        };
    else if (path === '@openzeppelin-contracts/draft-IERC6093.hyp')
        return {
            contents:
                fs.readFileSync("./contracts/openzeppelin-contracts/draft-IERC6093.hyp").toString()
        };
    else return { error: 'File not found' };
}

function GetCompilerOutput() {
    const output = JSON.parse(hypc.compile(JSON.stringify(input), { import: findImports }));
    return output;
}

module.exports = {
    GetCompilerOutput,
}
