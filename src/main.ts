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

interface Options {
	lang?: LanguageType;
	dataset?: DatasetType;
	timeout?: number;
}

export class Cambridge {
	private readonly base: string = "https://dictionary.cambridge.org";
	private readonly lang: LanguageType;
	private readonly dataset: DatasetType;
	private readonly timeout: number;

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

	private parse(html: string): SearchData {
		const $ = cheerio.load(html);

		const title = $(".hw.dhw").first().text().trim();
		const link =
			$("meta[property='og:url']").attr("content") ||
			$("link[rel='canonical']").attr("href") ||
			"";

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

		const pron = Object.values(PronType).reduce<SearchData["pron"]>(
			(prev, curr) => {
				prev[curr] = getPron(curr);
				return prev;
			},
			{},
		);

		const pos: PosData[] = [];

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
				console.log(item);
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
