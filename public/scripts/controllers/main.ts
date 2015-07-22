export interface IMainScope {
}

export class MainController {
	public static $inject = ['$scope'];
	
	constructor(public scope: IMainScope) {
	}
}