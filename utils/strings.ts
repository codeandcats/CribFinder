export function getRegexMatch(re: RegExp, input: string, matchIndex: number): string {
	var matches = re.exec(input);
	
	return matches && (matches.length >= matchIndex) && matches[matchIndex];
}