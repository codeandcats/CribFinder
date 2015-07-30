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