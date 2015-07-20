import express = require('express');
import passport = require('passport');

export function map(app: express.Express) {
	
	var router = express.Router();
	
	router.get('/', function(req, res, next) {
		res.render('index', { title: 'The Jungle' });
	});
	
	router.get('/login', function(req, res, next) {
		res.render('login', { message: req.flash('loginMessage') });
	});
	
	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	
	router.get('/signup', function(req, res, next) {
		res.render('signup', { message: req.flash('signupMessage')})
	});
	
	// Process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // Redirect to the secure profile section
		failureRedirect : '/signup', // Redirect back to the signup page if there is an error
		failureFlash : true // Allow flash messages
	}));
	
	app.get('/profile', authRequired, function(req, res) {
		// Get the user out of session and pass to template
		res.render('profile', {
			user: req.user
		});
	});
	
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	app.use('/', router);
	
	// Route middleware to make sure a user is logged in
	function authRequired(req, res, next) {
		// If user is authenticated in the session, carry on 
		if (req.isAuthenticated()) {
			return next();
		}
		
		// If they aren't redirect them to the home page
		res.redirect('/');
	}
}
