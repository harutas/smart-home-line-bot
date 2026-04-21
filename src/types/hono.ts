import type { LineEvent } from './line';

export interface HonoVariables {
	rawBody: string;
	events: LineEvent[];
}
