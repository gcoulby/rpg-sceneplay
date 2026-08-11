import { useEditorStore } from '@/stores/editorStore'

type EditorStoreState = ReturnType<typeof useEditorStore.getState>

export type TagItem = EditorStoreState['tags'][number]
export type TagCategoryItem = EditorStoreState['tagCategories'][number]
export type PendingTagSelection = NonNullable<
  EditorStoreState['pendingTagSelection']
>
