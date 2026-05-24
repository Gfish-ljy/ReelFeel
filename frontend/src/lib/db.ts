import Dexie, { type Table } from 'dexie';

export interface LocalDiary {
  serverId?: string;
  localId: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  categoryIds?: string[];
  tagIds?: string[];
  synced: boolean;
  pendingDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Draft {
  id?: number;
  localId: string;
  title: string;
  content: string;
  mood?: string;
  categoryIds?: string[];
  tagIds?: string[];
  updatedAt: string;
}

class AniDiaryDB extends Dexie {
  diaries!: Table<LocalDiary, string>;
  drafts!: Table<Draft, number>;
  syncQueue!: Table<{ id?: number; action: string; payload: string; createdAt: string }, number>;

  constructor() {
    super('anidiary');
    this.version(1).stores({
      diaries: 'localId, userId, synced, updatedAt',
      drafts: '++id, localId, updatedAt',
      syncQueue: '++id, createdAt',
    });
  }
}

export const db = new AniDiaryDB();
