/// <reference path="typings/tsd.d.ts" />
/// <reference path="./utils/printer.ts" />
/// <reference path="./utils/realEstateScraper.ts" />

import database = require('./data/database');
import models = require('./data/models');
import printer = require('./utils/printer');
import promise = require('es6-promise');
var Promise = promise.Promise;
var faker = require('faker');
import scraper = require('./utils/realEstateScraper');
import scrapeAndSaver = require('./utils/scrapeAndSaver')
import geoUtils = require('./utils/geo');

//printer.configure({ maxDepth: 5 });

function getTable(tableName: string): database.Crud<any> {
	switch (tableName) {
		case 'user':
		case 'users':
			return database.users;
			
		case 'property':
		case 'properties':
			return database.properties;
			
		case 'search':
		case 'searches':
			return database.searches;
		
		default:
			return new database.AnyCrud(tableName);
	}
}

function clearTable(tableName: string) {
	var table = getTable(tableName || '');
	if (table) {
		table.remove({}, (err, result) => {
			if (err) {
				printer.logError(err);
			}
			else {
				printer.log('Removed ' + result.n + ' ' + tableName);
			}
		});
	}
}

function listTable(tableName: string) {
	var table = getTable(tableName || '');
	if (table) {
		table.find({}, (err, results) => {
			if (err) {
				printer.logError(err);
			}
			else {
				printer.logValue(tableName, results);
			}
		});
	}
}

function addUser(credentials: { email: string, password: string }) {
	let passwordHash = database.users.generateHash(credentials.password);
	
	var newUser: models.IUser = {
		email: credentials.email,
		passwordHash: passwordHash
	};
	
	var table = getTable('users');
	
	table.insert(newUser, (err, result) => {
		if (err) {
			printer.logError(err);
		}
		else if (result.ok) {
			printer.log('Created user: ' + credentials.email);
		}
		else {
			printer.logError('Failed to create user for reasons');
		}
	});
}


function addProperty(): void {
	var table = getTable('properties');
	
	table.insert(getNewProperty(), (err, result) => {
		if (err) {
			printer.logError(err);
		}
		else {
			printer.log('Created ' + result.n + ' properties');
		}
	});
}

function addSearch(defaults: { locations: string[]; ownerEmail: string; sharedWithEmail?: string }): void {
	database.users.findOne({ 'email': defaults.ownerEmail }, (err, owner) => {
		
		if (err) {
			printer.logError('Error finding owner: ', err);
		}
		else if (!owner) {
			printer.logError('Could not find owner: ' + defaults.ownerEmail);
		}
		else {
			let search = getNewSearch(defaults.locations);
			
			search.ownerId = owner._id;
			
			var table = getTable('searches');
			
			function addSearch() {
				table.insert(search, (err, result) => {
					if (err) {
						printer.logError(err);
					}
					else {
						printer.log('Created ' + result.n + ' searches');
					}
				});
			}
			
			if (!defaults.sharedWithEmail) {
				addSearch();
			}
			else {
				database.users.findOne({ 'email': defaults.sharedWithEmail }, (err, sharedWith) => {
					if (err) {
						printer.logError('Error finding shared with user: ', err);
					}
					else if (!sharedWith) {
						printer.logError('Could not find shared with user: ' + defaults.sharedWithEmail);
					}
					else {
						search.sharedWithIds.push(sharedWith._id);
					}
					
					addSearch();
				});
			}
		}
		
	});
}

function insertProperty(property: models.IProperty, done?: () => any): void {
	database.properties.insert(property, (err, result) => {
		if (err) {
			printer.logError("Property failed to save: ", err);
		}
		else if (result.n > 0) {
			printer.log("Property saved");
		}
		else {
			printer.logError("Property failed to save");
		}
	});
}

function updateProperty(existing, update: models.IProperty, done?: () => any): void {
	// Retain some fields from the existing property 
	update._id = existing._id;
	update.comments = existing.comments;
	
	// Copy over overriden fields
	for (var fieldName of existing.overriddenFields) {
		update[fieldName] = existing[fieldName];
	}
	
	database.properties.update({
			vendor: update.vendor,
			vendorId: update.vendorId
		},
		update,
		(err, result) => {
			if (err) {
				printer.logError('Failed to update property: ', err);
			}
			else if (result.nModified > 0) {
				printer.log('Property updated');
			}
			else {
				printer.log('Property failed to update');
			}
		});
}

function saveProperty(property: models.IProperty, done?: () => any) {
	database.properties.findOne({ vendor: property.vendor, vendorId: property.vendorId }, (err, existing) => {
		printer.log();
		if (!existing) {
			insertProperty(property, done);
		}
		else {
			updateProperty(existing, property, done);
		}
	});
}

function scrape(idOrUrl: string, options: { saveToDatabase: boolean }) {
	
	if (idOrUrl.indexOf('http:') > -1) {
		if (idOrUrl.indexOf('realestate.com.au') == -1) {
			printer.logError('Scrape failed, incompatible url: ' + idOrUrl);
			return;
		}
		else {
			scrapeUrl(idOrUrl, options.saveToDatabase);
		}
	}
	else {
		scrapeSearch(idOrUrl, options.saveToDatabase);
	}
	
	function scrapeSearch(id: string, saveToDatabase: boolean) {
		
		database.searches.findOne({ '_id': id }, (err, search) => {
			if (search) {
				let url = scraper.getSearchUrl(search);
				
				scrapeSearchResults(url, saveToDatabase);
				//scrapeAndSaver.scrapeAndSaveListings(search);
			}
			else {
				database.searches.findOne({ 'title': id }, (err, search) => {
					if (search) {
						let url = scraper.getSearchUrl(search);
						
						printer.log('Scraping Search: ', search.title);
						printer.log('Url: ', url);
						
						//scrapeSearchResults(url, saveToDatabase);
						
						scrapeAndSaver.scrapeAndSaveListings(search, {
							progress: status => printer.log(status.message),
							done: operations => printer.log(`Finished scraping. ${operations.inserts} Inserts, ${operations.updates} Updates, ${operations.errors} Errors`)
						});
					}
					else {
						printer.logError('Scrape failed. Could not find search matching: ' + id);
					}
				});
			}
		});		
	}
	
	function scrapeUrl(url: string, saveToDatabase: boolean) {
		if (idOrUrl.indexOf('/rent/') > -1) {
			scrapeSearchResults(idOrUrl, saveToDatabase);
		}
		else {
			scrapeProperty(idOrUrl, saveToDatabase);
		}
	}
	
	function scrapeSearchResults(url: string, saveToDatabse: boolean) {
		scraper.scrapeRentalSearchResults({ url: url }, (err, results) => {
			if (err) {
				printer.logError(err);
			}
			else {
				printer.logValue('Listing', results);
				
				var scrapeCount = 0;
				
				for (var result of results) {
					scrapeProperty(result.url, options.saveToDatabase, () => {
							printer.log('');
							
							scrapeCount++;
							if (scrapeCount == results.length) {
								printer.log(`Finished scraping all ${scrapeCount} properties`);
							}
							else {
								printer.log(`Scraped property ${scrapeCount} of ${results.length}`);
							}
						});
				}
			}
		});
	}
	
	function scrapeProperty(url: string, saveToDatabase: boolean, done?: () => any) {
		scraper.scrapeRentalPropertyPage(url, (err, property) => {
			if (err) {
				printer.logError("Error scraping property: ", err);
			}
			else {
				printer.logValue('Property', property);
				
				if (saveToDatabase) {
					saveProperty(property);
				}
			}
		});
	}
}

function getNewUser(): models.IUser {
	return {
		_id: database.genId(),
		email: faker.internet.email(),
		passwordHash: database.users.generateHash(faker.internet.password())
	};
}

function getNewProperty(): models.IProperty {
	return {
		_id: database.genId(),
		lastScrapedTime: new Date(),
		address: {
			unitNumber: faker.random.number(10) + 1,
			streetNumber: faker.random.number(300) + 1,
			streetName: faker.address.streetName(),
			streetType: faker.address.streetType(),
			suburb: faker.address.city(),
			postCode: faker.address.zipCode(),
			state: faker.address.state(),
			country: faker.address.country(),
		},
		bathroomCount: faker.random.number(1) + 1,
		bedroomCount: faker.random.number(2) + 1,
		bond: faker.random.number({ min: 400, max: 700 }) * 4,
		price: faker.random.number({ min: 400, max: 700 }),
		description: faker.lorem.paragraph(),
		inspectionTimes: [],
		distanceToTrain: null,
		distanceToTram: null,
		features: {
			airCon: faker.random.boolean(),
			balcony: faker.random.boolean(),
			dishwasher: faker.random.boolean(),
			gym: faker.random.boolean(),
			laundry: faker.random.boolean(),
			pool: faker.random.boolean(),
			furniture: faker.random.boolean(),
		},
		parkCount: faker.random.number(2),
		images: [],
		isArchived: false,
		starRating: null,
		title: faker.lorem.sentence(),
		url: faker.internet.url(),
		vendor: models.Vendor.RealEstate,
		vendorId: faker.random.number(1000000),
		propertyType: models.PropertyType.Apartment,
		listingType: models.ListingType.Rental,
		comments: []
	};
}

function getNewSearch(locations: string[]): models.ISearch {
	
	var search: models.ISearch = {
		_id: null,
		title: locations.join(', '),
		locations: locations,
		listingType: models.ListingType.Rental,
		propertyTypes: [models.PropertyType.Apartment, models.PropertyType.Unit],
		
		has: {
			airCon: faker.random.boolean() ? undefined : faker.random.boolean(),
			balcony: faker.random.boolean() ? undefined : faker.random.boolean(),
			dishwasher: faker.random.boolean() ? undefined : faker.random.boolean(),
			gym: faker.random.boolean() ? undefined : faker.random.boolean(),
			laundry: faker.random.boolean() ? undefined : faker.random.boolean(),
			pool: faker.random.boolean() ? undefined : faker.random.boolean()
		},
		
		min: {
			bedrooms: faker.random.boolean() ? undefined : faker.random.number(1) + 2,
			bathrooms: faker.random.boolean() ? undefined : faker.random.number(1) + 1,
			parks: faker.random.boolean() ? undefined : faker.random.number(1) + 1,
		},
		
		max: {
			price: faker.random.boolean() ? undefined : (faker.random.number(3 * 50) + 500)
		},
		
		ownerId: null,
		sharedWithIds: [],
	};
	
	return search;
}

function findRows(tableName: string, queryJson: any) {
	
	var table = getTable(tableName);
	
	var query = JSON.parse(queryJson);
	
	table.find(query, (err, results) => {
		if (err) {
			printer.logError(err);
		}
		else {
			printer.logValue('Results', results);
		}
	});
	
}

function showDistance(location1: string, location2: string) {
	
	geoUtils.getLatLong(location1, (err, coord) => {
		
		printer.logValue('coord', coord);
		
	});
	
	//https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA
}

switch (process.argv[2] || '') {
	case 'clear':
		clearTable(process.argv[3]);
		break;

	case 'list':
		listTable(process.argv[3]);
		break;

	case 'find':
		findRows(process.argv[3], process.argv[4]);
		break;

	case 'add':
		var tableName = String(process.argv[3] || '').toLowerCase();
		
		switch (tableName) {
			case 'user':
			case 'users':
				addUser({
					email: process.argv[4],
					password: process.argv[5]
				});
				break;
				
			case 'property':
			case 'properties':
				addProperty();
				break;
			
			case 'search':
			case 'searches':
				addSearch({
					locations: [process.argv[4]],
					ownerEmail: process.argv[5],
					sharedWithEmail: process.argv[6]
				});
				break;
				
			default:
				var row = JSON.parse(process.argv[4]);
				var customTable = new database.AnyCrud(tableName);
				customTable.insert(row, (err, result) => {
					if (err) {
						printer.logError('Failed to insert row: ', err);
					}
					else {
						printer.log(`Inserted ${result.n} rows into ${tableName}`);
					}
				});
				break;
				
		}
		break;
		
	case 'update':
		var tableName = String(process.argv[3] || '').toLowerCase();
		
		var query = JSON.parse(process.argv[4]); 
		var row = JSON.parse(process.argv[5]);
		var table = new database.AnyCrud(tableName);
		table.update(query, row, (err, result) => {
			if (err) {
				printer.logError('Failed to update row: ', err);
			}
			else {
				printer.log(`Updated ${result.nModified} rows in ${tableName}`);
			}
		});
		break;
		
	case 'scrape':
		scrape(process.argv[3] || '', {
			saveToDatabase: process.argv[4] == 'save'
		});
		break;
		
	case 'suggest':
		scraper.getLocationSuggestions(process.argv[3], (err, results) => {
			printer.logValue('Suggestions', results);
		});
		break;
		
	case 'url':
		database.searches.findOne({ title: process.argv[3] }, (err, search) => {
			var url = scraper.getSearchUrl(search);
			printer.logValue('Url', url);
		});
		break;
		
	case 'dist':
		showDistance(process.argv[3], process.argv[4]);
		break;

	default:
		printer.log('Unknown args: ' + process.argv.splice(0, 2).join(' '));
		break;
}

