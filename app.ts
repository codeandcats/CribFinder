/// <reference path="typings/tsd.d.ts" />
/// <reference path="api.ts" />
/// <reference path="routes.ts" />

import express = require('express');
import path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// Setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Setup authorisation
import auth = require('./auth');
auth.configure();

// Uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Required for passport
import passport = require('passport');
import flash = require('connect-flash');
import expressSession = require('express-session');
app.use(expressSession({ secret: 'stinkywizzleteats' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// Routes
import routes = require('./routes');
routes.map(app);

import api = require('./api');
api.map(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = <any>new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use((err: Error, req: express.Request, res: express.Response, next: Function) => {
		res.status((<any>err).status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use((err: Error, req: express.Request, res: express.Response, next: Function) => {
	res.status((<any>err).status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
