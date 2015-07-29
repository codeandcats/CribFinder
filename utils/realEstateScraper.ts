/// <reference path="../typings/tsd.d.ts" />
/// <reference path="../data/models.ts" />
/// <reference path="strings.ts" />

import request = require('request');
import cheerio = require('cheerio');
import models = require('../data/models'); 
import stringUtils = require('./strings');

export function getIdFromUrl(url: string): string {
	var result = '';
	
	var regex = /.*?(\d{3,})/;
	
	var match = regex.exec(url);
	
	result = match[1];
	
	return result;
}

interface ISearchResultsScrapeOptions {
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
	
	var streetName = parts.join(' ');
	
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
		var description = description.replace(/<br>/, '\r\n');
		
		description = description.replace(/<br>/gi, '\r\n');
		
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
		
		var result: models.IProperty = {
			
			isArchived: false,
			
			listingType: models.ListingType.Rental,
			propertyType: propertyType,
			
			address: address,
			
			_id: null,
			vendor: models.Vendor.RealEstate,
			vendorId: vendorId,
			url: url,
			
			pricePerWeek: price,
			
			bathroomCount: bathroomCount,
			bedroomCount: bedroomCount,
			parkCount: parkCount,
			bond: bond,
			title: title, 
			description: description,
			
			hasAirCon: hasAirCon,
			hasBalcony: hasBalcony,
			hasDishwasher: hasDishwasher,
			hasPool: hasPool,
			hasGym: hasGym,
			hasLaundry: hasLaundry,
			isFurnished: isFurnished,
			
			distanceToTrain: null,
			distanceToTram: null,
			images: [],
			overriddenFields: [],
			starRating: null
		};
		
		callback(null, <any>result);
	});
	
};
