/**
 * @module opensearch/formats/suggestions-json
 */

/**
 * Class to parse SuggestionsJSONFormat results
 * @constructor SuggestionsJSONFormat
 */
export class SuggestionsJSONFormat {

  /**
   * Parse the given JSON.
   * @param {string} text The JSON string to parse.
   * @returns {module:opensearch/formats.Suggestion[]} The parsed suggestions
   */
  parse(text) {
    const result = JSON.parse(text);
    const [, completions, descriptions, urls] = result;

    return completions.map((completion, index) => ({
      completion,
      description: descriptions && descriptions[index],
      url: urls && urls[index],
    }));
  }
}
