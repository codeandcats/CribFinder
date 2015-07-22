import express = require('express');
import passport = require('passport');
import database = require('./data/database');

export function map(app: express.Express) {
	
	// Route middleware to make sure a user is logged in
	function authRequired(req: express.Request, res: express.Response, next: Function) {
		// If user is authenticated in the session, carry on 
		if (req.isAuthenticated()) {
			return next();
		}
		
		// If they aren't authenticated then return not authorised error code
		res.status(401).end();
	}
	
	var router = express.Router();
	
	router.get('/searches', authRequired, function(req, res, next) {
		
		// Find all searches owned by or shared with this user
		var userId = req.user._id;
		
		database.searches.find({ $or: [{ ownerId: userId }, { sharedWithIds: userId }] }, (err, results) => {
			res.json(results).end();
		});
	});
	
	app.use('/api', router);
}
