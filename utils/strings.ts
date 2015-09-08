export function getRegexMatch(re: RegExp, input: string, matchIndex: number): string {
	var matches = re.exec(input);
	
	return matches && (matches.length >= matchIndex) && matches[matchIndex];
}

export function encodeRegexText(value: string): string {
	return value.split('').map(c => '\\' + c).join('');
}

export function toTitleCase(value: string): string {
	return value.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
}

export function toCamelCase(value: string): string {
	if (!value) {
		return value;
	}
	
	var wasUpper = false;
	var words: string[] = [];
	var word = '';
	
	function addWord() {
		if (word) {
			words.push(word);
			word = '';
		}
	}
	
	for (var index = 0; index < value.length; index++) {
		
		var char = value[index];
		var isUpper = (char == char.toUpperCase()) && (char != char.toLowerCase());
		
		// NBN = nbn
		// helloWorld = helloWorld
		// HelloWorld = helloWorld
		// Hello world = helloWorld
		
		if (isUpper && !wasUpper) {
			addWord();
			word += char;
		}
		else if (char == ' ' || char == '\t' || char == '\n' || char == '\r') {
			addWord();
		}
		else {
			word += char;
		}
		
		wasUpper = isUpper;
	}
	
	addWord();
	
	if (!words.length) {
		return '';
	}
	
	words = words.map(w => w[0].toUpperCase() + w.substr(1).toLowerCase());
	
	words[0] = words[0][0].toLowerCase() + words[0].substr(1);
	
	return words.join('');
}
