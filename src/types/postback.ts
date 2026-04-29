export const POSTBACK_ACTION = {
	BEDROOM_LIGHT_TURN_ON: 'BEDROOM_LIGHT_TURN_ON',
	BEDROOM_LIGHT_TURN_OFF: 'BEDROOM_LIGHT_TURN_OFF',
} as const;

export type PostbackAction = (typeof POSTBACK_ACTION)[keyof typeof POSTBACK_ACTION];

export interface PostbackData {
	action: PostbackAction;
}
