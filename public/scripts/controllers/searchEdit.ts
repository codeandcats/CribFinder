/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />

'use strict';

import searchController = require('./search');
import models = require('../../../data/models');
import resources = require('../services/resources');
import objectUtils = require('../../../utils/objects');
import stringUtils = require('../../../utils/strings');

interface IPropertyTypeListItem {
	text: string;
	type: models.PropertyType;
	ticked: boolean;
}

export class SearchEditController {
	
	public static $inject = ['$stateParams', 'SearchApi', '$state', '$window', '$http', '$scope'];
	
	constructor(
		public stateParams: searchController.ISearchStateParams,
		private searchApi: resources.ISearchResource,
		private state: angular.ui.IStateService,
		private window: Window,
		private http: angular.IHttpService,
		private scope: angular.IScope) {
		
		if (this.isNew()) {
            this.current = new searchApi();
            // Default values
            this.current.title = '';
			this.current.suburbs = [];
			this.current.propertyTypes = [];
            this.current.min = {};
            this.current.max = {};
            this.current.features = this.current.features || {};
            for (var feature in models.PropertyFeature) {
                var featureName = stringUtils.toCamelCase(feature);
                this.current.features[featureName] = models.SearchFeatureImportance.DontCare;
            }
			this.refreshPropertyTypes();
        }
        else {
			// Get search from server
			this.current = searchApi.get({ id: stateParams.searchId });
			this.current.$promise.then(() => {
				this.refreshPropertyTypes();
			});
		}
		
		this.scope.$watch('propertyTypes', () => {
			this.updatePropertyTypes();
		});
	}
	
	public current: resources.ISearch;
	
	public propertyTypes: IPropertyTypeListItem[] = [];
	
	private refreshPropertyTypes() {
		this.propertyTypes = [];
		for (var propertyType in models.PropertyType) {
			this.propertyTypes.push({
				text: propertyType,
				type: propertyType,
				ticked: this.current && this.current.propertyTypes && this.current.propertyTypes.indexOf(propertyType) > -1
			});
		}
	}
	
	private updatePropertyTypes(): void {
		var propertyTypes: models.PropertyType[] = [];
		for (var propertyType of this.propertyTypes) {
			if (propertyType.ticked) {
				propertyTypes.push(propertyType.type);
			}
		}
		this.current.propertyTypes = propertyTypes;
	}
	
    public isNew() {
        return this.stateParams.searchId == 'add';
    };
	
	public cancel(): void {
		if (this.isNew()) {
            this.state.go('home');
        }
        else {
			this.state.go('search', this.stateParams);
		}
	}
	
	public save(): void {
		//var searchCopy = objectUtils.clone(this.current);
		
		//searchCopy.propertyTypes = searchCopy.propertyTypes.map((pt: any) => pt.text);  
		//searchCopy.locations = searchCopy.locations.map((pt: any) => pt.text);
		
		//this.current.propertyTypes = this.current.propertyTypes.filter(()).map((pt: any) => pt.text);
		//search.su = search.locations.map((pt: any) => pt.text);
		
		this.updatePropertyTypes();
		
		if (this.current._id) {
			this.update();
		}
		else {
			this.insert();
		}
	}
	
	private insert(): void {
		var title = this.window.prompt('Name your search dawg') || '';
			
		if (!title.trim()) {
			return;
		}
		
		this.current.title = title;
		
		this.current.$save(
			() => this.state.go('search', this.stateParams),
			error => alert('Save failed\n\n' + error.message || error));
	}
	
	private update(): void {
		this.current.$update(
			() => this.state.go('search', this.stateParams),
			error => alert('Save failed\n\n' + error.message || error));
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
	
	public suggestSuburbs(prefix: string) {
		var result = this.http.get<models.ISuburb[]>('/api/suburbs/suggest/' + encodeURIComponent(prefix));
		
		return result;
	}
}