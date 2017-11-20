/**
 * Class to parse SuggestionsJSONFormat results
 * @constructor SuggestionsJSONFormat
 */
export class SuggestionsJSONFormat {
  /**
   * Parse the given JSON.
   * @param {string} text The JSON string to parse.
   * @returns {Suggestion[]} The parsed suggestions
   */
  parse(text) {
    const result = JSON.parse(text);
    const [, completions, descriptions, urls] = result;

    return completions.map((completion, index) => ({
      completion,
      description: descriptions[index],
      url: urls[index],
    }));
  }
}
