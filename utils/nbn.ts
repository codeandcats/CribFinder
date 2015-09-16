import request = require('request');
import models = require('../data/models');
import printer = require('../utils/printer');

export function isAvailable(address: models.IPropertyAddress, callback: (err: Error, result: any) => any) {
	
	// http://www.nbnco.com.au/api/map/search.html?lat=-27.432232&lng=153.05397700000003&streetNumber=8&street=bale%20street&suburb=ascot&postCode=4007&state=qld
	
	var options: request.Options = {
		uri: `http://www.nbnco.com.au/api/map/search.html?lat=${address.coord.lat}&lng=${address.coord.lng}&streetNumber=${address.streetNumber}&street=${address.streetName}%20${address.streetType}&suburb=${address.suburb}&postCode=${address.postCode}&state=${address.state}`,
		headers: {
			Referer: 'http://www.nbnco.com.au/connect-home-or-business/check-your-address.html',
			Host: 'http://www.nbnco.com.au'
		}
	};
	
	printer.logValue('request options', options);
	
	request(options, (err, response, body) => {
		var jsonResult = JSON.parse(body);
		callback(err, jsonResult);
	});
}
