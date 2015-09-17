/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../data/models.ts" />
/// <reference path="./property.ts" />
/// <reference path="./strings.ts" />
/// <reference path="./printer.ts" />

import request = require('request');
import cheerio = require('cheerio');
import models = require('../data/models');
import stringUtils = require('./strings');
import propertyUtils = require('./property');
import geoUtils = require('./geo');
import nbnUtils = require('./nbn');
import db = require('../data/database');
import printer = require('./printer');

export interface ISuburbSuggestion extends models.ISuburb {
	relevance: number;
}

export function getLocationSuggestions(prefix: string, done: (err: Error, results: ISuburbSuggestion[]) => any) {
	if (!prefix) {
		done(null, []);
		return;
	}
	
	var url = 'http://www.realestate.com.au/suggestwhere.ds?query=' + encodeURIComponent(prefix);
	
	request(url, (err, res, json) => {
		if (err) {
			done(err, null);
		}
		else {
			var suggestions = JSON.parse(json);
			
			var responseResults: ISuburbSuggestion[] = suggestions.map(suggestion => {
				var [suburb, state] = suggestion.key.split(',').map(s => s.trim());
				var postCode: string | number = '';
				
				var index = state.lastIndexOf(' ');
				if (index) {
					postCode = parseInt(state.substring(index + 1));
					if (isNaN(<number>postCode)) {
						postCode = '';
					}
					else {
						state = state.substring(0, index);
					}
				}
				
				return {
					name: suburb,
					state: state.toUpperCase(),
					postCode: postCode,
					relevance: suggestion.value
				};
			});
			
			//printer.logValue('lookup results', responseResults);
			
			db.connect((err, db) => {
				
				if (err) {
					done(err, null);
				}
				else {
					var collection = db.collection('suburbs'); 
					
					var query = {
						name: { $regex: new RegExp('^' + prefix, 'i') }
					};
					
					collection.find(query).toArray((err: Error, databaseResults: models.ISuburb[]) => {
						db.close();
						
						//printer.logValue('db results', databaseResults.map(r => r.name + ', ' + r.state));					
						
						var results: ISuburbSuggestion[] = [];
						
						for (var responseResult of responseResults) {
							for (var databaseResult of databaseResults) {
								if (databaseResult.name.toUpperCase() == responseResult.name.toUpperCase() &&
									databaseResult.postCode == responseResult.postCode &&
									databaseResult.state.toUpperCase() == responseResult.state.toUpperCase()) {
									
									var result: ISuburbSuggestion = <any>databaseResult;
									result.relevance = responseResult.relevance;
									
									results.push(result);
								}
							}							
						}
						
						done(null, results);
					});
				}
			});
		}
	});
}

export function getIdFromUrl(url: string): string {
	var result = '';
	
	var regex = /.*?(\d{3,})/;
	
	var match = regex.exec(url);
	
	result = match[1];
	
	return result;
}

export function getSearchUrl(search: models.ISearch, options?: { page?: number }): string {
	options = options || {};
	options.page = options.page || 0;
	
	// http://www.realestate.com.au/rent/property-unit+apartment-with-2-bedrooms-between-0-600-in-melbourne+city+-+greater+region%2c+vic/list-1?numParkingSpaces=2&maxBeds=any&source=location-search
	var url = 'http://www.realestate.com.au/rent/';
	
	var hasAddedToUrl = false;
	var hasAddedQueryParam = false;
	
	function addToUrl(criteria: string) {
		if (!criteria) {
			return;
		}
		if (hasAddedToUrl) {
			url += '-';
		}
		else {
			hasAddedToUrl = true;
		}
		url += criteria.toLowerCase();
	}
	
	function addQueryParam(param: string) {
		if (!param) {
			return;
		}
		if (!hasAddedQueryParam) {
			url += '?';
			hasAddedQueryParam = true;
		}
		else {
			url += '&';
		}
		url += param;
	}
	
	function encode(value: string) {
		// Replace spaces with '+'
		return encodeURIComponent(value).replace(/%20/gi, '+');
	}
	
	if (search.propertyTypes && search.propertyTypes.length) {
		
		let criteria = 
			'property-' + search
			.propertyTypes.map(pt => pt.toString().toLowerCase())
			.join('-');
		
		if (search.propertyTypes.indexOf(models.PropertyType.Unit) > -1 && 
			search.propertyTypes.indexOf(models.PropertyType.Apartment) > -1) {
			criteria += '-unit+apartment';
		}
		
		addToUrl(criteria);
	}
	
	if (search.min.bedrooms) {
		addToUrl('with-' + search.min.bedrooms + '-bedroom' + (search.min.bedrooms > 1 ? 's': ''));
	}
	
	if (search.min.price || search.max.price) {
		addToUrl('between-' + (search.min.price || 0) + '-' + (search.max.price || 'any'));
	}
	
	if (search.suburbs && search.suburbs.length) {
		for (var suburb of search.suburbs) {
			addToUrl('in-' + encode(suburb.name + ', ' + suburb.state + ' ' + suburb.postCode)); 
		}
	}
	
	url += '/list-' + (options.page + 1);

	if (search.max.bedrooms) {
		addQueryParam('maxBeds=' + search.max.bedrooms);
	}
	
	if (search.min.parks) {
		addQueryParam('numParkingSpaces=' + search.min.parks);
	}
	
	if (search.min.bathrooms) {
		addQueryParam('numBaths=' + search.min.bathrooms);
	}
	
	return url;
}

export interface ISearchResultsScrapeOptions {
	url: string;
}

export function scrapeRentalSearchResults(
	options: ISearchResultsScrapeOptions, 
	callback: (err: Error, results: models.IPropertySearchResult[]) => any) {
	
	var url = (options && options.url) || options;
	
	request(url, function(err, res, html) {
		if (err) {
			callback(err, null);
			return;
		}
		
		var $ = cheerio.load(html);
		
		var links = $('article.resultBody div.listingInfo a[rel="listingName"]');

		var results: models.IPropertySearchResult[] = [];
		
		links.each(function(i, link) {
			
			var result: models.IPropertySearchResult = {
				id: '', 
				vendor: models.Vendor.RealEstate,
				vendorId: '',
				url: 'http://realestate.com.au' + link.attribs['href']
			};
			
			result.vendorId = getIdFromUrl(result.url);
			
			results.push(result);
		});
		
		callback(null, results);
	});
};

export function getStreetInfo(street: string): models.IStreetInfo {
	var parts = street.split(/\s+/);
	
	var numbers: string[] = [];
	
	var numberRegEx = /.*?\d+.*/;
	
	var lastNumberIndex = -1;
	
	for (var index = 0; index < parts.length; index++) {
		if (numberRegEx.test(parts[index])) {
			numbers.push(parts[index]);
			lastNumberIndex = index;
		}
	}
	
	if (numbers.length == 1) {
		var unitAndStreetNumbers = numbers[0].split('/');
		if (unitAndStreetNumbers.length == 2) {
			numbers = unitAndStreetNumbers;
		}
	}
	
	var unitNumber = undefined;
	var streetNumber = undefined;
	
	if (lastNumberIndex > -1) {
		unitNumber = numbers.length > 1 ? numbers[0] : undefined;
		streetNumber = numbers.length > 1 ? numbers[1] : numbers[0];
		parts.splice(0, lastNumberIndex + 1);
	}
	
	var streetType = parts[parts.length - 1];
	parts.splice(parts.length - 1);
	
	var streetName = parts.join(' ') || '';
	
	if (streetName.toLowerCase() == 'the') {
		streetName += ' ' + streetType;
		streetType = '';
	}
	
	var info: models.IStreetInfo = {
		streetNumber: streetNumber,
		streetName: streetName,
		streetType: streetType
	};
	
	if (unitNumber != undefined) {
		info.unitNumber = unitNumber;
	}
	
	return info;
}

function parseMoney(money: string, defaultValue?: number): number {
	money = (money || '').toString();
	money = money.replace('$', '').replace(/,/g, '');
	var result = parseFloat(money);
	
	if (isNaN(result)) {
		result = defaultValue;
	}
	
	return result;
}

function decodeHtml(source: string) {
	var result = source;
	
	var replacements = [
		{
			replace: /<br>/gi,
			'with': '\r\n'
		},
		{
			replace: /&amp;/gi,
			'with': '&'
		},
		{
			replace: /&lsquo;/gi,
			'with': "'"
		},
		{
			replace: /&rsquo;/gi,
			'with': "'"
		},
		{
			replace: /&ldquo;/gi,
			'with': '"'
		},
		{
			replace: /&rdquo;/gi,
			'with': '"'
		},
		{
			replace: /&ndash;/gi,
			'with': '–'
		}
	];
	
	for (var replacement of replacements) {
		result = result.replace(replacement.replace, replacement.with);
	}
	
	return result;
}

function changeImageUrlSize(url: string, width: number, height: number): string {
	var result = url.replace(/\d+x\d+/gi, `${width}x${height}`);
	return result;
}

export function scrapeRentalPropertyPage(url: string, callback: (err: Error, property: models.IProperty) => any) {
	
	request(url, (err, res, html) =>
	{
		if (err) {
			callback(err, null);
			return;
		}
		
		if (res.statusCode != 200) {
			callback(new Error('Server returned: ' + res.statusCode), null);
			return;
		}
		
		var $ = cheerio.load(html);
		
		var baseInfo = $('#baseInfo');
		
		// Price
		var price = parseMoney(baseInfo.find('p.priceText').text().split(/\s+/)[0]);
		
		// Address
		var street = baseInfo.find('span[itemprop=streetAddress]').text();
		
		var streetInfo = getStreetInfo(street);
		
		var address: models.IPropertyAddress = {
			unitNumber: streetInfo.unitNumber,
			streetNumber: streetInfo.streetNumber,
			streetName: streetInfo.streetName,
			streetType: streetInfo.streetType,
			suburb: baseInfo.find('span[itemprop=addressLocality]').text(),
			state: baseInfo.find('span[itemprop=addressRegion]').text(),
			postCode: baseInfo.find('span[itemprop=postalCode]').text(),
			country: 'Australia'
		};
		
		if (!address.unitNumber) {
			delete address.unitNumber;
		}
		
		// Vendor Id
		var vendorId = stringUtils.getRegexMatch(/.*?(\d+)/, baseInfo.find('span.property_id').text(), 1);
		//var vendorId = /.*?(\d+)/.exec(baseInfo.find('span.property_id').text())[1];
		
		var features = $('#features').find('.featureList ul');
		
		// Attributes
		var propertyType = <models.PropertyType><any>features.find('li:contains("Property Type")').find('span').text();
		var bathroomCount = parseInt(features.find('li:contains("Bathrooms")').find('span').text() || '0');  
		var bedroomCount = parseInt(features.find('li:contains("Bedrooms")').find('span').text() || '0');
		var parkCount = parseInt(features.find('li:contains("Spaces")').find('span').text() || '0');
		var bond = parseMoney(features.find('li:contains("Bond")').find('span').text(), null);
		
		// Title & Description
		var descriptionElement = $('#description');
		var inspectionTimesContainer = descriptionElement.find('#inspectionTimes');
		var title = descriptionElement.find('p.title').text();
		descriptionElement = descriptionElement.find('p.body');
		
		var newLineToken = '<br>';
		
		var moreInfoElement = descriptionElement.find('span[data-description]');
		moreInfoElement.text(moreInfoElement.attr('data-description'));
		
		descriptionElement.find('br').each((i, br) => {
			$(br).replaceWith($('<span>&lt;br&gt;</span>'));
		});
		
		descriptionElement.find('br').replaceWith($('<span>!!!!!!</span>'));
		descriptionElement.find('a.more').remove();
		
		var description: string = descriptionElement.text();
		description = decodeHtml(description);
		
		// Inspection Times
		var inspectionTimes: models.IInspectionTime[] = [];
		var inspectionTimeElements = inspectionTimesContainer.find('a.calendar-item');		
		for (let index = 0; index < inspectionTimeElements.length; index++) {
			let element = inspectionTimeElements[index];
			
			inspectionTimes.push({
				startTime: new Date(Date.parse($(element).find('meta[itemprop="startDate"]').attr('content'))),
				endTime: new Date(Date.parse($(element).find('meta[itemprop="endDate"]').attr('content'))),
			});
		}
		
		var hasAirCon = 
			(features.find('li:contains("Air Conditioning")').length > 0) ||
			(description.search(/[^\w]air[^\w]/gi) > -1) ||
			(description.search(/[^\w]ac[^\w]/gi) > -1) ||
			(description.search(/[^\w]a\/c[^\w]/gi) > -1) ||
			(description.search(/[^\w]a\.c\./gi) > -1);
		
		var hasBalcony =
			(features.find('li:contains("Balcony")').length > 0) ||
			(description.search(/balcony/gi) > -1) ||
			(features.find('li:contains("Terrace")').length > 0) ||
			(description.search(/terrace/gi) > -1);
			
		var hasDishwasher =
			(features.find('li:contains("Dishwasher")').length > 0) ||
			(description.search(/dishwasher/gi) > -1) ||
			(description.search(/dish\swasher/gi) > -1);
		
		var hasPool =
			(features.find('li:contains("Pool")').length > 0) ||
			(description.search(/pool/gi) > -1);
			
		var hasGym = 
			(features.find('li:contains("Gym")').length > 0) ||
			(description.search(/gym/gi) > -1);
			
		var hasLaundry =
			(features.find('li:contains("Laundry")').length > 0) ||
			(description.search(/laundry/gi) > -1);
		
		var isFurnished = (description.search(/([^n]|^)furnished/gi) > -1);
		
		var images: models.IPropertyImage[] = [];
		$('.thumbs').find('.thumb img').each((i, image) => {
			var imageUrl = $(image).attr('src');
			if (imageUrl) {
				imageUrl = changeImageUrlSize(imageUrl, 800, 600);
				images.push({ url: imageUrl });
			}
		});
		
		var result: models.IProperty = {
			
			isArchived: false,
			lastScrapedTime: new Date(),
			
			listingType: models.ListingType.Rental,
			propertyType: propertyType,
			
			address: address,
			
			_id: null,
			vendor: models.Vendor.RealEstate,
			vendorId: vendorId,
			url: url,
			
			price: price,
			
			bathroomCount: bathroomCount,
			bedroomCount: bedroomCount,
			parkCount: parkCount,
			bond: bond,
			title: title, 
			description: description,
			inspectionTimes: inspectionTimes,
			
			features: {
				airCon: hasAirCon,
				balcony: hasBalcony,
				dishwasher: hasDishwasher,
				pool: hasPool,
				gym: hasGym,
				laundry: hasLaundry,
				furnished: isFurnished,
			},
			
			distanceToTrain: null,
			distanceToTram: null,
			images: images,
			overriddenFields: [],
			starRating: null,
			
			comments: []
		};
		
		result.starRating = propertyUtils.calculateStarRating(result);
		
		geoUtils.getCoord(address, (err, coord) => {
			
			if (err) {
				callback(err, null);
				return;
			}
			
			result.address.coord = coord;
			
			nbnUtils.isAvailable(address, (err, nbnAvailability) => {	
				if (err) {
					callback(err, null);
					return;
				}
				
				result.features.nbn = nbnAvailability == nbnUtils.NbnAvailability.Available;
				
				callback(err, result);
			});
		});
	});
	
};
