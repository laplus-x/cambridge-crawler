import * as e from "cheerio";
import { Err as t, Ok as n } from "ts-results";
//#region node_modules/typia/lib/internal/_validateReport.mjs
var r = (e) => {
	let t = (t) => {
		if (e.length === 0) return !0;
		let n = e[e.length - 1].path;
		return t.length > n.length || n.substring(0, t.length) !== t;
	};
	return (n, r) => (n && t(r.path) && (r.value === void 0 && (r.description ??= [
		"The value at this path is `undefined`.",
		"",
		`Please fill the \`${r.expected}\` typed value next time.`
	].join("\n")), e.push(r)), !1);
}, i = { ZhTw: "zht" }, a = {
	En: "english",
	EnZhCh: "english-chinese-simplified",
	EnZhTw: "english-chinese-traditional"
}, o = {
	UK: "uk",
	US: "us"
}, s = { ZhTw: "zht" }, c = {
	En: "english",
	EnZhCh: "english-chinese-simplified",
	EnZhTw: "english-chinese-traditional"
}, l = {
	UK: "uk",
	US: "us"
}, u = class {
	base = "https://dictionary.cambridge.org";
	lang;
	dataset;
	timeout;
	constructor(e = {}) {
		let { lang: t = i.ZhTw, dataset: n = a.EnZhTw, timeout: r = 30 * 1e3 } = e;
		this.lang = t, this.dataset = n, this.timeout = r;
	}
	async request(e, r) {
		try {
			let t = await fetch(e, {
				signal: AbortSignal.timeout(this.timeout),
				...r
			});
			if (!t.ok) {
				let e = await t.text();
				throw Error(`[Fetch] ${t.status}`, { cause: e });
			}
			return n((t.headers.get("content-type") ?? "application/json")?.includes("application/json") ? await t.json() : await t.text());
		} catch (e) {
			return t(e);
		}
	}
	parse(t) {
		let n = e.load(t), r = n(".hw.dhw").first().text().trim(), i = n("meta[property='og:url']").attr("content") || n("link[rel='canonical']").attr("href") || "", a = (e) => {
			let t = n(`.${e}.dpron-i`), r = t.find(".ipa").first().text().trim(), i = t.find("audio source[type='audio/mpeg']").attr("src") || "";
			return {
				ipa: r,
				audio: i.startsWith("http") ? i : `https://dictionary.cambridge.org${i}`
			};
		}, s = Object.values(o).reduce((e, t) => (e[t] = a(t), e), {}), c = [];
		return n(".pr.dsense").each((e, t) => {
			let r = n(t), i = r.find(".dsense_h .dsense_pos").first().text().trim(), a = r.find(".dsense_gw span").first().text().trim();
			r.find(".def-block").each((e, t) => {
				let r = n(t), o = r.find(".dgram a").first(), s = {
					pos: i,
					gram: {
						text: o.text().replaceAll(/[[\]]/g, "").trim(),
						link: o.attr("href") || ""
					},
					domain: a,
					usage: r.find(".dusage").first().text().trim(),
					level: r.find(".dxref").first().text().trim(),
					definition: {
						text: r.find(".def").first().text().trim(),
						trans: r.find(".trans.dtrans").first().text().trim()
					},
					examples: r.find(".examp").map((e, t) => {
						let r = n(t);
						return {
							text: r.find(".eg").text().trim(),
							trans: r.find(".trans.dtrans").text().trim()
						};
					}).get()
				};
				c.push(s);
			});
		}), {
			title: r,
			link: i,
			pron: s,
			pos: c
		};
	}
	async autocomplete(e) {
		let n = (() => {
			let e = (e) => typeof e.query == "string", t = (e, t, n = !0) => [typeof e.query == "string" || a(n, {
				path: t + ".query",
				expected: "string",
				value: e.query
			})].every((e) => e), n = (t) => typeof t == "object" && !!t && e(t), i, a;
			return (e) => {
				if (!1 === n(e)) {
					i = [], a = r(i), ((e, n, r = !0) => (typeof e == "object" && !!e || a(!0, {
						path: n + "",
						expected: "AutocompleteParameter",
						value: e
					})) && t(e, n + "", !0) || a(!0, {
						path: n + "",
						expected: "AutocompleteParameter",
						value: e
					}))(e, "$input", !0);
					let n = i.length === 0;
					return n ? {
						success: n,
						data: e
					} : {
						success: n,
						errors: i,
						data: e
					};
				}
				return {
					success: !0,
					data: e
				};
			};
		})()(e);
		if (!n.success) return t(Error(`[Typia] ${n.errors.at(0)?.description}`, { cause: n.errors.at(0) }));
		let { query: i } = e, a = new URLSearchParams({
			dataset: this.dataset,
			q: i
		}), o = `${this.base}/${this.lang}/autocomplete/amp?${a.toString()}`;
		return await this.request(o);
	}
	async search(e) {
		let n = (() => {
			let e = (e) => typeof e.query == "string", t = (e, t, n = !0) => [typeof e.query == "string" || a(n, {
				path: t + ".query",
				expected: "string",
				value: e.query
			})].every((e) => e), n = (t) => typeof t == "object" && !!t && e(t), i, a;
			return (e) => {
				if (!1 === n(e)) {
					i = [], a = r(i), ((e, n, r = !0) => (typeof e == "object" && !!e || a(!0, {
						path: n + "",
						expected: "SearchParameter",
						value: e
					})) && t(e, n + "", !0) || a(!0, {
						path: n + "",
						expected: "SearchParameter",
						value: e
					}))(e, "$input", !0);
					let n = i.length === 0;
					return n ? {
						success: n,
						data: e
					} : {
						success: n,
						errors: i,
						data: e
					};
				}
				return {
					success: !0,
					data: e
				};
			};
		})()(e);
		if (!n.success) return t(Error(`[Typia] ${n.errors.at(0)?.description}`, { cause: n.errors.at(0) }));
		let { query: i } = e, a = `${this.base}/dictionary/${this.dataset}/${i}`;
		return (await this.request(a)).map((e) => this.parse(e));
	}
};
//#endregion
export { u as Cambridge, c as DatasetType, s as LanguageType, l as PronType };

//# sourceMappingURL=index.js.map