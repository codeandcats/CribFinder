/// <reference path="models.ts" />

'use strict';

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
	
	public find(query: Object, callback: (err: Error, results: T[]) => any): void {
		connect((err, db) => {
			if (err) {
				callback(err, null);
			}
			else {
				db.collection(this.collectionName).find(query).toArray((err, results) => {
					db.close();
					callback(err, results);
				});
			}
		});
	}
	
	public insert(document: T, callback: (err: Error, result: ICrudResult) => any): void {
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
	
	public update(query: Object, set: Object, callback: (err: Error, result: IUpdateResult) => any): void {
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
	
	public remove(query: Object, callback: (err: Error, result: ICrudResult) => any): void {
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
	
	public find(query: Object, callback: (err: Error, results: models.ISearch[]) => any): void {
		if (query && typeof query['title'] == 'string') {
			query['title'] = stringUtils.toTitleCase(query['title']);
		}
		
		super.find(query, callback);
	}
	
	public insert(document: models.ISearch, callback: (err: Error, result: ICrudResult) => any): void {
		if (document && typeof document.title == 'string') {
			document.title = stringUtils.toTitleCase(document.title);
		}
		
		super.insert(document, callback);
	}
	
	public update(query: Object, set: Object, callback: (err: Error, result: IUpdateResult) => any): void {
		if (set && typeof set['title'] == 'string') {
			set['title'] = stringUtils.toTitleCase(set['title']);
		}
		
		super.update(query, set, callback);
	}
	
}

export var searches = new SearchCrud();

export class AnyCrud extends Crud<any> {
	
	constructor(collectionName: string) {
		this.collectionName = collectionName;
		super();
	}
	
}

