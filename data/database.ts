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

export class Crud<T> {
	
	protected collectionName: string;
	
	public findOne(query: Object, callback: (err: Error, user: T) => any): void {
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
				db.collection(this.collectionName).insert(document, (err, result) => {
					db.close();
					if (callback) {
						callback(err, result && result.result);
					}
				});
			}
		});
	}
	
	public update(query: Object, set: Object, callback: (err: Error, result: any) => any): void {
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