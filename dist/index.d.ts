import { Err } from 'ts-results';
import { Ok } from 'ts-results';

declare interface AutocompleteParameter {
    query: string;
}

/**
 * Cambridge Dictionary Crawler
 *
 * A class for crawling and parsing data from the Cambridge Dictionary website.
 * Provides functionality for word autocomplete and detailed word search with
 * pronunciation, definitions, and examples.
 *
 * @example
 * ```typescript
 * const cambridge = new Cambridge({
 *   lang: LanguageType.ZhTw,
 *   dataset: DatasetType.EnZhTw,
 *   timeout: 30000
 * });
 *
 * // Get autocomplete suggestions
 * const suggestions = await cambridge.autocomplete({ query: "hello" });
 *
 * // Search for word details
 * const result = await cambridge.search({ query: "hello" });
 * ```
 */
export declare class Cambridge {
    /** Base URL for the Cambridge Dictionary website. */
    private readonly base;
    /** Target language for dictionary lookup. */
    private readonly lang;
    /** Dataset to use for dictionary lookup. */
    private readonly dataset;
    /** Request timeout in milliseconds. */
    private readonly timeout;
    /**
     * Creates a new Cambridge dictionary crawler instance.
     *
     * @param options - Configuration options for the crawler
     * @param options.lang - Target language (default: LanguageType.ZhTw)
     * @param options.dataset - Dataset to use (default: DatasetType.EnZhTw)
     * @param options.timeout - Request timeout in milliseconds (default: 30000)
     *
     * @example
     * ```typescript
     * const crawler = new Cambridge({
     *   lang: LanguageType.En,
     *   dataset: DatasetType.EnEn,
     *   timeout: 60000
     * });
     * ```
     */
    constructor(options?: Options);
    /**
     * Makes an HTTP request with timeout handling and error processing.
     *
     * @template T - The expected response type
     * @param input - The request URL, URL object, or Request object
     * @param init - Optional RequestInit configuration
     * @returns A Result containing the parsed response or an error
     *
     * @throws {Error} When the HTTP response is not ok
     * @throws {Error} When the request times out
     *
     * @example
     * ```typescript
     * const result = await this.request<string>("https://api.example.com/data");
     * if (result.ok) {
     *   console.log("Success:", result.val);
     * } else {
     *   console.error("Error:", result.val);
     * }
     * ```
     */
    private request;
    /**
     * Parses HTML content from Cambridge Dictionary into structured data.
     *
     * @param html - The HTML content to parse
     * @returns Parsed SearchData containing word information including title,
     *          pronunciation, and parts of speech with definitions
     *
     * @description
     * This method extracts:
     * - Word title and canonical link
     * - Pronunciation data (IPA and audio URLs) for different types
     * - Parts of speech with their definitions, translations, and examples
     *
     * @example
     * ```typescript
     * const html = await fetch("https://dictionary.cambridge.org/word");
     * const data = this.parse(await html.text());
     * console.log(data.title); // "hello"
     * console.log(data.pron.uk.audio); // "https://audio.cambridge.org/audio.mp3"
     * ```
     */
    private parse;
    /**
     * Performs autocomplete search for word suggestions.
     *
     * @param params - Autocomplete parameters containing the search query
     * @param params.query - The search query string
     * @returns A Result containing an array of word suggestions or an error
     *
     * @description
     * This method validates the input parameters, constructs the appropriate
     * URL for the Cambridge Dictionary autocomplete API, and returns matching
     * word suggestions.
     *
     * @example
     * ```typescript
     * const result = await cambridge.autocomplete({ query: "hello" });
     * if (result.ok) {
     *   console.log("Suggestions:", result.val);
     * } else {
     *   console.error("Error:", result.val);
     * }
     * ```
     */
    autocomplete(params: AutocompleteParameter): Promise<Err<unknown> | Ok<WordData[]>>;
    /**
     * Searches for detailed word information in the Cambridge Dictionary.
     *
     * @param params - Search parameters containing the word to look up
     * @param params.query - The word to search for
     * @returns A Result containing parsed word data or an error
     *
     * @description
     * This method validates the input parameters, fetches the word page from
     * Cambridge Dictionary, and parses the HTML content into structured data
     * including pronunciation, definitions, and examples.
     *
     * @example
     * ```typescript
     * const result = await cambridge.search({ query: "hello" });
     * if (result.ok) {
     *   const wordData = result.val;
     *   console.log("Word:", wordData.title);
     *   console.log("IPA:", wordData.pron.uk.ipa);
     *   console.log("Definitions:", wordData.pos);
     * } else {
     *   console.error("Error:", result.val);
     * }
     * ```
     */
    search(params: SearchParameter): Promise<Err<unknown> | Ok<SearchData>>;
}

/** 字典 */
declare const DatasetType: {
    /** 英英 */
    readonly En: "english";
    /** 英中 */
    readonly EnZhCh: "english-chinese-simplified";
    readonly EnZhTw: "english-chinese-traditional";
};

declare type DatasetType = (typeof DatasetType)[keyof typeof DatasetType];

/** 語系 */
declare const LanguageType: {
    /** 繁體中文 */
    readonly ZhTw: "zht";
};

declare type LanguageType = (typeof LanguageType)[keyof typeof LanguageType];

/**
 * Configuration options for the Cambridge dictionary crawler.
 */
declare interface Options {
    /** The target language for dictionary lookup. Defaults to LanguageType.ZhTw. */
    lang?: LanguageType;
    /** The dataset to use for dictionary lookup. Defaults to DatasetType.EnZhTw. */
    dataset?: DatasetType;
    /** Request timeout in milliseconds. Defaults to 30 seconds. */
    timeout?: number;
}

declare interface PosData {
    pos: string;
    gram: {
        text: string;
        link: string;
    };
    level?: string;
    domain: string;
    usage: string;
    definition: TransTextData;
    examples: TransTextData[];
}

declare interface PronData {
    ipa: string;
    audio: string;
}

declare const PronType: {
    UK: string;
    US: string;
};

declare type PronType = (typeof PronType)[keyof typeof PronType];

declare interface SearchData {
    title: string;
    link: string;
    pron: Record<PronType, PronData>;
    pos: PosData[];
}

declare interface SearchParameter {
    query: string;
}

declare interface TransTextData {
    text: string;
    trans: string;
}

declare interface WordData {
    word: string;
    url: string;
    beta: boolean;
}

export { }
