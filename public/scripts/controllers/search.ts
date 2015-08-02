/// <reference path="../../../typings/angularjs/angular.d.ts" />

import models = require('../../../data/models');
import resources = require('../services/resources');

export interface ISearchStateParams {
	searchId: string;
}

export interface ISearchScope extends angular.IScope {
	search: models.ISearch;
}

export class SearchController {
	
	public static $inject = ['$scope', '$stateParams', 'searches'];
	
	constructor(
		public scope: ISearchScope,
		public stateParams: ISearchStateParams,
		private searches: resources.ISearchResource) {
		
		// Get search from server
		searches
			.get({ id: stateParams.searchId })
			.$promise.then((search: models.ISearch) => {
				this.scope.search = search;
			});
	}
	
}