/// <reference path="../data/database.ts" />

import express = require('express');
import passport = require('passport');
import database = require('../data/database');
import stringUtils = require('../utils/strings');
import scraper = require('../utils/realEstateScraper');
import models = require('../data/models');

export function map(app: express.Express) {
	
	// Route middleware to make sure a user is logged in
	function authRequired(req: express.Request, res: express.Response, next: Function) {
		// If user is authenticated in the session, carry on 
		if (req.isAuthenticated()) {
			return next();
		}
		
		// If they aren't authenticated then return not authorised error code
		res.send(401, 'Not Authorised');
	}
	
	var router = express.Router();
	
	function extendSuburbs(suburbs: models.ISuburb[]): void {
		if (suburbs) {
			suburbs.forEach(s => {
				(<any>s).text = `${s.name}, ${s.state} ${s.postCode}`;
			});
		}
	}
	
	function extendSearches(searches: models.ISearch[]): void {
		searches.forEach(search => {
			extendSuburbs(search.suburbs);
		});
	}
	
	function cleanseSuburb(suburb: models.ISuburb): void {
		delete (<any>suburb).text;
		delete (<any>suburb).relevance;
	}
	
	function cleanseSearch(search: models.ISearch): void {
		search.title = stringUtils.toTitleCase(search.title);
		if (search.suburbs) {
			search.suburbs.forEach(s => cleanseSuburb(s));
		}
	}
	
	// List
	router.get('/searches', authRequired, function(req, res, next) {
		
		// Find all searches owned by or shared with this user
		var userId = req.user._id;
		
		database.searches.find({ $or: [{ ownerId: userId }, { sharedWithIds: userId }] }, (err, results) => {
			extendSearches(results);
			res.json(results);
		});
	});
	
	// Get
	router.get('/searches/:id', authRequired, (req, res, next) => {
		
		var query = {
			_id: req.params.id,
			$or: [
				{ ownerId: req.user._id },
				{ sharedWithIds: req.user._id }
			]
		};
		
		database.searches.findOne(query, (err, result) => {
			if (err) {
				res.send(500, err.message || err);
			}
			else {
				if (!result) {
					res.send(404, 'Not Found');
				}
				else {
					extendSearches([result]);
					res.json(result);
				}
			}
		});
		
	});
	
	// Insert
	router.post('/searches', authRequired, (req, res, next) => {
		
		var search = req.body;
		
		cleanseSearch(search);
		
		search.ownerId = req.user._id;
		
		console.log('Inserting Search: ', search);
		
		
		
		database.searches.insert(search, (err, result) => {
			if (err) {
				res.send(500, (err && err.message) || err);
			}
			else {
				if (result.n) {
					res.send(201, 'Search created');
				}
				else {
					res.send(500, 'Search not created');
				}
			}
		});
		
	});
	
	// Update
	router.put('/searches/:id', authRequired, (req, res, next) => {
		
		var query = {
			$and: [
				{ _id: req.params.id },
				{
					$or: [
						{ ownerId: req.user._id },
						{ sharedWithIds: req.user._id }
					]
				}
			]
		};
		
		var search = req.body;
		
		cleanseSearch(search);
		
		database.searches.update(
			query,
			search,
			(err, result) => {
				if (err) {
					res.send(500, (err && err.message) || err);
				}
				else if (result.n) {
					res.send(200, 'Search updated');
				}
				else {
					res.send(404, 'Not Found');
				}
			});
	});
	
	// Delete
	router.delete('/searches/:id', authRequired, (req, res, next) => {
		
		var query = {
			_id: req.params.id,
			ownerId: req.user._id	
		};
		
		database.searches.remove(query, (err, result) => {
			
			if (err) {
				res.send(500, (err && err.message) || err);
			}
			else if (result.n) {
				res.send(200, 'Search deleted');
			}
			else {
				res.send(404, 'Not Found');
			}
			
		});
		
	});
	
	// Search Results
	router.get('/searches/:id/results', authRequired, (req, res, next) => {
		
		var query = {
			_id: req.params.id,
			$or: [
				{ ownerId: req.user._id },
				{ sharedWithIds: req.user._id }
			]
		};
		
		database.searches.findOne(query, (err, result) => {
			if (err) {
				res.send(500, err.message || err);
			}
			else {
				if (!result) {
					res.send(404, 'Not Found');
				}
				else {
					database.searches.results(result, (err, properties) => {
						res.json(properties);
					});
				}
			}
		});
		
	});
	
	// Suburbs List
	router.get('/suburbs/suggest/:name', function(req, res, next) {
		scraper.getLocationSuggestions(req.params.name, (err, suburbs) => {
			if (err) {
				res.send(500, err.message || err);
			}
			else {
				extendSuburbs(suburbs);
				res.json(suburbs);
			}
		});
	});
	
	// Get current user
	router.get('/users/active', authRequired, function(req, res, next) {
		
		var userId = req.user._id;
		
		database.users.findOne({ _id: userId }, (err, result) => {
			delete result.passwordHash;
			res.json(result).end();
		});
		
	});
	
	app.use('/api', router);
}
