// Load all the things we need
import passport = require('passport');
import passportLocal = require('passport-local');
var LocalStrategy = passportLocal.Strategy;

import database = require('./data/database')
import models = require('./data/models');

export function configure() {
	
	// Used to serialize the user for the session
	passport.serializeUser((user, done) => {
		done(null, user._id);
	});
	
	// Used to deserialize the user
	passport.deserializeUser((id, done) => {
		database.users.findOne({ _id: id }, (err, user) => {
			done(err, user);
		});
	});
	
	// =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
	passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
		// Callback with email and password from our form

        // Find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        database.users.findOne({ 'local.email' :  email }, function(err, user) {
            // If there are any errors, return the error before anything else
            if (err) {
                return done(err);
			}

            // If no user is found, return the message
            if (!user) {
				// req.flash is the way to set flashdata using connect-flash
                return done(null, false, req.flash('loginMessage', 'No user found.'));
			}

            // If the user is found but the password is wrong
            if (!database.users.matchesPassword(password, user.local.passwordHash)) {
				// Create the loginMessage and save it to session as flashdata
				return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
			}

            // All is well, return successful user
            return done(null, user);
        });

    }));
	
	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	
	passport.use('local-signup', new LocalStrategy({
			// by default, local strategy uses username and password, we will override with email
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true // allows us to pass back the entire request to the callback
		},
		(req, email, password, done) => {
			// asynchronous
			// User.findOne wont fire unless data is sent back
			process.nextTick(function() {
			
				// Find a user whose email is the same as the forms email
				// we are checking to see if the user trying to login already exists
				database.users.findOne({ 'local.email': email }, (err, user) => {
					// If there are any errors, return the error
					if (err) {
						return done(err);
					}
					
					// Check to see if theres already a user with that email
					if (user) {
						return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
					}
					else {
						// If there is no user with that email
						// create the user
						var newUser: models.IUser = <any>{};
						
						newUser._id = database.genId();
						
						// Set the user's local credentials
						newUser.local = {
							email: email,
							passwordHash: database.users.generateHash(password)
						};
						
						// Save the user
						database.users.insert(newUser, function(err) {
							if (err) {
								throw err;
							}
							return done(null, newUser);
						});
					}

				});

			});

		}));
}