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
	
	private getFeaturesMatchingImportance(importance: models.SearchFeatureImportance): models.PropertyFeature[] {
		var result: models.PropertyFeature[] = [];
		
		if (!this.current || !this.current.features) {
			return [];
		}
		
		for (var feature in models.PropertyFeature) {
			if (this.current.features[stringUtils.toCamelCase(feature)] == importance) {
				result.push(feature);
			}
		}
		
		return result;
	}
	
	public niceToHavesText(): string {
		var features = this.getFeaturesMatchingImportance(models.SearchFeatureImportance.NiceToHave);
		return features.join(', ');
	}
	
	public mustHavesText(): string {
		
		var features: string[] = [];
		
		function addFeature(feature: { name: string; min?: number; max?: number }) {
			if (feature.min && feature.max) {
				features.push(`Between ${feature.min} and ${feature.max} ${feature.name}`);
			}
			else if (feature.min) {
				features.push(`At least ${feature.min} ${feature.name}`);
			}
			else if (feature.max) {
				features.push(`At most ${feature.max} ${feature.name}`);
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
		
		features = features.concat(this.getFeaturesMatchingImportance(models.SearchFeatureImportance.MustHave).map(f => stringUtils.toTitleCase(f.toString())));
		
		return features.join(', ');
	}
	
	public suburbsText() {
		if (!this.current || !this.current.suburbs) {
			return '';
		}
		
		return this.current.suburbs.map(s => `${s.name}, ${s.state} ${s.postCode}`).join('; ');
	}
	
	public priceText() {
		if (!this.current) {
			return '';
		}
		
		var suffix = (this.current.listingType == models.ListingType.Rental) ? ' per week' : '';
		
		if (this.current.min && this.current.min.price) {
			
			if (this.current.max && this.current.max.price) {
				return `Between $${this.current.min.price} and $${this.current.max.price}${suffix}`;
			}
			else {
				return `At least $${this.current.min.price}${suffix}`;
			}
			
		}
		else if (this.current.max && this.current.max.price) {
			return `At most $${this.current.max.price}${suffix}`;
		}
		else {
			return '';
		}
	}
	
	public edit(): void {
		this.state.go('searchedit', this.stateParams);
	}
}