import DOMPurify from 'dompurify'
import type { CharacterProfile } from '@/stores/editorStore'

export function stripHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
    .replace(/\s+/g, ' ')
    .trim()
}

export function getEmptyProfile(name: string): CharacterProfile {
  return {
    name,
    description: '',
    color: '',
    highlighted: false,
    gender: '',
    age: '',
    role: '',
    backstory: '',
    arc: '',
    speechPattern: '',
    vocabulary: '',
    verbalTics: '',
    sampleDialogue: '',
    images: [],
  }
}

export interface CompletenessField {
  label: string
  filled: boolean
}

export interface ProfileCompleteness {
  pct: number
  filled: number
  total: number
  fields: CompletenessField[]
}

export function getProfileCompleteness(
  profile: CharacterProfile,
): ProfileCompleteness {
  const fields: CompletenessField[] = [
    { label: 'Description', filled: !!stripHtml(profile.description || '').trim() },
    { label: 'Gender', filled: !!profile.gender },
    { label: 'Age', filled: !!profile.age },
    { label: 'Role', filled: !!profile.role },
    { label: 'Backstory', filled: !!stripHtml(profile.backstory || '').trim() },
    { label: 'Character Arc', filled: !!stripHtml(profile.arc || '').trim() },
    {
      label: 'Speech Pattern',
      filled: !!stripHtml(profile.speechPattern || '').trim(),
    },
    { label: 'Vocabulary', filled: !!stripHtml(profile.vocabulary || '').trim() },
    { label: 'Verbal Tics', filled: !!stripHtml(profile.verbalTics || '').trim() },
    { label: 'Image', filled: (profile.images?.length || 0) > 0 },
  ]
  const filled = fields.filter((f) => f.filled).length
  const pct = Math.round((filled / fields.length) * 100)
  return { pct, filled, total: fields.length, fields }
}
