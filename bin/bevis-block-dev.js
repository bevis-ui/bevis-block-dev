#!/usr/bin/env node
var runApp = require('../server/app');
var inputArguments = process.argv.slice(2);
var options = {port: 8080};

while (inputArguments.length > 0) {
    var argName = inputArguments.shift();
    var argVal = inputArguments.shift();
    switch (argName) {
        case '-j':
        case '--javascript':
            options.javascript = argVal;
            break;
        case '-c':
        case '--css':
            options.css = argVal;
            break;
        case '-p':
        case '--port':
            options.port = parseInt(argVal);
            break;
    }
}

runApp(options);
