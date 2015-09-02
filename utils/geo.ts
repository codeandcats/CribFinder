import request = require('request');
import printer = require('printer');
import models = require('../data/models');

export function haversineDistance(
	coords1: models.ICoord,
	coords2: models.ICoord) {
	
	function toRad(x: number): number {
		return x * Math.PI / 180;
	}
	
	var lon1 = coords1.lng;
	var lat1 = coords1.lat;
	
	var lon2 = coords2.lng;
	var lat2 = coords2.lat;
	
	var R = 6371; // km
	
	var x1 = lat2 - lat1;
	var dLat = toRad(x1);
	var x2 = lon2 - lon1;
	var dLon = toRad(x2)
	var a = 
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	
	return d;
}

export function getLatLong(
	address: string,
	done: (err: Error, latLong: any) => any)
{
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(address);
	
	request(url, (err, res, body) => {
		if (err) {
			done(err, null);
			return;
		}
		
		var json = JSON.parse(body);
		
		var coord = json &&
					json.results &&
					json.results[0] &&
					json.results[0].geometry &&
					json.results[0].geometry.location;  
		
		done(null, coord); 
	});
}

