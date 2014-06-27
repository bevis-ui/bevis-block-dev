var express = require('express');
var morgan = require('morgan');
var path = require('path');
var enbMiddleware = require('enb/lib/server/server-middleware');

module.exports = function(options) {
    var app = express();

    app.use(morgan());
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'jade');
    app.use('/_bevis-block-dev', express.static(path.join(__dirname, '../public')));
    app.use(enbMiddleware.createMiddleware());
    app.use('/', express.static(process.cwd()));

    app.get('/', function (req, res) {
        res.render('index', {
            javascript: options.javascript,
            css: options.css
        });
    });

    app.listen(options.port);

    console.log('App was started at 0.0.0.0:' + options.port)
};
