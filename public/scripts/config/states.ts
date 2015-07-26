/// <reference path="../../../typings/angular-ui-router/angular-ui-router.d.ts" />

export class StateConfig {
	
	public static $inject = ['$stateProvider', '$urlRouterProvider']; 
	
	constructor(
		stateProvider: angular.ui.IStateProvider,
		urlRouterProvider: angular.ui.IUrlRouterProvider) {

		// For any unmatched url, route to /home
		urlRouterProvider.otherwise('/home');		

		stateProvider
			.state('home', {
				url: '/home',
				templateUrl: 'partials/home'
			})
			.state('search.results', {
				url: '/search/{searchTitle}/results',
				templateUrl: 'partials/search/results'
			});
	}
}