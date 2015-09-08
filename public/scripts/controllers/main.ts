'use strict';

/// <reference path="../../../typings/angularjs/angular.d.ts" />

import models = require('../../../data/models');
import stringUtils = require('../../../utils/geo');
import geoUtils = require('../../../utils/geo');

interface IMainScope extends angular.IScope {
	utils: {
		strings: any;
		geo: any;
	},
	models: any;
}

export class MainController {
	
	public static $inject = ['$scope'];
	
	constructor($scope: IMainScope) {
		$scope.utils = {
			strings: stringUtils,
			geo: geoUtils
		};
		$scope.models = models; 
	}
	
}