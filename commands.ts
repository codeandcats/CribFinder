import database = require('./data/database');
import models = require('./data/models');
import printer = require('./utils/printer');
import promise = require('es6-promise');
var Promise = promise.Promise;
var faker = require('faker');
import scraper = require('./utils/realEstateScraper');

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
			return null;
	}
}

switch (process.argv[2] || '') {
	case 'clear':
		var tableName = process.argv[3] || '';
		var table = getTable(tableName);

		if (table) {
			table.remove({}, (err, result) => {
				if (err) {
					console.log('Error: ', err);
				}
				else {
					console.log('Removed ' + result.n + ' ' + tableName);
				}
			});
		}
		break;

	case 'list':
		var tableName = process.argv[3] || '';
		var table = getTable(tableName);
		if (table) {
			table.find({}, (err, results) => {
				if (err) {
					console.log('Error: ', err);
				}
				else {
					printer.logValue(tableName, results);
				}
			});
		}
		break;

	case 'add':
		var tableName = process.argv[3] || '';
		var table = getTable(tableName);
		if (table == database.users) {
			let email = process.argv[4];
			let password = process.argv[5];
			let passwordHash = database.users.generateHash(password);
			
			var newUser: models.IUser = {
				local: {
					email: email,
					passwordHash: passwordHash
				},
				facebook: null,
				google: null,
				twitter: null
			};
			
			table.insert(newUser, (err, result) => {
				if (err) {
					console.error('Error: ', err);
				}
				else if (result.ok) {
					console.log('Created user: ' + email);
				}
				else {
					console.error('Failed to create user for reasons');
				}
			});
		}
		else if (table == database.properties) {
			table.insert(getNewProperty(), (err, result) => {
				if (err) {
					console.log('Error: ', err);
				}
				else {
					console.log('Created ' + result.n + ' properties');
				}
			});
		}
		else if (table == database.searches) {
			let location = process.argv[4];
			let ownerEmail = process.argv[5];
			let sharedWithEmail = process.argv[6];
			
			let search = getNewSearch(location);
			
			database.users.findOne({ 'local.email': ownerEmail }, (err, owner) => {
				
				if (err) {
					console.error('Error finding owner: ', err);
				}
				else if (!owner) {
					console.error('Could not find owner: ' + ownerEmail);
				}
				else {
					search.ownerId = owner._id;
					
					function addSearch() {
						table.insert(search, (err, result) => {
							if (err) {
								console.log('Error: ', err);
							}
							else {
								console.log('Created ' + result.n + ' searches');
							}
						});
					}
					
					if (!sharedWithEmail) {
						addSearch();
					}
					else {
						database.users.findOne({ 'local.email': sharedWithEmail }, (err, sharedWith) => {
							if (err) {
								console.error('Error finding shared with user: ', err);
							}
							else if (!sharedWith) {
								console.error('Could not find shared with user: ' + sharedWithEmail);
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
		break;
		
	case 'scrape':
		let url = process.argv[3] || ''; 
		if (url.indexOf('realestate.com.au') > -1) {
			if (url.indexOf('/rent/') > -1) {
				scraper.scrapeRentalSearchResults({ url: url }, (err, results) => {
					printer.logValue('Listing', results);
				});
			}
			else {
				scraper.scrapeRentalPropertyPage(url, (err, property) => {
					if (err) {
						console.error("Error scraping property: ", err);
					}
					else {
						printer.logValue('Property', property);
						
						if (process.argv[4] == 'save') {
							database.properties.findOne({ vendor: property.vendor, vendorId: property.vendorId }, (err, existing) => {
								console.log();
								if (!existing) {
									database.properties.insert(property, (err, result) => {
										if (err) {
											console.error("Property failed to save: ", err);
										}
										else if (result.n > 0) {
											console.log("Property saved");
										}
										else {
											console.log("Property failed to save");
										}
									});
								}
							});
						}
					}
				});
			}
		}
		break;

	default:
		console.log('Unknown args: ' + process.argv.splice(0, 2).join(' '));
		break;
}

function getNewUser(): models.IUser {
	return {
		_id: database.genId(),
		local: {
			email: faker.internet.email(),
			passwordHash: database.users.generateHash(faker.internet.password())
		},
		facebook: null,
		google: null,
		twitter: null
	};
}

function getNewProperty(): models.IProperty {
	return {
		_id: database.genId(),
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
		pricePerWeek: faker.random.number({ min: 400, max: 700 }),
		description: faker.lorem.paragraph(),
		distanceToTrain: null,
		distanceToTram: null,
		hasAirCon: faker.random.boolean(),
		hasBalcony: faker.random.boolean(),
		hasDishwasher: faker.random.boolean(),
		hasGym: faker.random.boolean(),
		hasLaundry: faker.random.boolean(),
		hasPool: faker.random.boolean(),
		isFurnished: faker.random.boolean(),
		parkCount: faker.random.number(2),
		images: [],
		isArchived: false,
		starRating: null,
		title: faker.lorem.sentence(),
		url: faker.internet.url(),
		vendor: models.Vendor.RealEstate,
		vendorId: faker.random.number(1000000),
		propertyType: models.PropertyType.Apartment,
		listingType: models.ListingType.Rental
	};
}

function getNewSearch(location: string): models.ISearch {
	
	var search: models.ISearch = {
		_id: null,
		title: location,
		location: location,
		listingType: models.ListingType.Rental,
		
		hasAirCon: faker.random.boolean() ? undefined : faker.random.boolean(),
		hasBalcony: faker.random.boolean() ? undefined : faker.random.boolean(),
		hasDishwasher: faker.random.boolean() ? undefined : faker.random.boolean(),
		hasGym: faker.random.boolean() ? undefined : faker.random.boolean(),
		hasLaundry: faker.random.boolean() ? undefined : faker.random.boolean(),
		hasPool: faker.random.boolean() ? undefined : faker.random.boolean(),
		isFurnished: faker.random.boolean() ? undefined : faker.random.boolean(),
		
		ownerId: null,
		sharedWithIds: [],
		
		minBathrooms: faker.random.boolean() ? undefined : faker.random.number(1) + 1,
		minBedrooms: faker.random.boolean() ? undefined : faker.random.number(1) + 2,
		minParks: faker.random.boolean() ? undefined : faker.random.number(1) + 1,
		
		maxRent: faker.random.boolean() ? undefined : (faker.random.number(3 * 50) + 500)
	};
	
	return search;
}

/*
var userToAdd: models.IUser = {
	_id: database.genId(),
	local: {
		email: 'bendaniel@gmail.com',
		passwordHash: database.users.generateHash('KittyCatz')
	},
	facebook: null,
	twitter: null,
	google: null
}; 

function addUser(): Promise<any> {
	return new Promise(resolve => {
		console.log('');
		console.log('insert user:');

		database.users.insert(userToAdd, (err, result) => {
			printer.logValue('User.insert Error', err);
			printer.logValue('User.insert Result', result);
			resolve();
		});
	});
}

function updateUser(): Promise<any> {
	return new Promise(resolve => {
		console.log('');
		console.log('updating user:');

		database.users.update(
			{
				'local.email': 'bendaniel@gmail.com'
			},
			{
				$set: {
					local: { email: 'codeandcats@gmail.com' }
				} 
			},
			(err, result) => {
				printer.logValue('err', err);
				printer.logValue('result', result);
				resolve();
			});
	});
}

function listUsers(): Promise<any> {
	return new Promise(resolve => {
		console.log('');
		console.log('listing users:');
		database.users.find(null, (err, users) => {
			printer.logValue('err', err);
			printer.logValue('users', users);
			resolve();
		});
	});
}

function removeUsers(): Promise<any> {
	return new Promise(resolve => {
		console.log('');
		console.log('removing users:');
		database.users.remove({}, (err, result) => {
			printer.logValue('err', err);
			printer.logValue('result', result);
			resolve();
		});
	});
}

removeUsers().then(() => {
	//addUser().then(() => {
	//	updateUser().then(listUsers);
	//});
});
*/