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

export enum PropertyFeature {
	Dishwasher = <any>'Dishwasher',
	AirCon = <any>'AirCon',
	Balcony = <any>'Balcony',
	Pool = <any>'Pool',
	Gym = <any>'Gym',
	Laundry = <any>'Laundry',
	Furnished = <any>'Furnished'
}

export interface IPropertyFeatures {
	dishwasher?: boolean;
	airCon?: boolean;
	balcony?: boolean;
	pool?: boolean;
	gym?: boolean;
	laundry?: boolean;
	furnished?: boolean;
}

export interface IProperty extends IPropertySearchResult, IModel {
	isArchived: boolean;

	lastScrapedTime: Date;

	listingType: ListingType;

	propertyType: PropertyType;

	address: IPropertyAddress;

	images: IPropertyImage[];

	price: number;
	bond: number;

	bedroomCount: number;
	bathroomCount: number;
	parkCount: number;

	features: IPropertyFeatures;

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
	email: string,
	passwordHash: string
}

export interface ISearchMinFeatures {
	bedrooms?: number;
	bathrooms?: number;
	parks?: number;
	price?: number;
	distanceToTram?: number;
	distanceToTrain?: number;
	starRating?: number;
}

export interface ISearchMaxFeatures {
	bedrooms?: number;
	price?: number;
	distanceToTram?: number;
	distanceToTrain?: number;
	starRating?: number;
}

export interface ISearch extends IModel {
	title: string;
	
	listingType: ListingType;
	
	propertyTypes?: PropertyType[];
	
	locations: string[];
	
	minFeatures: ISearchMinFeatures;
	maxFeatures: ISearchMaxFeatures;
	features: IPropertyFeatures;
		
	ownerId: string;
	sharedWithIds: string[];
}

export interface ISearchProperty extends IModel {
	searchId: string;
	propertyId: string;
}
