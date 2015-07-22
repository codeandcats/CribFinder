import angular = require('angular');
import mainController = require('./controllers/main');
import navigationController = require('./controllers/navigation');

angular
	.module('cribFinder', [])
	.controller('main', mainController.MainController)
	.controller('navigation', navigationController.NavigationController);
