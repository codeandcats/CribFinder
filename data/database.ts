/// <reference path="models.ts" />

'use strict';

import geoUtils = require('../utils/geo');
import mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;

// Connection URL
var url = process.env['DB_PATH'] || 'mongodb://localhost:27017/properties';

export function connect(callback: (err: Error, db: mongodb.Db) => any): void {
	mongoClient.connect(url, function(err, db) {
		callback(err, db);
	});
}

export interface ICrudResult {
	ok: number;
	n: number;
}

export interface IUpdateResult extends ICrudResult {
	ok: number;
	n: number;
	nModified: number;
}

import uuid = require('node-uuid');

export function genId() {
	return uuid.v1();
}

export class Crud<T extends models.IModel> {
	
	protected collectionName: string;
	
	public findOne(query: Object, callback: (err: Error, result: T) => any): void {
		connect((err, db) => {
			if (err) {
				callback(err, null);
			}
			else {
				db.collection(this.collectionName).findOne(query, (err, result) => {
					db.close();
					callback(err, result);
				});
			}
		});
	}
	
	public find(query: Object, callback: (err: Error, results: T[]) => any): void;
	public find(query: Object, options: { limit: number }, callback: (err: Error, results: T[]) => any): void;
	public find(): void {
		
		var query: Object;
		var options: { limit: number };
		var callback: (err: Error, results: T[]) => any;
		
		if (arguments.length == 3) {
			query = arguments[0];
			options = arguments[1];
			callback = arguments[2];
		}
		else {
			query = arguments[0]; 
			callback = arguments[1];
		}
		
		connect((err, db) => {
			if (err) {
				callback(err, null);
			}
			else {
				var collection = db.collection(this.collectionName); 
				
				var find = collection.find(query);
				
				if (options && options.limit) {
					find = find.limit(options.limit);
				}
				
				find.toArray((err, results) => {
					db.close();
					callback(err, results);
				});
			}
		});
	}
	
	public insert(document: T, callback?: (err: Error, result: ICrudResult) => any): void {
		connect((err, db) => {
			if (err) {
				if (callback) {
					callback(err, null);
				}
			}
			else {
				document._id = document._id || genId();
				
				db.collection(this.collectionName).insert(document, (err, result) => {
					db.close();
					if (callback) {
						callback(err, result && result.result);
					}
				});
			}
		});
	}
	
	public update(query: Object, set: Object, callback?: (err: Error, result: IUpdateResult) => any): void {
		connect((err, db) => {
			if (err) {
				if (callback) {
					callback(err, null);
				}
			}
			else {
				db.collection(this.collectionName).update(query, set, (err, result) => {
					db.close();
					if (callback) {
						callback(err, result && result.result);
					}
				});
			}
		});
	}
	
	public remove(query: Object, callback?: (err: Error, result: ICrudResult) => any): void {
		connect((err, db) => {
			if (err) {
				if (callback) {
					callback(err, null);
				}
			}
			else {
				db.collection(this.collectionName).remove(query, (err, result) => {
					db.close();
					if (callback) {
						callback(err, result && result.result);
					}
				});
			}
		});
	}
}

import models = require('./models');

import bcrypt = require('bcrypt');

class UserCrud extends Crud<models.IUser> {
	
	protected collectionName = 'users';
	
	public generateHash(password: string): string {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
	}
	
	public matchesPassword(password: string, actualPasswordHash: string) {
		return bcrypt.compareSync(password, actualPasswordHash);
	}
}

export var users = new UserCrud();

class PropertyCrud extends Crud<models.IProperty> {
	
	protected collectionName = 'properties';
	
}

export var properties = new PropertyCrud();

import stringUtils = require('../utils/strings');

class SearchCrud extends Crud<models.ISearch> {
	
	protected collectionName = 'searches';
	
	public findOne(query: Object, callback: (err: Error, result: models.ISearch) => any): void {
		if (query && typeof query['title'] == 'string') {
			query['title'] = stringUtils.toTitleCase(query['title']);
		}
		
		super.findOne(query, callback);
	}
	
	public find(query: Object, callback: (err: Error, results: models.ISearch[]) => any): void;
	public find(query: Object, options: { limit: number }, callback: (err: Error, results: models.ISearch[]) => any): void;
	
	public find(): void {
		var query = arguments[0];
		
		if (query && typeof query['title'] == 'string') {
			query['title'] = stringUtils.toTitleCase(query['title']);
		}
		
		super.find.apply(this, arguments);
	}
	
	private strToInt(value: string | number): number {
		if (typeof value == 'string') {
			return parseInt(<string>value, 10);
		}
		else {
			return <number>value;
		}
	}
	
	private strToFloat(value: string | number): number {
		if (typeof value == 'string') {
			return parseFloat(<string>value);
		}
		else {
			return <number>value;
		}
	}
	
	public cleanse(search: models.ISearch): models.ISearch {
		if (typeof search.title == 'string') {
			search.title = stringUtils.toTitleCase(search.title);
		}
		
		if (search.min) {
			search.min.price = this.strToInt(search.min.price);
			search.min.bathrooms = this.strToInt(search.min.bathrooms);
			search.min.bedrooms = this.strToInt(search.min.bedrooms);
			search.min.distanceToTrain = this.strToFloat(search.min.distanceToTrain);
			search.min.distanceToTram = this.strToFloat(search.min.distanceToTram);
			search.min.parks = this.strToInt(search.min.parks);
			search.min.starRating = this.strToInt(search.min.starRating);
		}
		
		if (search.max) {
			search.max.price = this.strToInt(search.max.price);
			search.max.bedrooms = this.strToInt(search.max.bedrooms);
			search.max.distanceToTrain = this.strToFloat(search.max.distanceToTrain);
			search.max.distanceToTram = this.strToFloat(search.max.distanceToTram);
			search.max.starRating = this.strToInt(search.max.starRating);
		}
		
		return search;
	}
	
	public insert(search: models.ISearch, callback: (err: Error, result: ICrudResult) => any): void {
		if (search) {
			this.cleanse(search);
		}
		
		super.insert(search, callback);
	}
	
	public update(query: Object, set: models.ISearch, callback: (err: Error, result: IUpdateResult) => any): void {
		if (set) {
			this.cleanse(set);
		}
		
		super.update(query, set, callback);
	}
	
	public results(
		search: models.ISearch, 
		done: (err: Error, results?: models.IProperty[]) => any) {
		
		// Include properties {searchRadius} kilometres away from centres of search suburbs 
		var searchRadius = 5; 
		
		var query: any = {};
		
		if (search.listingType) {
			query['listingType'] = search.listingType;
		}
		
		var p: models.IProperty;
		
		// Features
		for (let name in search.has) {
			if (search.has[name]) {
				query.features = query.has || {};
				query.features[name] = true;
			}
		}
		
		// Min Features
		function addMinFeature(propertyName: string, amount: number) {
			if (amount) {
				query[propertyName] = { $gte: amount };
			}
		}
		
		addMinFeature('bedroomCount', search.min.bedrooms);
		addMinFeature('bathroomCount', search.min.bathrooms);
		addMinFeature('parkCount', search.min.parks);
		addMinFeature('distanceToTrain', search.min.distanceToTrain);
		addMinFeature('distanceToTram', search.min.distanceToTram);
		addMinFeature('price', search.min.price);
		addMinFeature('starRating', search.min.starRating);
		
		// Max Features
		function addMaxFeature(propertyName: string, amount: number) {
			if (amount) {
				query[propertyName] = { $lte: amount };
			}
		}
		
		addMaxFeature('bedroomCount', search.max.bedrooms);
		addMaxFeature('distanceToTrain', search.max.distanceToTrain);
		addMaxFeature('distanceToTram', search.max.distanceToTram);
		addMaxFeature('price', search.max.price);
		addMaxFeature('starRating', search.max.starRating);
		
		properties.find(query, (err: Error, properties: models.IProperty[]) => {						
			var propertiesWithinSearchRadius = <models.IProperty[]>[];
			
			for (var property of properties) {
				for (var searchSuburb of search.suburbs) {
					var distance = geoUtils.haversineDistance(searchSuburb.coord, property.address.coord);
					if (distance <= searchRadius) {
						propertiesWithinSearchRadius.push(property);
						break;
					}
				}
			}
			
			done(err, propertiesWithinSearchRadius);
		});
	}
	
}

export var searches = new SearchCrud();


export class AnyCrud extends Crud<any> {
	
	constructor(collectionName: string) {
		this.collectionName = collectionName;
		super();
	}
	
}


class SuburbCrud extends Crud<models.ISuburb> {
	
	protected collectionName = 'suburbs';
	
}

export var suburbs = new SuburbCrud();

