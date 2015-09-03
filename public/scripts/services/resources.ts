/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angularjs/angular-resource.d.ts" />

import models = require('../../../data/models');

export interface ISearch extends models.ISearch, angular.resource.IResource<ISearch> {
	$listings(): IProperty[];
}

export interface IProperty extends models.IProperty, angular.resource.IResource<IProperty> {
}

export interface ISearchResource extends angular.resource.IResourceClass<ISearch> {
	list(): ISearch[];
	update(search: models.ISearch) : ISearchResource;
	listings(search: models.ISearch): IProperty[];
}

export function SearchResource($resource: angular.resource.IResourceService): ISearchResource {
	// Return the resource, include your custom actions
	return <ISearchResource>$resource(
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
			},
			listings: {
				method: 'GET',
				isArray: true,
				url: '/api/searches/:id/results',
				params: {
					id: '@_id'
				}
			}
		});
}

SearchResource.$inject = ['$resource'];



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

