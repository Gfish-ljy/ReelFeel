import { db } from './db';
import { api } from './api';

export async function syncPendingDiaries(userId: string): Promise<void> {
  if (!navigator.onLine) return;

  const unsynced = await db.diaries.where({ userId, synced: false }).toArray();

  for (const local of unsynced) {
    if (local.pendingDelete && local.serverId) {
      await api.delete(`/diaries/${local.serverId}`);
      await db.diaries.delete(local.localId);
      continue;
    }

    if (!local.serverId) {
      const res = await api.post<{ id: string }>('/diaries', {
        title: local.title,
        content: local.content,
        mood: local.mood,
        categoryIds: local.categoryIds,
        tagIds: local.tagIds,
      });
      await db.diaries.update(local.localId, {
        serverId: res.data.id,
        synced: true,
      });
    } else {
      await api.put(`/diaries/${local.serverId}`, {
        title: local.title,
        content: local.content,
        mood: local.mood,
        categoryIds: local.categoryIds,
        tagIds: local.tagIds,
      });
      await db.diaries.update(local.localId, { synced: true });
    }
  }

  const queue = await db.syncQueue.toArray();
  for (const item of queue) {
    try {
      const payload = JSON.parse(item.payload);
      await api.request(payload.path, payload.options);
      if (item.id) await db.syncQueue.delete(item.id);
    } catch {
      /* keep in queue */
    }
  }
}

export function setupOnlineSync(userId: string) {
  const run = () => syncPendingDiaries(userId).catch(console.error);
  window.addEventListener('online', run);
  run();
  return () => window.removeEventListener('online', run);
}
