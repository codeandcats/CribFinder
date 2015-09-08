/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />

'use strict';

import searchController = require('./search');
import models = require('../../../data/models');
import resources = require('../services/resources');
import objectUtils = require('../../../utils/objects');
import stringUtils = require('../../../utils/strings');

export class SearchEditController {
	
	public static $inject = ['$stateParams', 'SearchApi', '$state'];
	
	public models;
	
	constructor(
		public stateParams: searchController.ISearchStateParams,
		private searchApi: resources.ISearchResource,
		private state: angular.ui.IStateService) {
		
		// Get search from server
		this.current = searchApi.get({ id: stateParams.searchId });
		
		this.models = models;
	}
	
	public current: resources.ISearch;
	
	public cancel(): void {
		this.state.go('search', this.stateParams);
	}
	
	public save(): void {
		//var searchCopy = objectUtils.clone(this.current);
		
		//searchCopy.propertyTypes = searchCopy.propertyTypes.map((pt: any) => pt.text);  
		//searchCopy.locations = searchCopy.locations.map((pt: any) => pt.text);
		
		var search = this.current;
		
		search.propertyTypes = search.propertyTypes.map((pt: any) => pt.text);
		//search.su = search.locations.map((pt: any) => pt.text);
		
		if (search._id) {
			search.$update(
				() => this.state.go('search', this.stateParams),
				error => alert('Save failed\n\n' + error.message || error));
		}
		else {
			search.$save(
				() => this.state.go('search', this.stateParams),
				error => alert('Save failed\n\n' + error.message || error));
		}
	}
	
	public delete(): void {
		if (!confirm('Hey, are you sure you want to delete this search?')) {
			return;
		}
		
		if (!confirm('You sure? Theres no turning back!')) {
			return;
		}
		
		this.current.$delete(() => {
			this.state.go('home');
			
			alert('Search deleted')
		},
		(error) => {
			alert('Nope! Because errors: ' + (error.message || error));
		});
	}
	
	public featureMatchesImportance(
		feature: models.PropertyFeature,
		importance: models.SearchFeatureImportance) {
		
		if (!this.current || !this.current.features) {
			return false;
		}
		
		var featureName = stringUtils.toCamelCase(feature.toString()); 
		
		var value = this.current.features[featureName];
		
		if (value == undefined) {
			return (importance == models.SearchFeatureImportance.DontCare);
		}
		
		return (value == importance); 
	}
	
	public setFeatureImportance(
		feature: models.PropertyFeature,
		importance: models.SearchFeatureImportance) {
		
		if (!this.current || !this.current.features) {
			return;
		}
		
		var featureName = stringUtils.toCamelCase(feature.toString()); 
		
		this.current.features[featureName] = importance;
	}
}