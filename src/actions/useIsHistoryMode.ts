import { useParams } from 'react-router-dom'

export function useIsHistoryMode(): boolean {
  const { commitHash } = useParams<{ commitHash?: string }>()
  return Boolean(commitHash)
}
