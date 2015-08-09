/// <reference path="../../../typings/angularjs/angular.d.ts" />

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
		searchApi
			.get({ id: stateParams.searchId })
			.$promise.then((search: models.ISearch) => {
				timeout(() => {
					this.current = search;
				});
			});
	}
	
	public current: models.ISearch;
	
	public featuresText(): string {
		if (!this.current) {
			return '';
		}
		
		var result = [];
		
		function addFeature(feature: { name: string; min?: number; max?: number }) {
			if (feature.min && feature.max) {
				result.push(`Between ${feature.min} and ${feature.max} ${feature.name}`);
			}
			else if (feature.min) {
				result.push(`At least ${feature.min} ${feature.name}`);
			}
			else if (feature.max) {
				result.push(`At most ${feature.max} ${feature.name}`);
			}
		}
		
		addFeature({
			name: 'Bedrooms',
			min: this.current.minFeatures.bedrooms,
			max: this.current.maxFeatures.bedrooms
		});
		
		addFeature({
			name: 'Bathrooms',
			min: this.current.minFeatures.bathrooms
		})
		
		addFeature({
			name: 'Parks',
			min: this.current.minFeatures.parks
		});
		
		for (let feature in models.PropertyFeature) {
			if (this.current.features[stringUtils.toCamelCase(feature)]) {
				result.push(feature);
			}
		}
		
		return result.join(', ');
	}
	
	public priceText() {
		if (!this.current) {
			return '';
		}
		
		if (this.current.minFeatures.price) {
			
			if (this.current.maxFeatures.price) {
				return `Between $${this.current.minFeatures.price} and $${this.current.maxFeatures.price}`;
			}
			else {
				return `At least $${this.current.minFeatures.price}`;
			}
			
		}
		else if (this.current.maxFeatures.price) {
			return `At most $${this.current.maxFeatures.price}`;
		}
		else {
			return '';
		}
	}
	
	public edit(): void {
		this.state.go('searchedit', this.stateParams);
	}
}