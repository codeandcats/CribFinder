'use strict';

/// <reference path="../../../typings/angularjs/angular.d.ts" />

import stringUtils = require('../../../utils/strings');
import models = require('../../../data/models');

interface IMainScope {
	utils: {
		strings: any;	
	},
	models: any;
}

export class MainController {
	
	public static $inject = ['$scope'];
	
	constructor($scope: IMainScope) {
		$scope.utils = {
			strings: stringUtils
		};
		
		$scope.models = models;
	}
	
}