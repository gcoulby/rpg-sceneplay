/**
 * The open document, and the list of documents available to open.
 *
 * This used to track `currentProject` / `currentScriptId` as server-shaped
 * entities, with a dispatcher deciding whether each read went to the cloud or
 * to local SQLite. There is one storage layer now, so all that remains is
 * "which document is open" plus a cached listing for the open/switch UI.
 */
import { create } from 'zustand';
import type { StorageDocSummary } from '@/storage/types';

interface ProjectState {
  /** Id of the open document — matches `StorageDoc['id']`. */
  currentDocId: string | null;
  /** Documents in the active provider, newest first. */
  docs: StorageDocSummary[];

  setCurrentDocId: (id: string | null) => void;
  setDocs: (docs: StorageDocSummary[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentDocId: null,
  docs: [],

  setCurrentDocId: (id) => set({ currentDocId: id }),
  setDocs: (docs) => set({ docs }),
}));
