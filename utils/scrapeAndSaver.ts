import models = require('../data/models');
import database = require('../data/database');
import scraper = require('./realEstateScraper');

/*
	Loop through search results
		Insert / Update result in database
		
	Loop through non-archived properties in database matching search with update time != 'TODAY' 
		Rescrape and update
*/

enum SaveOperation {
	Insert = <any>'Insert',
	Update = <any>'Update'
}

export function scrapeAndSaveListings(search: models.ISearch) {
	
	var url = scraper.getSearchUrl(search);
	
	var operations = {
		inserts: 0,
		updates: 0,
		errors: 0
	};
	
	scraper.scrapeRentalSearchResults(
		{ url: url },
		(err, listings) => {
			for (let listing of listings) {
				scrapeAndSaveListing(listing, (err, operation) => {
					if (err) {
						operations.errors++;
					}
					else if (operation == SaveOperation.Insert) {
						operations.inserts++;
					}
					else if (operation == SaveOperation.Update) {
						operations.updates++;
					}
					
					// Have we finished?
					if (operations.errors + operations.inserts + 
						operations.updates == listings.length) {
						
						rescrapeExistingPropertiesMatchingSearch(search);
						
					} 
				});
			}
		});
}

function scrapeAndSaveListing(
	listing: models.IPropertySearchResult,
	done: (Error, SaveOperation?) => any) {
	
	scraper.scrapeRentalPropertyPage(listing.url, (err, property) => {
		
		if (err) {
			done(err);
			return;
		}
		
		database.properties.findOne({
				vendor: listing.vendor,
				vendorId: listing.vendorId
			},
			(err, existing) => {
				if (err) {
					done(err);
				}
				else if (existing) {
					updateProperty(existing, property, err => {
						if (err) {
							done(err);
						}
						else {
							done(null, SaveOperation.Update);
						}
					});
				}
				else {
					insertProperty(property, err => {
						if (err) {
							done(err);
						}
						else {
							done(SaveOperation.Insert);
						}
					});
				}
			});
		
	});
}

function updateProperty(
	existing: models.IProperty,
	property: models.IProperty,
	done: (Error) => any) {
	
	// Don't overwrite these existing properties!
	property._id = existing._id;
	property.comments = existing.comments;
	property.isArchived = existing.isArchived;
	
	// TODO: Should probably recalculate these
	property.distanceToTrain = existing.distanceToTrain;
	property.distanceToTram = existing.distanceToTram;
	property.starRating = existing.starRating;
	
	var query = { _id: existing._id	};
	
	database.properties.update(query, property, done);	
}

function insertProperty(property: models.IProperty, done: (Error) => any) {
	
	database.properties.insert(property, done);
	
}

function rescrapeExistingPropertiesMatchingSearch(search: models.ISearch) {
	
	var url = scraper.getSearchUrl(search);
	
	scraper.scrapeRentalPropertyPage(url, (err, property) => {
		
		
		
	});
	
}

