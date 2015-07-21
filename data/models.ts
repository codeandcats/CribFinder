'use strict';

export interface IModel {
	_id: string;
}

export enum PropertyType {
	House = <any>"House",
	Apartment = <any>"Apartment",
	Townhouse = <any>"Townhouse",
	Villa = <any>"Villa",
	Other = <any>"Other"
}

export enum Vendor {
	RealEstate = <any>"RealEstate"
}

export interface IStreetInfo {
	unitNumber?: string;
	streetNumber: string;
	streetName: string;
	streetType: string;
}

export interface IPropertyAddress extends IStreetInfo {
	suburb: string;
	postCode: string;
	state: string;
	country: string;

	lat?: number;
	long?: number;
}

export interface IPropertyImage {
	url: string;
}

export interface IPropertySearchResult {
	vendorId: string;
	vendor: Vendor;
	url: string;
}

export interface IProperty extends IPropertySearchResult, IModel {
	isArchived: boolean;

	propertyType: PropertyType;

	address: IPropertyAddress;

	images: IPropertyImage[];

	pricePerWeek: number;
	bond: number;

	bedroomCount: number;
	bathroomCount: number;
	parkCount: number;

	hasDishwasher: boolean;
	hasAirCon: boolean;
	hasBalcony: boolean;
	hasPool: boolean;
	hasGym: boolean;
	hasLaundry: boolean;
	isFurnished: boolean;

	distanceToTram: number;
	distanceToTrain: number;

	title: string;
	description: string;

	starRating: number;

	overriddenFields?: string[];
}

export interface IUser extends IModel {
	local: {
		email: string,
		passwordHash: string
	},
	facebook: {
		id: string,
		token: string,
		email: string,
		name: string
	},
	twitter: {
		id: string,
		token: string,
		displayName: string,
		username: string
	},
	google: {
		id: string,
		token: string,
		email: string,
		name: string
	}
}

export interface IRentalSearch extends IModel {
	location: string;
	propertyTypes: PropertyType[];
	
	minRent: number;
	maxRent: number;
	
	minBeds: number;
	maxBeds: number;
	
	minBathrooms: number;
	maxBathrooms: number;
	
	minParks: number;
	maxParks: number;
	
	hasDishwasher: boolean;
	hasAirCon: boolean;
	hasBalcony: boolean;
	hasPool: boolean;
	hasGym: boolean;
	hasLaundry: boolean;
	isFurnished: boolean;
	
	minDistanceToTram: number;
	maxDistanceToTram: number;
	
	minDistanceToTrain: number;
	maxDistanceToTrain: number;
	
	minStarRating: number;
	maxStarRating: number;
}
