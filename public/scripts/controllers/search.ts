/// <reference path="../../../typings/angularjs/angular.d.ts" />

import models = require('../../../data/models');
import resources = require('../services/resources');

export interface ISearchStateParams {
	searchId: string;
}

export enum EditMode {
	Read,
	New,
	Edit
}

export class SearchController {
	
	public static $inject = ['$stateParams', 'SearchApi'];
	
	constructor(
		public stateParams: ISearchStateParams,
		private searchApi: resources.ISearchResource) {
		
		// Get search from server
		searchApi
			.get({ id: stateParams.searchId })
			.$promise.then((search: models.ISearch) => {
				this.current = search;
			});
	}
	
	public current: models.ISearch;
	
	public editMode = EditMode.Read;
	
}