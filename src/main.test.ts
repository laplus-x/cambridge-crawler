import { describe, test } from "vitest";
import { Cambridge } from "@/main";
import { DatasetType, LanguageType } from "@/types";

describe("Cambridge", () => {
	const lang = LanguageType.ZhTw;
	const dataset = DatasetType.EnZhTw;
	const client = new Cambridge({ lang, dataset });
	describe("Options", () => {
		test("autocomplete", async () => {
			const result = await client.autocomplete({ query: "world" });
			console.log(result);
		});
	});

	describe("Search", () => {
		test("search", async () => {
			const result = await client.search({ query: "world" });
			console.log(result);
		});
	});
});
