import * as cheerio from "cheerio";
import { Err, Ok } from "ts-results";
import { validate } from "typia";
import type {
	AutocompleteParameter,
	PosData,
	PronData,
	SearchData,
	SearchParameter,
	TransTextData,
	WordData,
} from "@/types";
import { DatasetType, LanguageType, PronType } from "@/types";

/**
 * Export all constants
 */
export * from "@/types/constant";

/**
 * Configuration options for the Cambridge dictionary crawler.
 */
interface Options {
	/** The target language for dictionary lookup. Defaults to LanguageType.ZhTw. */
	lang?: LanguageType;
	/** The dataset to use for dictionary lookup. Defaults to DatasetType.EnZhTw. */
	dataset?: DatasetType;
	/** Request timeout in milliseconds. Defaults to 30 seconds. */
	timeout?: number;
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
export class Cambridge {
	/** Base URL for the Cambridge Dictionary website. */
	private readonly base: string = "https://dictionary.cambridge.org";
	/** Target language for dictionary lookup. */
	private readonly lang: LanguageType;
	/** Dataset to use for dictionary lookup. */
	private readonly dataset: DatasetType;
	/** Request timeout in milliseconds. */
	private readonly timeout: number;

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
	constructor(options: Options = {}) {
		const {
			lang = LanguageType.ZhTw,
			dataset = DatasetType.EnZhTw,
			timeout = 30 * 1000,
		} = options;
		this.lang = lang;
		this.dataset = dataset;
		this.timeout = timeout;
	}

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
	private async request<T>(input: string | URL | Request, init?: RequestInit) {
		try {
			const response = await fetch(input, {
				signal: AbortSignal.timeout(this.timeout),
				...init,
			});

			if (!response.ok) {
				const err = await response.text();
				throw new Error(`[Fetch] ${response.status}`, {
					cause: err,
				});
			}

			const contentType =
				response.headers.get("content-type") ?? "application/json";

			const result = contentType?.includes("application/json")
				? await response.json()
				: await response.text();

			return Ok<T>(result);
		} catch (err: unknown) {
			return Err(err);
		}
	}

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
	private parse(html: string): SearchData {
		const $ = cheerio.load(html);

		const title = $(".hw.dhw").first().text().trim();
		const link =
			$("meta[property='og:url']").attr("content") ||
			$("link[rel='canonical']").attr("href") ||
			"";

		/**
		 * Extracts pronunciation data for a specific pronunciation type.
		 *
		 * @param type - The pronunciation type
		 * @returns Pronunciation data with IPA and audio URL
		 */
		const getPron = (type: PronType): PronData => {
			const root = $(`.${type}.dpron-i`);

			const ipa = root.find(".ipa").first().text().trim();

			const audio =
				root.find("audio source[type='audio/mpeg']").attr("src") || "";

			return {
				ipa,
				audio: audio.startsWith("http")
					? audio
					: `https://dictionary.cambridge.org${audio}`,
			};
		};

		/**
		 * Pronunciation data for different types (American, British, etc.)
		 */
		const pron = Object.values(PronType).reduce<SearchData["pron"]>(
			(prev, curr) => {
				prev[curr] = getPron(curr);
				return prev;
			},
			{},
		);

		/**
		 * Parts of speech data array
		 */
		const pos: PosData[] = [];

		/**
		 * Extracts parts of speech and their definitions from the HTML.
		 * Each sense block contains one or more definitions with examples.
		 */
		$(".pr.dsense").each((_, senseEl) => {
			const $sense = $(senseEl);

			const posText = $sense
				.find(".dsense_h .dsense_pos")
				.first()
				.text()
				.trim();

			const domain = $sense.find(".dsense_gw span").first().text().trim();

			$sense.find(".def-block").each((_, defEl) => {
				const $def = $(defEl);

				const gramEl = $def.find(".dgram a").first();
				const gram = {
					text: gramEl.text().replaceAll(/[[\]]/g, "").trim(),
					link: gramEl.attr("href") || "",
				};

				const usage = $def.find(".dusage").first().text().trim();

				const level = $def.find(".dxref").first().text().trim();

				const defText = $def.find(".def").first().text().trim();

				const trans = $def.find(".trans.dtrans").first().text().trim();

				const definition: TransTextData = {
					text: defText,
					trans,
				};

				const examples: TransTextData[] = $def
					.find(".examp")
					.map((_, exEl) => {
						const $ex = $(exEl);

						const text = $ex.find(".eg").text().trim();
						const trans = $ex.find(".trans.dtrans").text().trim();

						return { text, trans };
					})
					.get();

				const item = {
					pos: posText,
					gram,
					domain,
					usage,
					level,
					definition,
					examples,
				};
				pos.push(item);
			});
		});

		return {
			title,
			link,
			pron,
			pos,
		};
	}

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
	public async autocomplete(params: AutocompleteParameter) {
		const valid = validate<AutocompleteParameter>(params);
		if (!valid.success) {
			const err = new Error(`[Typia] ${valid.errors.at(0)?.description}`, {
				cause: valid.errors.at(0),
			});
			return Err(err);
		}

		const { query } = params;
		const sp = new URLSearchParams({ dataset: this.dataset, q: query });
		const url = `${this.base}/${this.lang}/autocomplete/amp?${sp.toString()}`;
		const result = await this.request<WordData[]>(url);
		return result;
	}

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
	public async search(params: SearchParameter) {
		const valid = validate<SearchParameter>(params);
		if (!valid.success) {
			const err = new Error(`[Typia] ${valid.errors.at(0)?.description}`, {
				cause: valid.errors.at(0),
			});
			return Err(err);
		}

		const { query } = params;
		const url = `${this.base}/dictionary/${this.dataset}/${query}`;
		const result = await this.request<string>(url);
		return result.map((i) => this.parse(i));
	}
}
