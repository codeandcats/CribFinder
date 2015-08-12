interface IPrinterOptions {
	maxDepth: number;
}

var options: IPrinterOptions = { maxDepth: 10 };

export function configure(opts: IPrinterOptions) {
	for (var key in opts) {
		options[key] = opts[key];
	}
}

export function log(message?: any, ...args: any[]) {
	var args = [message].concat(args);
	console.log.apply(console.log, args);
}

export function logValue(name: string, value: any, indentCount?: number) {
	
	if (indentCount > options.maxDepth) {
		return;
	}
	
	// Build indent
	indentCount = indentCount || 0;
	var indent = '';
	for (var indentAmount = 0; indentAmount < indentCount; indentAmount++) {
		indent += '\t';
	}
	
	// Build prefix
	var prefix = name ? (indent + name + ' : ') : indent;
	
	var valueType = typeof value;
	
	// Null / Undefined
	if (value == null) {
		console.log(prefix + value);
	}
	// Array
	else if (Array.isArray(value)) {
		console.log(prefix + '[');
		for (var index = 0; index < value.length; index++) {
			logValue('', value[index], indentCount + 1);
		}
		console.log(indent + ']');
	}
	// Object / Date
	else if (valueType == 'object') {
		if (value instanceof Date) {
			console.log(prefix + value);
		}
		else {
			console.log(prefix + '{');
			for (var key in value) {
				logValue(key, value[key], indentCount + 1); 
			}
			console.log(indent + '}');
		}
	}
	// String
	else if (valueType == 'string') {
		if (value.length > 80) {
			var propIndent = value.length > 40 ? indent + '\t' : indent; 
			console.log(prefix);
			console.log(propIndent + '"' + value.replace(/\r\n/gi, '\r\n' + propIndent) + '"');
		}
		else {
			console.log(prefix + '"' + value + '"');
		}
	}
	// Function
	else if (valueType == 'function') {
		console.log(prefix);
		var funcBody = String(value);
		var funcIndent = value.length > 40 ? indent + '\t' : indent;
		console.log(funcIndent + funcBody.replace(/\n/gi, '\n' + funcIndent));
	}
	// Everything else (Numbers, Booleans, NaN, Your Mumma)
	else {
		console.log(prefix + value);
	}

}

export function logError(err: Error);
export function logError(errMessage: string);
export function logError(message: string, err: Error);
export function logError() {
	
	var err;
	
	switch (arguments.length) {
		case 1:
			let err = arguments[0];
			if (typeof err == 'string') {
				console.error(err);
			}
			else if (err instanceof Error) {
				console.error('Error: ' + err.message);
				if (err.stack) {
					console.error(err.stack);
				}
			}
			else {
				console.error('Error: ' + JSON.stringify(err));
			}
			break;
		
		case 2:
			let msg = arguments[0]
			err = arguments[1];
			
			if (typeof err == 'string') {
				console.error(msg, err);
			}
			else if (err instanceof Error) {
				console.error(msg, err.message);
				if (err.stack) {
					console.error(err.stack);
				}
			}
			else {
				console.error(msg, JSON.stringify(err));
			}
			break;
			
		default:
			break;
	}
	
}