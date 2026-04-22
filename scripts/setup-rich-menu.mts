/**
 * LINE リッチメニュー セットアップスクリプト
 *
 * 事前準備:
 *   1. scripts/assets/rich-menu.png に画像を配置する（2500x843px）
 *   2. .dev.vars に LINE_CHANNEL_ACCESS_TOKEN を設定する
 *
 * 実行:
 *   pnpm setup-rich-menu
 */

import { messagingApi } from '@line/bot-sdk';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

config({ path: '.dev.vars' });

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
if (!channelAccessToken) {
	console.error('❌ Error: LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
	process.exit(1);
}

const client = new messagingApi.MessagingApiClient({ channelAccessToken });
const blobClient = new messagingApi.MessagingApiBlobClient({ channelAccessToken });

async function setupRichMenu() {
	// 既存のデフォルトリッチメニューがあれば削除
	try {
		const defaultMenu = await client.getDefaultRichMenuId();
		if (defaultMenu.richMenuId) {
			console.log(`既存のリッチメニューを削除: ${defaultMenu.richMenuId}`);
			await client.cancelDefaultRichMenu();
			await client.deleteRichMenu(defaultMenu.richMenuId);
		}
	} catch {
		console.log('既存のデフォルトリッチメニューなし');
	}

	const richMenuRequest: messagingApi.RichMenuRequest = {
		size: { width: 2500, height: 843 },
		selected: true,
		name: '寝室のライト',
		chatBarText: 'メニュー',
		areas: [
			{
				bounds: { x: 0, y: 0, width: 833, height: 843 },
				action: { type: 'postback', label: 'ON', data: JSON.stringify({ action: 'turnOn' }) },
			},
			{
				bounds: { x: 833, y: 0, width: 834, height: 843 },
				action: { type: 'postback', label: 'OFF', data: JSON.stringify({ action: 'turnOff' }) },
			},
			// {
			// 	bounds: { x: 1667, y: 0, width: 833, height: 843 },
			// 	action: { type: 'postback', label: '（予備）', data: JSON.stringify({ action: 'reserved' }) },
			// },
		],
	};

	console.log('リッチメニューをバリデーション中...');
	await client.validateRichMenuObject(richMenuRequest);
	console.log('✓ バリデーション通過');

	console.log('リッチメニューを作成中...');
	const { richMenuId } = await client.createRichMenu(richMenuRequest);
	console.log(`✓ 作成完了: ${richMenuId}`);

	console.log('画像をアップロード中...');
	const imagePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'rich-menu.png');
	if (!fs.existsSync(imagePath)) {
		throw new Error(`画像が見つかりません: ${imagePath}`);
	}
	const image = new Blob([fs.readFileSync(imagePath)], { type: 'image/png' });
	await blobClient.setRichMenuImage(richMenuId, image);
	console.log('✓ 画像アップロード完了');

	console.log('デフォルトリッチメニューに設定中...');
	await client.setDefaultRichMenu(richMenuId);
	console.log(`✓ 完了 (richMenuId: ${richMenuId})`);
}

try {
	await setupRichMenu();
	console.log('\n✅ All done!');
	process.exit(0);
} catch (error) {
	console.error('\n❌ Error:', error);
	process.exit(1);
}
