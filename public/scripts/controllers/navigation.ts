'use strict';

import angular = require('angular');
import models = require('../../../data/models');
import resources = require('../services/resources');

export interface INavigationScope extends angular.IScope {
	productName: string;
	searches: models.ISearch[];
	user: models.IUser;
}

export class NavigationController {
	public static $inject = ['$scope', 'searches', 'users'];
	
	constructor(
		public scope: INavigationScope,
		private searches: resources.ISearchResource,
		private users: resources.IUserResource) {
		
		this.scope.productName = 'Crib Finder 2k';
		this.scope.searches = [];
		this.scope.user = null;
		
		searches.get((results: resources.ISearch[]) => {
			this.scope.searches = [];
			for (var search of results) {
				this.scope.searches.push(search);
			}
		});
		
		users.active().$promise.then(user => {
			this.scope.user = user;
		});
	}
}