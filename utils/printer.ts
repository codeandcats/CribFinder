interface IPrinterOptions {
	maxDepth: number;
}

var options: IPrinterOptions = { maxDepth: 10 };

export function configure(opts: IPrinterOptions) {
	for (var key in opts) {
		options[key] = opts[key];
	}
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
	// Object
	else if (valueType == 'object') {
		console.log(prefix + '{');
		for (var key in value) {
			logValue(key, value[key], indentCount + 1); 
		}
		console.log(indent + '}');
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
	// Everything else (Numbers, Booleans, Dates, NaN, Your Mumma)
	else {
		console.log(prefix + value);
	}

}