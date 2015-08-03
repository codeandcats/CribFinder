/// <reference path="../../../typings/angularjs/angular.d.ts" />

import searchController = require('./search');
import models = require('../../../data/models');
import resources = require('../services/resources');

export class SearchEditController extends searchController.SearchController {
	
	constructor(
		stateParams: searchController.ISearchStateParams,
		searchApi: resources.ISearchResource) {
			
		super(stateParams, searchApi);
		
	}
	
}