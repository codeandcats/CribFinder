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
import stringUtils = require('./utils/strings');
import nbnUtils = require('./utils/nbn');

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
			
		case 'suburb':
		case 'suburbs':
			return database.suburbs;
		
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

function listTable(tableName: string, limit: string) {
	var table = getTable(tableName || '');
	if (table) {
		table.find({}, { limit: limit && +limit }, (err, results) => {
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

function addSearch(defaults: { suburbNames: string[]; ownerEmail: string; sharedWithEmail?: string }): void {
	database.users.findOne({ 'email': defaults.ownerEmail }, (err, owner) => {
		
		if (err) {
			printer.logError('Error finding owner: ', err);
		}
		else if (!owner) {
			printer.logError('Could not find owner: ' + defaults.ownerEmail);
		}
		else {
			getNewSearch(defaults.suburbNames, search => {			
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
			});
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
			furnished: faker.random.boolean(),
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

function getNewSearch(suburbNames: string[], callback: (search: models.ISearch) => any) {
	
	function randomFeatureImportance(): models.SearchFeatureImportance {
		switch (faker.random.number(3)) {
			case 0: return models.SearchFeatureImportance.DontCare;
			case 1: return models.SearchFeatureImportance.MustHave;
			default: return models.SearchFeatureImportance.NiceToHave;
		}
	}
	
	var search: models.ISearch = {
		_id: null,
		title: suburbNames.join(', '),
		suburbs: [],
		listingType: models.ListingType.Rental,
		propertyTypes: [models.PropertyType.Apartment, models.PropertyType.Unit],
		
		features: {
			airCon: randomFeatureImportance(), 
			balcony: randomFeatureImportance(),
			dishwasher: randomFeatureImportance(),
			gym: randomFeatureImportance(),
			laundry: randomFeatureImportance(),
			pool: randomFeatureImportance(),
			furnished: randomFeatureImportance(),
			nbn: randomFeatureImportance()
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
	
	var errorCount = 0;
	
	function addSuburbToList(suburbName: string) {
		database.suburbs.findOne({ name: stringUtils.toTitleCase(suburbName) }, (err, suburb) => {
			if (err || !suburb) {
				errorCount++;
				printer.logError(new Error(`Could not find suburb: "${stringUtils.toTitleCase(suburbName)}"`));
			}
			else {
				search.suburbs.push(suburb);
			}
			
			if (search.suburbs.length + errorCount == suburbNames.length) {
				callback(search);
			}
		});
	}
	
	for (var suburbName of suburbNames) {
		addSuburbToList(suburbName);
	}
}

function findRows(tableName: string, queryJson: any) {
	
	var table = getTable(tableName);
	
	var query = JSON.parse(queryJson);
	
	printer.logValue("query", query);
	
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
	
	geoUtils.getCoord(location1, (err, coord) => {
		
		printer.logValue('coord', coord);
		
	});
	
	//https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA
}

var csv = require('fast-csv');

function importSuburbs(fileName?: string) {
	fileName = fileName || 'suburbs.csv';
	
	var csvOptions = {
		objectMode: true,
		headers: true,
		ignoreEmpty: true
	};
	
	var parsedCount = 0;
	var skippedCount = 0;
	var insertedCount = 0;
	var failedCount = 0;
	var hasFinished = false;
	
	printer.log(`Importing suburb data from "${fileName}"`);
	
	function checkFinished() {
		if (hasFinished && (insertedCount + skippedCount + failedCount == parsedCount)) {
			printer.log(`Finished. Parsed ${parsedCount}, Imported ${insertedCount}, Failed ${failedCount}, Ignored ${skippedCount} suburbs`);
		}
	}
	
	var insertBuffer: models.ISuburb[] = [];
	
	const maxBufferSize = 1000;
	
	function flushBuffer() {
		let buffer = insertBuffer;
		
		if (!buffer.length) {
			return;
		}
		
		database.suburbs.insert(buffer, (err, result) => {
			insertedCount += result.n;
			
			// Count how many were in the buffer that didn't get inserted
			failedCount = buffer.length - result.n;
			
			//if (insertedCount % 1000 == 0) {
			printer.log(`Imported ${insertedCount} suburbs`);
			//}
			
			checkFinished();
		});
		
		insertBuffer = [];
	}
	
	csv
		.fromPath(fileName, csvOptions)
		.on("data", function(data){
			var suburb: models.ISuburb = {
				_id: null,
				name: data.suburb,
				state: data.state && data.state.toUpperCase(),
				postCode: data.postCode,
				country: 'Australia',
				coord: {
					lat: +data.lat,
					lng: +data.lng
				} 
			};
			
			parsedCount++;
			
			if (!suburb.coord.lat && !suburb.coord.lng) {
				skippedCount++;
				checkFinished();
			}
			else {
				insertBuffer.push(suburb);
				
				if (insertBuffer.length == maxBufferSize) {
					flushBuffer();
				}
			}
		})
		.on("end", function() {
			hasFinished = true;
			flushBuffer();
		});
}

function importData(collectionName: string) {
	var fileName = collectionName + '.csv';
	
	if (collectionName.toLowerCase() == 'suburbs') {
		importSuburbs(fileName);
	}
	else {
		printer.logError(new Error(`Cannot import into collection: "${collectionName}"`));
	}
}

function showListings(searchTitle: string) {
	database.searches.findOne({ title: searchTitle }, (err, search) => {
		database.searches.results(search, (err, properties) => {
			printer.logValue('Search Results', properties);
		});
	});
}

function showCount(collectionName: string, query?: any): void {
	database.connect((err, db) => {
		if (err) {
			printer.logError(err);
		}
		else {
			db.collection(collectionName).count((err, count) => {
				if (err) {
					printer.logError(err);
				}
				else {
					printer.log(`${count} documents found.`);
				}
				db.close();
			});
		}
	});
}

function checkNbn(addressText: string) {
	addressText = addressText || '8 Bale Street, Ascot, QLD 4007';
	var values = addressText.split(',').map(s => s.trim());
	
	printer.log('Looking up NBN Availability: ' + addressText);
	
	var address: models.IPropertyAddress = <any>{};
	
	[address.streetNumber, address.streetName, address.streetType] = (values[0] || '').split(' ');
	
	address.suburb = encodeURIComponent((values[1] || '').trim().toLowerCase());
	
	[address.state, address.postCode] = (values[2] || '').toLowerCase().split(' ');
	address.postCode = address.postCode || values[3] || '';
	
	geoUtils.getCoord(addressText, (err, coord) => {
		if (err) {
			printer.log('Failed to get coordinates for address. Error: ', err);
			return;
		}
		
		address.coord = coord;
		
		nbnUtils.isAvailable(address, (err, result) => {
			if (err) {
				printer.log('Failed to get NBN availability. Error: ', err);
				return;
			}
			
			printer.logValue('Availability', result);
		});
	});
}

switch (process.argv[2] || '') {
	case 'clear':
		clearTable(process.argv[3]);
		break;

	case 'list':
		listTable(process.argv[3], process.argv[4]);
		break;

	case 'find':
		findRows(process.argv[3], process.argv[4]);
		break;
		
	case 'count':
		if (process.argv[4]) {
			showCount(process.argv[3], JSON.parse(process.argv[4]));
		}
		else {
			showCount(process.argv[3]);
		}
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
					suburbNames: [process.argv[4]],
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
		
	case 'import':
		importData(process.argv[3]);
		break;
		
	case 'results':
	case 'search':
	case 'listings':
		showListings(process.argv[3]);
		break;
		
	case 'nbn':
		checkNbn(process.argv[3]);
		break;

	default:
		printer.log('Unknown args: ' + process.argv.splice(0, 2).join(' '));
		break;
}

