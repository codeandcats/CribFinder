import database = require('./data/database');
import models = require('./data/models');
import printer = require('./utils/printer');
import promise = require('es6-promise');
var Promise = promise.Promise;
var faker = require('faker');

//printer.configure({ maxDepth: 5 });

function getTable(tableName: string): database.Crud<any> {
	switch (tableName) {
		case 'user':
		case 'users':
			return database.users;
			
		case 'property':
		case 'properties':
			return database.properties;
			
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
			table.insert(getNewUser(), (err, result) => {
				if (err) {
					console.log('Error: ', err);
				}
				else {
					console.log('Created ' + result.n + ' users');
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
		parkCount: faker.random.number(2),
		images: [],
		isArchived: false,
		starRating: null,
		title: faker.lorem.sentence(),
		url: faker.internet.url(),
		vendor: models.Vendor.RealEstate,
		vendorId: faker.random.number(1000000),
		propertyType: models.PropertyType.Apartment
	};
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