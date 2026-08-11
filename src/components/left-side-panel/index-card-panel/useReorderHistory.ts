import { useCallback, useRef, useState } from 'react'
import type { SceneInfo } from '@/stores/editorStore'

export function useReorderHistory(
  active: boolean,
  setPendingScenes: (scenes: SceneInfo[]) => void,
) {
  const historyRef = useRef<{ stack: SceneInfo[][]; pointer: number }>({
    stack: [],
    pointer: -1,
  })
  const [pointer, setPointer] = useState(-1)
  const [stackLength, setStackLength] = useState(0)

  const canUndo = active && pointer > 0
  const canRedo = active && pointer < stackLength - 1

  const reset = useCallback((initial: SceneInfo[]) => {
    historyRef.current = { stack: [initial], pointer: 0 }
    setPointer(0)
    setStackLength(1)
  }, [])

  const clear = useCallback(() => {
    historyRef.current = { stack: [], pointer: -1 }
    setPointer(-1)
    setStackLength(0)
  }, [])

  const push = useCallback((state: SceneInfo[]) => {
    const h = historyRef.current
    h.stack = h.stack.slice(0, h.pointer + 1) // truncate any redo states
    h.stack.push(state)
    h.pointer = h.stack.length - 1
    setPointer(h.pointer)
    setStackLength(h.stack.length)
  }, [])

  const undo = useCallback(() => {
    const h = historyRef.current
    if (h.pointer <= 0) return
    h.pointer--
    setPendingScenes(h.stack[h.pointer])
    setPointer(h.pointer)
  }, [setPendingScenes])

  const redo = useCallback(() => {
    const h = historyRef.current
    if (h.pointer >= h.stack.length - 1) return
    h.pointer++
    setPendingScenes(h.stack[h.pointer])
    setPointer(h.pointer)
  }, [setPendingScenes])

  return { canUndo, canRedo, reset, clear, push, undo, redo }
}
