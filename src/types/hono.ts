import { webhook } from '@line/bot-sdk';

export interface HonoVariables {
	rawBody: string;
	events: webhook.Event[];
}
