export type PendingAction = 'check' | 'register';

export type UserSettings = {
	notifyLat?: number;
	notifyLon?: number;
	notifyHour?: number | null; // null = 通知停止, undefined = デフォルト時刻
	notifyMinute?: 0 | 30; // undefined = デフォルト（0分）
};

const PENDING_TTL_SECONDS = 60 * 5; // 5分

function userKey(userId: string): string {
	return `user:${userId}`;
}

function pendingKey(userId: string): string {
	return `pending:${userId}`;
}

export async function getUserSettings(kv: KVNamespace, userId: string): Promise<UserSettings> {
	const raw = await kv.get(userKey(userId));
	return raw ? (JSON.parse(raw) as UserSettings) : {};
}

export async function setUserSettings(kv: KVNamespace, userId: string, settings: UserSettings): Promise<void> {
	await kv.put(userKey(userId), JSON.stringify(settings));
}

export async function setPendingAction(kv: KVNamespace, userId: string, action: PendingAction): Promise<void> {
	await kv.put(pendingKey(userId), action, { expirationTtl: PENDING_TTL_SECONDS });
}

export async function getPendingAction(kv: KVNamespace, userId: string): Promise<PendingAction | null> {
	return (await kv.get(pendingKey(userId))) as PendingAction | null;
}

export async function clearPendingAction(kv: KVNamespace, userId: string): Promise<void> {
	await kv.delete(pendingKey(userId));
}
