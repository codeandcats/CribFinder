/// <reference path="../../../typings/angularjs/angular.d.ts" />

'use strict';

import models = require('../../../data/models');
import resources = require('../services/resources');

export class NavigationController {
	public static $inject = ['SearchApi', 'UserApi'];
	
	constructor(
		private searchApi: resources.ISearchResource,
		private userApi: resources.IUserResource) {
		
		this.productName = 'Crib Finder';
		this.searches = searchApi.list();
		this.user = userApi.active();
	}
	
	public productName: string;
	public searches: models.ISearch[];
	public user: models.IUser;
}