import { messagingApi } from '@line/bot-sdk';

export async function pushMessage(env: Env, to: string, message: messagingApi.Message): Promise<void> {
	const client = new messagingApi.MessagingApiClient({ channelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN });

	await client.pushMessage({ to, messages: [message] });
}
