import models = require('../data/models');
import database = require('../data/database');
import scraper = require('./realEstateScraper');

export function scrapeAndSave(search: models.ISearch) {
	
	var url = scraper.getSearchUrl(search);
	
	/*
	scraper.scrapeRentalSearchResults(
		{ url: url },
		(err, results) => {
			
			
			
		});
	*/
}
