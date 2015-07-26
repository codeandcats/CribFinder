import angular = require('angular');
import mainController = require('./controllers/main');
import navigationController = require('./controllers/navigation');
import resources = require('./services/resources');

angular
	.module('cribFinder', ['ngResource', 'ui.router'])
	.controller('main', mainController.MainController)
	.controller('navigation', navigationController.NavigationController)
	.service('users', resources.UserResource)
	.service('searches', resources.SearchResource);