'use strict';

export interface IModel {
	_id?: string;
}

export enum ListingType {
	Rental = <any>"Rental",
	ForSale = <any>"ForSale"
}

export enum PropertyType {
	House = <any>"House",
	Apartment = <any>"Apartment",
	Unit = <any>"Unit",
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

export interface IComment extends IModel {
	authorId: string;
	creationTime: Date;
	message: string;
	seenByIds: string[];
}

export interface IInspectionTime {
	startTime: Date;
	endTime: Date;
}

export interface IProperty extends IPropertySearchResult, IModel {
	isArchived: boolean;

	listingType: ListingType;

	propertyType: PropertyType;

	address: IPropertyAddress;

	images: IPropertyImage[];

	price: number;
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
	
	inspectionTimes: IInspectionTime[];

	starRating: number;
	
	comments: IComment[];

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

export interface ISearch extends IModel {
	title: string;
	
	locations: string[];
	
	listingType: ListingType;
	propertyTypes?: PropertyType[];
	
	minPrice?: number;
	maxPrice?: number;
	
	minBedrooms?: number;
	maxBedrooms?: number;
	
	minBathrooms?: number;
	minParks?: number;
	
	hasDishwasher?: boolean;
	hasAirCon?: boolean;
	hasBalcony?: boolean;
	hasPool?: boolean;
	hasGym?: boolean;
	hasLaundry?: boolean;
	isFurnished?: boolean;
	
	minDistanceToTram?: number;
	maxDistanceToTram?: number;
	
	minDistanceToTrain?: number;
	maxDistanceToTrain?: number;
	
	minStarRating?: number;
	
	ownerId: string;
	sharedWithIds: string[];
}