/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />
/// <reference path="../../../data/models.ts" />

import models = require('../../../data/models');
import searchController = require('./search');
import resources = require('../services/resources');
import stringUtils = require('../../../utils/strings');

export class SearchListingController {
	
	public static $inject = ['$stateParams', 'SearchApi', '$timeout', '$window'];
	
	public search: resources.ISearch;
	public results: resources.IProperty[];
	
	constructor(
		public stateParams: searchController.ISearchStateParams,
		private searchApi: resources.ISearchResource,
		private $timeout: Function,
		private $window) {
		
		// Get search from server
		this.search = searchApi.get({ id: stateParams.searchId });
	}
	
	public showResults(): void {
		if (this.search && this.search.$resolved) {
			//this.results = this.searchApi.listings(this.search);
			
			this.results = this.search.$listings();
			
			this.$timeout(() => this.$window.alert('Listings returned?'), 2000);
		}
	}
}
