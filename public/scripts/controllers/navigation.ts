/// <reference path="../../../typings/angularjs/angular.d.ts" />

'use strict';

import models = require('../../../data/models');
import resources = require('../services/resources');
import eventsModule = require('../services/events');

export class NavigationController {
	public static $inject = ['$scope', 'SearchApi', 'UserApi', 'Events']; 
	
	constructor(
		private scope: angular.IScope,
		private searchApi: resources.ISearchResource,
		private userApi: resources.IUserResource,
		private events: eventsModule.Events) {
		
		//alert('about to request stuff');
		
		var refreshSearches = () => {
			this.searches = this.searchApi.list();
		};
		
		this.productName = 'Crib Finder';
		this.searches = searchApi.list();
		this.user = userApi.active();
		
		this.subscriptionId = eventsModule.generateSubscriptionId();
		
		this.scope.$on('$destroy', this.destructor);
		
		this.events.searches.whenAnyChanges.then(
			this.subscriptionId,
			refreshSearches);
		
		//alert('done requesting stuff');
	}
	
	private destructor() {
		this.events.searches.whenAnyChanges.unsubscribe(this.subscriptionId);
	}
	
	private subscriptionId: string;
	
	public productName: string;
	public searches: models.ISearch[];
	public user: models.IUser;
}