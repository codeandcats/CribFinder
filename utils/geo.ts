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

export function getCoord(address: string, callback: (err: Error, coord: models.ICoord) => any);
export function getCoord(address: models.IPropertyAddress, callback: (err: Error, coord: models.ICoord) => any);

export function getCoord(
	address: string | models.IPropertyAddress,
	done: (err: Error, latLong: any) => any)
{
	var addressText: string;
	
	if (typeof address == 'string') {
		addressText = <string>address;
	}
	else {
		addressText = getAddressText(<models.IPropertyAddress>address);
	}
	
	var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(addressText);
	
	function performLookup(retryCount: number) {
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
			
			if (!coord) {
				if (retryCount > 0) {
					setTimeout(() => {
						performLookup(retryCount - 1);
					},
					100);
				}
				else {
					err = new Error(`Failed to retrieve coords for: ${addressText}`);
					done(err, null);
				}
			}
			else {
				done(null, coord);
			} 
		});
	}
	
	performLookup(3);
}

export enum AddressTextFormat {
	Street = 0,
	Suburb = 1,
	State = 2,
	PostCode = 3,
	Country = 4
};

export function getAddressText(
	address: models.IPropertyAddress,
	format: AddressTextFormat = AddressTextFormat.PostCode): string {
	
	var result = '';
	
	var includeSuburb = format >= AddressTextFormat.Suburb, 
		includeState = format >= AddressTextFormat.State, 
		includePostCode = format >= AddressTextFormat.PostCode, 
		includeCountry = format >= AddressTextFormat.Country;
		
	if (address.unitNumber) {
		result = address.unitNumber + ', ';
	}
	
	result += `${address.streetNumber} ${address.streetName} ${address.streetType}`; 
	
	if (address.suburb && includeSuburb) {
		result += `, ${address.suburb}`;
	}
	
	if (address.state && includeState) {
		result += `, ${address.state}`; 
	}
	
	if (address.postCode && includePostCode) {
		if (!(address.state)) {
			result += ',';
		}
		result += ` ${address.postCode}`;
	}
	
	if (address.country && includeCountry) {
		result += `, ${address.country}`;
	}
	
	return result;
}
