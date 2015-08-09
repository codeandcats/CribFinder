export function clone<T>(value: T): T {
	var result: T;
	
	var type = typeof value;
	
	switch (type) {
		case 'object':
			if (value instanceof Date) {
				let originalDate = <Date><any>value;
				let newDate = new Date();
				newDate.setTime(originalDate.getTime());
				result = <any>newDate;
			}
			else if (value instanceof Array) {
				let originalArray = <any[]><any>value;
				let newArray = [];
				
				for (var index = 0; index < originalArray.length; index++) {
					newArray.push(clone(originalArray[index]));
				}
				
				result = <any>newArray;
			}
			else {
				let originalObject = <Object><any>value;
				let newObject = {};
				
				for (var key in value) {
					// Ignore properties starting with '$'
					if (key && (key[0] != '$')) {
						newObject[key] = clone(originalObject[key]);
					}
				}
				
				result = <any>newObject;
			}
			break;
		
		default:
			// Everything else
			result = value;
			break;
	}
	
	return result;
}