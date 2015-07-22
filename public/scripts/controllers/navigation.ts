import models = require('../../../data/models');

export interface INavigationScope {
	productName: string;
	searches: models.ISearch[];
}

export class NavigationController {
	public static $inject = ['$scope'];
	
	constructor(public scope: INavigationScope) {
		this.scope.productName = 'Crib Finder';
		this.scope.searches = [];
	}
}