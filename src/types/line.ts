export type LineSourceType = 'user' | 'group' | 'room';

export interface LineSource {
	type: LineSourceType;
	userId?: string;
	groupId?: string;
	roomId?: string;
}

export interface LineMessageEvent {
	type: 'message';
	replyToken: string;
	source: LineSource;
	timestamp: number;
	message: LineMessage;
}

export interface LinePostbackEvent {
	type: 'postback';
	replyToken: string;
	source: LineSource;
	timestamp: number;
	postback: { data: string };
}

export type LineEvent = LineMessageEvent | LinePostbackEvent;

export type LineMessageType = 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'sticker';

export interface LineMessage {
	id: string;
	type: LineMessageType;
	text?: string;
}

export interface LineWebhookBody {
	destination: string;
	events: LineEvent[];
}
