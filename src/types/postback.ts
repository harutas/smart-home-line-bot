export const POSTBACK_ACTION = {
	TURN_ON: 'turnOn',
	TURN_OFF: 'turnOff',
} as const;

export type PostbackAction = (typeof POSTBACK_ACTION)[keyof typeof POSTBACK_ACTION];

export interface PostbackData {
	action: PostbackAction;
}
