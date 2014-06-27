#!/usr/bin/env node
var runApp = require('../server/app');
var inputArguments = process.argv.slice(2);
var options = {};

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
        case '-bt':
        case '--bt':
            options.bt = argVal;
            break;

    }
}

runApp(options);
