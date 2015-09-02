/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../data/models.ts" />

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
			min: this.current.min.bedrooms,
			max: this.current.max.bedrooms
		});
		
		addFeature({
			name: 'Bathrooms',
			min: this.current.min.bathrooms
		})
		
		addFeature({
			name: 'Parks',
			min: this.current.min.parks
		});
		
		for (let feature in models.PropertyFeature) {
			if (this.current.has[stringUtils.toCamelCase(feature)]) {
				result.push(feature);
			}
		}
		
		return result.join(', ');
	}
	
	public priceText() {
		if (!this.current) {
			return '';
		}
		
		if (this.current.min.price) {
			
			if (this.current.max.price) {
				return `Between $${this.current.min.price} and $${this.current.max.price}`;
			}
			else {
				return `At least $${this.current.min.price}`;
			}
			
		}
		else if (this.current.max.price) {
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