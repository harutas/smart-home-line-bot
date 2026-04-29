/**
 * LINE リッチメニュー セットアップスクリプト
 *
 * 事前準備:
 *   scripts/assets/richmenu-1.png  寝室のライト用画像 (2500x1686)
 *   scripts/assets/richmenu-2.png  リビングのエアコン用画像 (2500x1686)
 *   .dev.vars に LINE_CHANNEL_ACCESS_TOKEN を設定する
 *
 * 実行:
 *   pnpm setup-rich-menu
 */

import { messagingApi } from '@line/bot-sdk';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

const POSTBACK_ACTION = {
	BEDROOM_LIGHT_TURN_ON: 'BEDROOM_LIGHT_TURN_ON',
	BEDROOM_LIGHT_TURN_OFF: 'BEDROOM_LIGHT_TURN_OFF',
	LIVING_ROOM_AC_COOL: 'LIVING_ROOM_AC_COOL',
	LIVING_ROOM_AC_HEAT: 'LIVING_ROOM_AC_HEAT',
	LIVING_ROOM_AC_STOP: 'LIVING_ROOM_AC_STOP',
	LIVING_ROOM_AC_SELECT_MODE: 'LIVING_ROOM_AC_SELECT_MODE',
} as const;

config({ path: '.dev.vars' });

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
if (!channelAccessToken) {
	console.error('❌ Error: LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
	process.exit(1);
}

const client = new messagingApi.MessagingApiClient({ channelAccessToken });
const blobClient = new messagingApi.MessagingApiBlobClient({ channelAccessToken });

const ALIAS = {
	BEDROOM: 'richmenu-alias-1',
	LIVING_ROOM: 'richmenu-alias-2',
} as const;

const W = 2500;
const H = 1686;
const TOP_H = 300;

function b(x: number, y: number, width: number, height: number) {
	return { x, y, width, height };
}

async function loadImage(filename: string): Promise<Blob> {
	const imagePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', filename);
	if (!fs.existsSync(imagePath)) throw new Error(`画像が見つかりません: ${imagePath}`);
	return new Blob([fs.readFileSync(imagePath)], { type: 'image/png' });
}

async function createRichMenu(request: messagingApi.RichMenuRequest, imageFile: string): Promise<string> {
	await client.validateRichMenuObject(request);
	const { richMenuId } = await client.createRichMenu(request);
	await blobClient.setRichMenuImage(richMenuId, await loadImage(imageFile));
	return richMenuId;
}

async function getExistingMenuIds(): Promise<string[]> {
	const { richmenus } = await client.getRichMenuList();
	return richmenus.map((m) => m.richMenuId);
}

async function deleteOldMenus(oldIds: string[]): Promise<void> {
	for (const id of oldIds) {
		await client.deleteRichMenu(id);
		console.log(`削除: ${id}`);
	}
}

async function setupBedroom(): Promise<string> {
	console.log('\n--- 寝室のライト ---');
	const richMenuId = await createRichMenu(
		{
			size: { width: W, height: H },
			selected: true,
			name: '寝室（ライト）',
			chatBarText: '寝室（ライト）',
			areas: [
				{
					bounds: b(W / 2, 0, W / 2, TOP_H),
					action: { type: 'richmenuswitch', richMenuAliasId: ALIAS.LIVING_ROOM, data: 'richmenu-changed-to-living-room' },
				},
				{
					bounds: b(0, TOP_H, W / 2, H - TOP_H),
					action: {
						type: 'postback',
						label: 'ON',
						data: JSON.stringify({ action: POSTBACK_ACTION.BEDROOM_LIGHT_TURN_ON }),
						displayText: '電気をつける',
					},
				},
				{
					bounds: b(W / 2, TOP_H, W / 2, H - TOP_H),
					action: {
						type: 'postback',
						label: 'OFF',
						data: JSON.stringify({ action: POSTBACK_ACTION.BEDROOM_LIGHT_TURN_OFF }),
						displayText: '電気を消す',
					},
				},
			],
		},
		'richmenu-1.png'
	);
	console.log(`✓ 作成完了: ${richMenuId}`);
	return richMenuId;
}

async function setupLivingRoomAc(): Promise<string> {
	console.log('\n--- リビングのエアコン ---');
	const richMenuId = await createRichMenu(
		{
			size: { width: W, height: H },
			selected: true,
			name: 'リビング（エアコン）',
			chatBarText: 'リビング（エアコン）',
			areas: [
				// トップバー: エイリアス切り替え
				{
					bounds: b(0, 0, W / 2, TOP_H),
					action: { type: 'richmenuswitch', richMenuAliasId: ALIAS.BEDROOM, data: 'richmenu-changed-to-bedroom' },
				},
				// Row 1 (y=300, h=550): 冷房ON / 暖房ON
				{
					bounds: b(0, 300, W / 2, 550),
					action: {
						type: 'postback',
						label: '冷房ON',
						data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_COOL }),
						displayText: '冷房をつける',
					},
				},
				{
					bounds: b(W / 2, 300, W / 2, 550),
					action: {
						type: 'postback',
						label: '暖房ON',
						data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_HEAT }),
						displayText: '暖房をつける',
					},
				},
				// Row 2 (y=850, h=450): 温度設定 / 予約(未実装)
				{
					bounds: b(0, 850, W / 2, 450),
					action: {
						type: 'postback',
						label: '温度設定',
						data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_SELECT_MODE }),
						displayText: '温度設定',
					},
				},
				{
					bounds: b(W / 2, 850, W / 2, 450),
					action: { type: 'message', label: '予約', text: '予約機能は近日公開予定です' },
				},
				// Row 3 (y=1300, h=386): 停止 (全幅)
				{
					bounds: b(0, 1300, W, 386),
					action: {
						type: 'postback',
						label: '停止',
						data: JSON.stringify({ action: POSTBACK_ACTION.LIVING_ROOM_AC_STOP }),
						displayText: 'エアコンを止める',
					},
				},
			],
		},
		'richmenu-2.png'
	);
	console.log(`✓ 作成完了: ${richMenuId}`);
	return richMenuId;
}

async function setupAliases(bedroomId: string, livingRoomAcId: string): Promise<void> {
	console.log('\n--- エイリアス設定 ---');
	for (const aliasId of Object.values(ALIAS)) {
		try {
			await client.deleteRichMenuAlias(aliasId);
		} catch {
			/* 存在しなければ無視 */
		}
	}
	await client.createRichMenuAlias({ richMenuAliasId: ALIAS.BEDROOM, richMenuId: bedroomId });
	console.log(`✓ ${ALIAS.BEDROOM} → ${bedroomId}`);
	await client.createRichMenuAlias({ richMenuAliasId: ALIAS.LIVING_ROOM, richMenuId: livingRoomAcId });
	console.log(`✓ ${ALIAS.LIVING_ROOM} → ${livingRoomAcId}`);
}

try {
	const oldIds = await getExistingMenuIds();

	const bedroomId = await setupBedroom();
	const livingRoomAcId = await setupLivingRoomAc();

	await setupAliases(bedroomId, livingRoomAcId);

	console.log('\nデフォルトリッチメニューに設定中...');
	await client.setDefaultRichMenu(bedroomId);
	console.log(`✓ デフォルト: 寝室のライト (${bedroomId})`);

	if (oldIds.length > 0) {
		console.log('\n旧メニューを削除中...');
		await deleteOldMenus(oldIds);
	}

	console.log('\n✅ All done!');
	process.exit(0);
} catch (error) {
	console.error('\n❌ Error:', error);
	process.exit(1);
}
