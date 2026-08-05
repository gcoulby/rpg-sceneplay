// src/editor/searchPlugin.ts
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet } from '@tiptap/pm/view'

export const searchPluginKey = new PluginKey('searchHighlight')

/** Create the search-highlight ProseMirror plugin (once). */
export function createSearchPlugin() {
  return new Plugin({
    key: searchPluginKey,
    state: {
      init() {
        return DecorationSet.empty
      },
      apply(tr, old) {
        const meta = tr.getMeta(searchPluginKey)
        if (meta !== undefined) return meta
        if (tr.docChanged) return old.map(tr.mapping, tr.doc)
        return old
      },
    },
    props: {
      decorations(state) {
        return searchPluginKey.getState(state)
      },
    },
  })
}
