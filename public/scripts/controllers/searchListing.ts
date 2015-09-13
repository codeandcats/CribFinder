/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />
/// <reference path="../../../data/models.ts" />

'use strict';

import models = require('../../../data/models');
import searchController = require('./search');
import resources = require('../services/resources');
import stringUtils = require('../../../utils/strings');

export class SearchListingController {
	
	public static $inject = ['$stateParams', 'SearchApi', '$timeout', '$window'];
	
	public search: resources.ISearch;
	public niceToHaves: models.PropertyFeature[];
	public results: resources.IProperty[];
	
	constructor(
		public stateParams: searchController.ISearchStateParams,
		private searchApi: resources.ISearchResource,
		private $timeout: Function,
		private $window: Window) {
		
		// Get search from server
		this.search = searchApi.get({ id: stateParams.searchId });
		
		this.search.$promise.then(() => {
			this.niceToHaves = this.getNiceToHaves();
			
			this.showResults()
		});
	}
	
	private getNiceToHaves() {
		var result: models.PropertyFeature[] = [];
		for (var feature in this.search.features) {
			if (this.search.features[feature] == models.SearchFeatureImportance.NiceToHave) {
				result.push(feature);
			}
		}
		return result;
	}
	
	public showResults(): void {
		if (this.search && this.search.$resolved) {
			this.searchApi.results(this.search, (err, results) => {
				this.$timeout(() => {
					this.results = results;
				});
			});
		}
	}
	
	public getPropertyFeatures(property: models.IProperty) {
		var result: { name: models.PropertyFeature, value: boolean }[] = [];
		
		for (var feature in this.niceToHaves) {
			result.push({
				name: feature,
				value: !!property.features[feature]
			});
		}
		
		return result;
	}
}
