import express = require('express');
import passport = require('passport');

export function map(app: express.Express) {
	
	// Route middleware to make sure a user is logged in
	function authRequired(req, res, next) {
		// If user is authenticated in the session, carry on 
		if (req.isAuthenticated()) {
			return next();
		}
		
		// If they aren't redirect them to the home page
		res.redirect('/login');
	}
	
	var router = express.Router();
	
	router.get('/', authRequired, function(req, res, next) {
		res.render('index', { title: 'Crib Finder' });
	});
	
	router.get('/login', function(req, res, next) {
		res.render('login', { message: req.flash('loginMessage') });
	});
	
	// Process the login form
	router.post('/login', passport.authenticate('local-login', {
		successRedirect : '/', // Redirect to the secure profile section
		failureRedirect : '/login', // Redirect back to the signup page if there is an error
		failureFlash : true // Allow flash messages
	}));
	
	router.get('/signup', function(req, res, next) {
		res.render('signup', { message: req.flash('signupMessage')})
	});
	
	// Process the signup form
	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // Redirect to the secure profile section
		failureRedirect : '/signup', // Redirect back to the signup page if there is an error
		failureFlash : true // Allow flash messages
	}));
	
	router.get('/profile', authRequired, function(req, res) {
		// Get the user out of session and pass to template
		res.render('profile', {
			user: req.user
		});
	});
	
	router.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	app.use('/', router);
}
