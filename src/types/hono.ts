import { LineEvent } from '@/types/line';

export interface HonoVariables {
	rawBody: string;
	events: LineEvent[];
}
