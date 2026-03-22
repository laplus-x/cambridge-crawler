/** 語系 */
export const LanguageType = {
	/** 繁體中文 */
	ZhTw: "zht",
} as const;

export type LanguageType = (typeof LanguageType)[keyof typeof LanguageType];

/** 字典 */
export const DatasetType = {
	/** 英英 */
	En: "english",
	/** 英中 */
	EnZhCh: "english-chinese-simplified",
	EnZhTw: "english-chinese-traditional",
} as const;
export type DatasetType = (typeof DatasetType)[keyof typeof DatasetType];

export const PronType = {
	UK: "uk",
	US: "us",
};
export type PronType = (typeof PronType)[keyof typeof PronType];
