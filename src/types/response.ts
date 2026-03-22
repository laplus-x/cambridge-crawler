import type { PronType } from "./constant";

export interface WordData {
	word: string;
	url: string;
	beta: boolean;
}

export interface SearchData {
	title: string;
	link: string;
	pron: Record<PronType, PronData>;
	pos: PosData[];
}

export interface PronData {
	ipa: string;
	audio: string;
}

export interface TransTextData {
	text: string;
	trans: string;
}

export interface PosData {
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
