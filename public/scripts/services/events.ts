import eventing = require('../../../utils/eventing');
import models = require('../../../data/models');

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSubscriptionId(name?: string): string {
	if (name == undefined) {
		name = '';
	}
	else {
		name += '-';
	}
	
	name += getRandomInt(1, 100000000);
	
	return name;
}

export interface ISearchEventArgs {
	search: models.ISearch;
}

export interface ISearchEvents {
	whenInserted: eventing.Eventable<ISearchEventArgs>;
	whenUpdated: eventing.Eventable<ISearchEventArgs>;
	whenDeleted: eventing.Eventable<ISearchEventArgs>;
	whenAnyChanges: eventing.Eventable<ISearchEventArgs>;
}

export class Events
{
	constructor() {
		this.searches = {
			whenInserted: new eventing.Eventable<ISearchEventArgs>(),
			whenUpdated: new eventing.Eventable<ISearchEventArgs>(),
			whenDeleted: new eventing.Eventable<ISearchEventArgs>(),
			whenAnyChanges: new eventing.Eventable<ISearchEventArgs>()
		};
		
		var searchChanged = (data: ISearchEventArgs) => {
			this.searches.whenAnyChanges.invoke(data);
		};
		
		this.searches.whenInserted.then(searchChanged);
		this.searches.whenUpdated.then(searchChanged);
		this.searches.whenDeleted.then(searchChanged);
	}
	
	public searches: ISearchEvents;
}