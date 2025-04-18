const fs = require("fs");
const hypc = require("@theqrl/hypc");

/* The main contract should be mentioned here */
var input = {
    language: 'Hyperion',
    sources: {
        'ZondBridge.hyp': {
            content: fs.readFileSync("./contracts/ZondBridge.hyp").toString(),
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

function GetCompilerOutput() {
    const output = JSON.parse(hypc.compile(JSON.stringify(input)));
    return output;
}

module.exports = {
    GetCompilerOutput,
}
