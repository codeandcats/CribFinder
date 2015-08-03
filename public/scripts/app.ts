/// <reference path="../../typings/angularjs/angular.d.ts" />

import navigationController = require('./controllers/navigation');
import homeController = require('./controllers/home');
import searchController = require('./controllers/search');
import searchEditController = require('./controllers/searchEdit');

import resources = require('./services/resources');
import states = require('./config/states');

angular
	.module('cribFinder', ['ngResource', 'ui.router', 'ngTagsInput'])
	
	.controller('Navigation', navigationController.NavigationController)
	.controller('Home', homeController.HomeController)
	.controller('Search', searchController.SearchController)
	.controller('SearchEdit', searchEditController.SearchEditController)
	
	.factory('UserApi', resources.UserResource)
	.factory('SearchApi', resources.SearchResource)
	
	.config(states.StateConfig)
	
	.run(['$rootScope', '$state', '$stateParams',
		($rootScope, $state, $stateParams) => {
			// It's very handy to add references to $state and $stateParams to the $rootScope
			// so that you can access them from any scope within your applications. For example,
			// <li ng-class="{ active: $state.includes('contacts.list') }"> will set the <li>
			// to active whenever 'contacts.list' or one of its decendents is active.
			$rootScope.$state = $state;
			$rootScope.$stateParams = $stateParams;
		}
	]);