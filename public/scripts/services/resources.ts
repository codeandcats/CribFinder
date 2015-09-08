'use strict';

/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angularjs/angular-resource.d.ts" />

import models = require('../../../data/models');

export interface ISearch extends models.ISearch, angular.resource.IResource<ISearch> {
	$update(success: () => any, failed: (error: Error) => any);
}

export interface IProperty extends models.IProperty, angular.resource.IResource<IProperty> {
}

export interface IPropertyResource extends angular.resource.IResourceClass<IProperty> {
}

export function PropertyResource($resource: angular.resource.IResourceService): IPropertyResource {
	return <IPropertyResource>$resource(
		'/api/property/:id', 
		{
			id: '@_id'
		});
}

PropertyResource.$inject = ['$resource'];



export interface ISearchResource extends angular.resource.IResourceClass<ISearch> {
	list(): ISearch[];
	update(search: models.ISearch) : ISearchResource;
	results(search: models.ISearch, callback: (err: Error, properties: IProperty[]) => any): void;
	//listings(search: models.ISearch): IProperty[];
}

export function SearchResource(
	$resource: angular.resource.IResourceService,
	$http: angular.IHttpService,
	$q: angular.IQService,
	properties: IPropertyResource): ISearchResource {
		
	// Return the resource, include your custom actions
	var resource = <ISearchResource>$resource(
		'/api/searches/:id',
		{
			id: '@_id'
		},
		{
			list: {
				method: 'GET',
				isArray: true
			},
			update: {
				method: 'PUT',
				isArray: false
			}/*,
			listings: {
				method: 'GET',
				isArray: true,
				url: '/api/searches/:id/results',
				params: {
					id: '@_id'
				}
			}*/
		});
		
	resource.results = (search, callback) => {
		
		$http.get(`/api/searches/${search._id}/results`).then(response => {
			var results: IProperty[] = [];
			
			for (var property of <models.IProperty[]>response.data) {
				results.push(new properties(property));
			}
			
			callback(null, results);
		}).catch(reason => {
			callback(new Error(reason), null);
		});
	};
	
	return resource;
}

SearchResource.$inject = ['$resource', '$http', '$q', 'PropertyApi'];



export interface IUser extends models.IUser, angular.resource.IResource<IUser> {		
}

export interface IUserResource extends angular.resource.IResourceClass<IUser> {
	active(): IUser;
}

export function UserResource($resource: angular.resource.IResourceService): IUserResource {
	return <IUserResource>$resource('/api/users/', {}, {
		active: <angular.resource.IActionDescriptor>{
			method: 'GET',
			url: '/api/users/active',
			isArray: false
		}
	});
}

UserResource.$inject = ['$resource'];

