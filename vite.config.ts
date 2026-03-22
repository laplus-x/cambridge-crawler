import { resolve } from "node:path";
import typia from "@typia/unplugin/vite";
import { defineConfig, loadEnv } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import checker from "vite-plugin-checker";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [
			typia(),
			dts({
				rollupTypes: true,
				tsconfigPath: "./tsconfig.json",
				exclude: ["**/*.test.ts", "**/*.spec.ts", "tests", "__tests__"],
			}),
			checker({
				biome: {
					command: "check",
				},
			}),
			analyzer({
				enabled: env.DEBUG === "true",
				openAnalyzer: env.NODE_ENV === "development",
				analyzerMode: "static",
				fileName: "report",
			}),
		],
		build: {
			sourcemap: true,
			lib: {
				entry: resolve(__dirname, "src/main.ts"),
				name: "cambridge-crawler",
				fileName: "index",
			},
			rollupOptions: {
				external: ["ts-results", "cheerio"],
			},
		},
	};
});
