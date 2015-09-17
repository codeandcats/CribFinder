import request = require('request');
import models = require('../data/models');
import printer = require('../utils/printer');

export enum NbnAvailability {
	Available = <any>'Available',
	Unavailable = <any>'Unavailable'
}

export function isAvailable(address: models.IPropertyAddress, callback: (err: Error, result: NbnAvailability) => any) {
	var options: request.Options = {
		uri: `http://www.nbnco.com.au/api/map/search.html?lat=${address.coord.lat}&lng=${address.coord.lng}&streetNumber=${address.streetNumber}&street=${address.streetName}%20${address.streetType}&suburb=${address.suburb}&postCode=${address.postCode}&state=${address.state}`,
		method: 'GET',
		headers: {
			Referer: 'http://www.nbnco.com.au/connect-home-or-business/check-your-address.html'
		}
	};
	
	request(options, (err, response, body) => {
		if (err) {
			callback(err, null);
			return;
		}
		
		var errored = false;
		var jsonResult;
		
		try {
			jsonResult = JSON.parse(body);
		}
		catch (err) {
			errored = true;
			callback(err, null);
		}
		
		if (!errored) {
			var result = NbnAvailability.Unavailable;
			
			if (jsonResult && jsonResult.servingArea && jsonResult.servingArea.serviceStatus == 'available') {
				result = NbnAvailability.Available;
			} 
						
			callback(err, result);
		}
	});
}