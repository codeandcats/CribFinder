/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../data/models.ts" />

'use strict';

import models = require('../../../data/models');
import resources = require('../services/resources');
import stringUtils = require('../../../utils/strings');

export interface ISearchStateParams {
	searchId: string;
}

export class SearchController {
	
	public static $inject = ['$stateParams', 'SearchApi', '$state', '$timeout'];
	
	constructor(
		public stateParams: ISearchStateParams,
		private searchApi: resources.ISearchResource,
		private state: angular.ui.IStateService,
		private timeout: angular.ITimeoutService) {
		
		// Get search from server
		this.current = searchApi.get({ id: stateParams.searchId });
	}
	
	public current: models.ISearch;
	
	public featuresText(): string {
		if (!this.current) {
			return '';
		}
		
		var descriptions = [];
		
		function addFeature(feature: { name: string; min?: number; max?: number }) {
			if (feature.min && feature.max) {
				descriptions.push(`Between ${feature.min} and ${feature.max} ${feature.name}`);
			}
			else if (feature.min) {
				descriptions.push(`At least ${feature.min} ${feature.name}`);
			}
			else if (feature.max) {
				descriptions.push(`At most ${feature.max} ${feature.name}`);
			}
		}
		
		addFeature({
			name: 'Bedrooms',
			min: this.current.min && this.current.min.bedrooms,
			max: this.current.max && this.current.max.bedrooms
		});
		
		addFeature({
			name: 'Bathrooms',
			min: this.current.min && this.current.min.bathrooms
		})
		
		addFeature({
			name: 'Parks',
			min: this.current.min && this.current.min.parks
		});
		
		var mustHaves = <models.PropertyFeature[]>[];
		var niceToHaves = <models.PropertyFeature[]>[];
		
		if (this.current.features) {
			for (let feature in models.PropertyFeature) {
				switch (this.current.features[stringUtils.toCamelCase(feature)]) {
					case models.SearchFeatureImportance.MustHave:
						mustHaves.push(feature);
						break;
						
					case models.SearchFeatureImportance.NiceToHave:
						niceToHaves.push(feature);
						break; 
				}
			}
		}
		
		var result = descriptions.join(', ');
		
		if (result) {
			result += '. ';
		}
		
		if (mustHaves.length) {
			result += 'Must haves: ' + mustHaves.join(', ') + '. ';
		}
		
		if (niceToHaves.length) {
			result += 'Nice to haves: ' + niceToHaves.join(', ') + '.';
		}
		
		result = result.trim();
		
		return result;
	}
	
	public priceText() {
		if (!this.current) {
			return '';
		}
		
		if (this.current.min && this.current.min.price) {
			
			if (this.current.max && this.current.max.price) {
				return `Between $${this.current.min.price} and $${this.current.max.price}`;
			}
			else {
				return `At least $${this.current.min.price}`;
			}
			
		}
		else if (this.current.max && this.current.max.price) {
			return `At most $${this.current.max.price}`;
		}
		else {
			return '';
		}
	}
	
	public edit(): void {
		this.state.go('searchedit', this.stateParams);
	}
}