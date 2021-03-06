/// <reference path="../../../typings/angularjs/angular.d.ts" />
/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />

export class StateConfig {
	
	public static $inject = ['$stateProvider', '$urlRouterProvider']; 
	
	constructor(
		stateProvider: angular.ui.IStateProvider,
		urlRouterProvider: angular.ui.IUrlRouterProvider) {
		
		// For any unmatched url, route to /
		urlRouterProvider.otherwise('/');		
		
		stateProvider
			.state('home', {
				url: '/',
				templateUrl: '/templates/home',
				controller: 'Home',
				controllerAs: 'home'
			})
			.state('searchnew', {
				url: '/search/add',
				templateUrl: '/templates/searchEdit',
				controller: 'SearchEdit',
				controllerAs: 'search',
				params: {
					searchId: 'add'
				}
			})
			.state('search', {
				url: '/search/:searchId',
				templateUrl: '/templates/search',
				controller: 'Search',
				controllerAs: 'search'
			})
			.state('searchedit', {
				url: '/search/:searchId/edit',
				templateUrl: '/templates/searchEdit',
				controller: 'SearchEdit',
				controllerAs: 'search'
			});
	}
}