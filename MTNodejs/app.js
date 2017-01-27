var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('my-application');


process.env.MONGOLAB_URI = 'mongodb://bennyboy:Maxine20/@ds063180.mongolab.com:63180/queueuplocal';

var mongo = require('mongoskin');
// var db = mongo.db('mongodb://localhost:27017/gotimeLocal', {native_parser: true});

var db = mongo.db(process.env.MONGOLAB_URI, {native_parser: true});

var routes = require('./index');
var users = require('./users');

var app = express();

// view engine setup
app.set('views', 'myClient');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080); 

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static('myClient'));


// KEEP THIS ABOVE THE BELOW TWO LINES!!!
app.use(function (req, res, next) {
	req.db = db;
	next();
});

app.use('/', routes);	
app.use('/users', users);	


var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
  console.log('Listening on 8080');
});

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});



module.exports = app;
