import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import DOMPurify from 'dompurify'
import { useDelayedUnmount, useSwipeDismiss } from '@/hooks/useTouch'
import {
  useEditorStore,
  type CharacterProfile,
  type CharacterRelationship,
} from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { characterKey, singleLine } from '@/utils/nodeText'
import { useAssetStore } from '@/stores/assetStore'
import { api } from '@/services/api'
import { showToast } from './Toast'
import MiniRichText from './MiniRichText'
import { RelationshipMap } from './RelationshipMap'

// Default colors for auto-assignment (VIBGYOR palette)
const DEFAULT_HIGHLIGHT_COLORS = [
  '#8b5cf6',
  '#4f46e5',
  '#2563eb',
  '#059669',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#000000',
]

// Character roles matching industry standard (Final Draft Character Navigator)
const CHARACTER_ROLES = [
  '',
  'Lead',
  'Supporting',
  'Featured',
  'Background',
  'Day Player',
]

/** Strip HTML tags to get plain text (for collapsed preview and FDX export) */
function stripHtml(html: string): string {
  if (!html) return ''
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
    .replace(/\s+/g, ' ')
    .trim()
}

const REL_TYPES = [
  'allies',
  'rivals',
  'family',
  'romantic',
  'mentor',
  'antagonist',
  'employer',
  'friends',
]
const REL_DYNAMICS = [
  'Stable',
  'Evolving',
  'Tense',
  'One-sided',
  'Supportive',
  'Adversarial',
  'Complex',
]

/** Compact inline form for adding a relationship from within a character profile */
const InlineRelForm: React.FC<{
  characterName: string
  allCharacters: string[]
  onSave: (rel: CharacterRelationship) => void
  onCancel: () => void
}> = ({ characterName, allCharacters, onSave, onCancel }) => {
  const [otherChar, setOtherChar] = useState('')
  const [relType, setRelType] = useState('allies')
  const [dynamic, setDynamic] = useState('Stable')
  const [desc, setDesc] = useState('')

  const others = allCharacters.filter((c) => c !== characterName)

  return (
    <div className="border border-(--fd-border) rounded-sm p-2 mt-1">
      <div className="flex gap-1 mb-1 [&_select]:flex-1 [&_select]:min-w-0 [&_select]:px-1.5 [&_select]:py-1 [&_select]:border [&_select]:border-(--fd-border) [&_select]:rounded-[3px] [&_select]:bg-(--fd-input-bg) [&_select]:text-(--fd-text) [&_select]:text-[11px]">
        <select
          value={otherChar}
          onChange={(e) => setOtherChar(e.target.value)}
        >
          <option value="">Select character...</option>
          {others.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={relType} onChange={(e) => setRelType(e.target.value)}>
          {REL_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={dynamic} onChange={(e) => setDynamic(e.target.value)}>
          {REL_DYNAMICS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Describe the relationship..."
        rows={2}
        className="w-full px-1.5 py-1 border border-(--fd-border) rounded-[3px] bg-(--fd-input-bg) text-(--fd-text) font-[inherit] text-[11px] resize-y min-h-9"
      />
      <div className="flex justify-end gap-1 mt-1.5">
        <button
          className="px-2.5 py-0.75 border border-(--fd-border) rounded-[3px] bg-transparent text-(--fd-text) text-[11px] cursor-pointer hover:bg-(--fd-overlay-light)"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="px-2.5 py-0.75 border rounded-[3px] text-[11px] cursor-pointer bg-(--fd-accent) border-(--fd-accent) text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-default"
          disabled={!otherChar}
          onClick={() =>
            onSave({
              id: crypto.randomUUID(),
              characterA: characterName,
              characterB: otherChar,
              type: relType,
              description: desc,
              dynamic,
            })
          }
        >
          Add
        </button>
      </div>
    </div>
  )
}

interface CharacterProfilesProps {
  editor: Editor | null
  projectId: string
  style?: React.CSSProperties
}

const CharacterProfiles: React.FC<CharacterProfilesProps> = ({
  editor,
  projectId,
  style,
}) => {
  const {
    characters,
    characterProfiles,
    upsertCharacterProfile,
    deleteCharacterProfile,
    characterRelationships,
    upsertCharacterRelationship,
    deleteCharacterRelationship,
    characterProfilesOpen,
    toggleCharacterProfiles,
    selectedCharacter,
    setSelectedCharacter,
  } = useEditorStore()

  const currentScriptId = useProjectStore((s) => s.currentScriptId)
  const { assets, setAssets } = useAssetStore()

  const [activeTab, setActiveTab] = useState<'profiles' | 'map'>('profiles')
  const [addRelFor, setAddRelFor] = useState<string | null>(null) // character name to add rel for
  const [expandedChar, setExpandedChar] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showReferred, setShowReferred] = useState(false)
  const sortBy = useEditorStore((s) => s.characterSortBy)
  const setSortBy = useEditorStore((s) => s.setCharacterSortBy)
  const [pendingRemoveChar, setPendingRemoveChar] = useState<string | null>(
    null,
  )
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fsViewMode, setFsViewMode] = useState<'cards' | 'list'>('cards')
  const [modalChar, setModalChar] = useState<string | null>(null)

  // Image picker state
  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null)
  const [imagePickerFilter, setImagePickerFilter] = useState('')
  const [lightboxImage, setLightboxImage] = useState<{
    url: string
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Fetch project assets when image picker opens
  const fetchAssets = useCallback(async () => {
    if (!projectId) return
    try {
      const list = await api.listAssets(projectId)
      setAssets(list)
    } catch (err) {
      console.warn('Failed to fetch assets:', err)
    }
  }, [projectId, setAssets])

  useEffect(() => {
    if (imagePickerFor && projectId) fetchAssets()
  }, [imagePickerFor, projectId, fetchAssets])

  // When a character is clicked in the editor, expand it in the panel
  useEffect(() => {
    if (selectedCharacter) {
      setExpandedChar(selectedCharacter)
      setSelectedCharacter(null)
      setTimeout(() => {
        const card = document.querySelector(
          `[data-char-name="${selectedCharacter}"]`,
        )
        card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [selectedCharacter, setSelectedCharacter])

  // Auto-sync: ensure every detected character has a profile entry
  useEffect(() => {
    for (const name of characters) {
      const upper = name.toUpperCase()
      if (!characterProfiles.find((p) => p.name === upper)) {
        const colorIdx =
          characterProfiles.length % DEFAULT_HIGHLIGHT_COLORS.length
        upsertCharacterProfile(upper, {
          color: DEFAULT_HIGHLIGHT_COLORS[colorIdx],
        })
      }
    }
  }, [characters, characterProfiles, upsertCharacterProfile])

  /**
   * "Build from Script" — scan the screenplay to extract character info:
   * 1. Collect all character names from Character elements
   * 2. For each character, scan Action lines for their ALL-CAPS name to find
   *    introductory descriptions (e.g. "SARAH (30s, sharp eyes, worn jacket) enters")
   * 3. Try to extract age/gender hints from the description
   */
  const handleBuildFromScript = useCallback(() => {
    if (!editor) return
    const doc = editor.state.doc

    // Step 1: collect unique character names
    const names = new Set<string>()
    doc.descendants((node) => {
      if (node.type.name === 'character') {
        const base = characterKey(node.textContent)
        if (base) names.add(base)
      }
      return true
    })

    // Step 2: for each name, find the first Action line that mentions them in ALL CAPS
    // Screenwriters introduce characters like: "SARAH CHEN (30s, sharp eyes) sits alone."
    const descriptions = new Map<string, string>()
    const ages = new Map<string, string>()

    for (const charName of names) {
      // Already has a description? Skip.
      const existing = characterProfiles.find((p) => p.name === charName)
      if (existing?.description) continue

      let found = false
      doc.descendants((node) => {
        if (found) return false
        if (node.type.name !== 'action') return true
        const text = node.textContent
        // Look for the character name in ALL CAPS within the action line
        const idx = text.indexOf(charName)
        if (idx === -1) return true

        // Check it's actually an ALL-CAPS word (not part of a lowercase word)
        const before = idx > 0 ? text[idx - 1] : ' '
        const after =
          idx + charName.length < text.length
            ? text[idx + charName.length]
            : ' '
        if (/[a-zA-Z]/.test(before) || /[a-z]/.test(after)) return true

        // Extract the whole sentence containing the character name
        // Find sentence boundaries
        let sentStart = idx
        while (
          sentStart > 0 &&
          text[sentStart - 1] !== '.' &&
          text[sentStart - 1] !== '\n'
        )
          sentStart--
        let sentEnd = idx + charName.length
        while (
          sentEnd < text.length &&
          text[sentEnd] !== '.' &&
          text[sentEnd] !== '\n'
        )
          sentEnd++
        if (sentEnd < text.length && text[sentEnd] === '.') sentEnd++

        const sentence = text.slice(sentStart, sentEnd).trim()
        if (sentence.length > 10) {
          descriptions.set(charName, sentence)

          // Try to extract age from parenthetical right after the name
          // e.g. "SARAH (30s, sharp)" or "MARCUS, 40s,"
          const afterName = text.slice(
            idx + charName.length,
            idx + charName.length + 60,
          )
          const ageMatch = afterName.match(/\(?(\d{1,2}0?s?|\d{1,2})\)?[,\s]/)
          if (ageMatch) {
            ages.set(charName, ageMatch[1])
          }
        }

        found = true
        return false
      })
    }

    // Step 3: remove orphaned profiles (characters no longer in script)
    for (const prof of characterProfiles) {
      if (!names.has(prof.name)) {
        deleteCharacterProfile(prof.name)
      }
    }

    // Step 4: apply to profiles
    let colorIdx = characterProfiles.length
    for (const charName of names) {
      const existing = characterProfiles.find((p) => p.name === charName)
      const updates: Partial<Omit<CharacterProfile, 'name'>> = {}

      if (!existing) {
        updates.color =
          DEFAULT_HIGHLIGHT_COLORS[colorIdx % DEFAULT_HIGHLIGHT_COLORS.length]
        colorIdx++
      }

      const desc = descriptions.get(charName)
      if (desc && !existing?.description) {
        updates.description = desc
      }

      const age = ages.get(charName)
      if (age && !existing?.age) {
        updates.age = age
      }

      if (Object.keys(updates).length > 0) {
        upsertCharacterProfile(charName, updates)
      }
    }
  }, [
    editor,
    characterProfiles,
    upsertCharacterProfile,
    deleteCharacterProfile,
  ])

  // Compute stats per character: dialogue count, scene appearances, order of appearance
  interface CharStats {
    dialogueCount: number
    sceneCount: number
    scenes: string[]
    appearanceOrder: number
  }
  const charStats = useMemo((): Map<string, CharStats> => {
    if (!editor) return new Map()
    const stats = new Map<
      string,
      { dialogueCount: number; scenes: Set<string>; appearanceOrder: number }
    >()

    let currentScene = ''
    let currentChar = ''
    let orderCounter = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'sceneHeading') {
        // Normalized identically to the lookup below — both sides must agree or
        // the scene match silently fails.
        currentScene = singleLine(node.textContent)
      }
      if (node.type.name === 'character') {
        currentChar = characterKey(node.textContent)
        if (!stats.has(currentChar)) {
          stats.set(currentChar, {
            dialogueCount: 0,
            scenes: new Set(),
            appearanceOrder: orderCounter++,
          })
        }
        const s = stats.get(currentChar)!
        if (currentScene) s.scenes.add(currentScene)
      }
      if (node.type.name === 'dialogue' && currentChar) {
        const s = stats.get(currentChar)
        if (s) s.dialogueCount++
      }
      return true
    })

    const result = new Map<string, CharStats>()
    for (const [name, s] of stats) {
      result.set(name, {
        dialogueCount: s.dialogueCount,
        sceneCount: s.scenes.size,
        scenes: Array.from(s.scenes),
        appearanceOrder: s.appearanceOrder,
      })
    }
    return result
  }, [editor, editor?.state.doc])

  /** Navigate to first appearance of a character in the script */
  const handleNavigateToCharacter = useCallback(
    (name: string) => {
      if (!editor) return
      const upper = name.toUpperCase()
      let targetPos: number | null = null

      editor.state.doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (node.type.name === 'character') {
          const base = characterKey(node.textContent)
          if (base === upper) {
            targetPos = pos + 1 // inside the node
            return false
          }
        }
        return true
      })

      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).run()
        const coords = editor.view.coordsAtPos(targetPos)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo =
            editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
          editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      }
    },
    [editor],
  )

  /** Navigate to a scene heading in the script */
  const handleNavigateToScene = useCallback(
    (sceneText: string) => {
      if (!editor) return
      let targetPos: number | null = null

      editor.state.doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (node.type.name === 'sceneHeading') {
          if (singleLine(node.textContent) === sceneText) {
            targetPos = pos + 1
            return false
          }
        }
        return true
      })

      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).run()
        const coords = editor.view.coordsAtPos(targetPos)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo =
            editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
          editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      }
    },
    [editor],
  )

  // Detect potential characters mentioned in action lines (ALL-CAPS words 2+ chars)
  // that are not yet in the character list — these may be non-speaking characters
  const unmatchedNames = useMemo(() => {
    if (!editor) return []
    const known = new Set<string>()
    for (const c of characters) known.add(c.toUpperCase())
    for (const p of characterProfiles) known.add(p.name)

    // Common ALL-CAPS words to exclude (not character names)
    const EXCLUDE = new Set([
      'INT',
      'EXT',
      'DAY',
      'NIGHT',
      'CONTINUOUS',
      'LATER',
      'MORNING',
      'EVENING',
      'DAWN',
      'DUSK',
      'NOON',
      'AFTERNOON',
      'FADE',
      'CUT',
      'DISSOLVE',
      'SMASH',
      'TO',
      'IN',
      'OUT',
      'THE',
      'AND',
      'BUT',
      'FOR',
      'NOT',
      'ALL',
      'HER',
      'HIS',
      'SHE',
      'HIM',
      'THEY',
      'ARE',
      'WAS',
      'HAS',
      'WITH',
      'FROM',
      'THAT',
      'THIS',
      'THEN',
      'THAN',
      'BACK',
      'OVER',
      'CONT',
      "CONT'D",
      'MORE',
      'END',
      'ACT',
      'ANGLE',
      'CLOSE',
      'WIDE',
      'POV',
      'FLASHBACK',
      'INTERCUT',
      'SUPER',
      'TITLE',
      'SERIES',
      'SHOTS',
      'MONTAGE',
      'BEGIN',
      'RESUME',
      'SAME',
      'TIME',
      'MATCH',
      'JUMP',
      'FREEZE',
      'FRAME',
      'STOCK',
      'SHOT',
      'INSERT',
    ])

    const found = new Set<string>()
    editor.state.doc.descendants((node) => {
      if (node.type.name !== 'action') return true
      const text = node.textContent
      // Match sequences of 2+ uppercase words (character names are often multi-word)
      const regex = /\b([A-Z][A-Z.'\- ]{1,30}[A-Z])\b/g
      let match
      while ((match = regex.exec(text)) !== null) {
        const candidate = match[1].trim()
        // Must be 2+ chars and not be an excluded common word
        if (candidate.length < 2) continue
        const words = candidate.split(/\s+/)
        if (words.every((w) => EXCLUDE.has(w.replace(/[.']/g, '')))) continue
        // Must not already be known
        if (known.has(candidate)) continue
        found.add(candidate)
      }
      return true
    })

    return Array.from(found).sort()
  }, [editor, editor?.state.doc, characters, characterProfiles])

  const handleAddUnmatched = useCallback(
    (name: string) => {
      const colorIdx =
        characterProfiles.length % DEFAULT_HIGHLIGHT_COLORS.length
      upsertCharacterProfile(name, {
        color: DEFAULT_HIGHLIGHT_COLORS[colorIdx],
      })
    },
    [characterProfiles, upsertCharacterProfile],
  )

  // Characters that have a profile but are no longer detected in the script
  // Scan the editor doc directly so we don't depend on the store's `characters` timing
  const scriptCharacterNames = useMemo(() => {
    const names = new Set<string>()
    if (!editor) return names
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'character') {
        const base = characterKey(node.textContent)
        if (base) names.add(base)
      }
      return true
    })
    return names
  }, [editor, editor?.state.doc])

  const orphanedNames = useMemo(() => {
    return new Set(
      characterProfiles
        .filter((p) => !scriptCharacterNames.has(p.name))
        .map((p) => p.name),
    )
  }, [characterProfiles, scriptCharacterNames])

  // All characters (from profiles + auto-detected), sorted by selected criteria
  const allCharacters = useMemo(() => {
    const nameSet = new Set<string>()
    for (const p of characterProfiles) nameSet.add(p.name)
    for (const c of characters) nameSet.add(c.toUpperCase())
    for (const name of scriptCharacterNames) nameSet.add(name)
    let list = Array.from(nameSet)

    if (searchQuery) {
      const q = searchQuery.toUpperCase()
      list = list.filter((n) => n.includes(q))
    }

    list.sort((a, b) => {
      const sa = charStats.get(a)
      const sb = charStats.get(b)
      switch (sortBy) {
        case 'name':
          return a.localeCompare(b)
        case 'importance':
          // scenes + dialogues descending
          return (
            (sb?.sceneCount ?? 0) +
            (sb?.dialogueCount ?? 0) -
            ((sa?.sceneCount ?? 0) + (sa?.dialogueCount ?? 0))
          )
        case 'scenes':
          return (sb?.sceneCount ?? 0) - (sa?.sceneCount ?? 0)
        case 'dialogues':
          return (sb?.dialogueCount ?? 0) - (sa?.dialogueCount ?? 0)
        case 'appearance':
          return (sa?.appearanceOrder ?? 999) - (sb?.appearanceOrder ?? 999)
        default:
          return 0
      }
    })

    return list
  }, [
    characterProfiles,
    characters,
    scriptCharacterNames,
    searchQuery,
    sortBy,
    charStats,
  ])

  const getProfile = useCallback(
    (name: string): CharacterProfile => {
      const existing = characterProfiles.find((p) => p.name === name)
      if (existing) return existing
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
    },
    [characterProfiles],
  )

  /** Calculate profile completeness as percentage + field breakdown */
  const getProfileCompleteness = useCallback((profile: CharacterProfile) => {
    const fields: { label: string; filled: boolean }[] = [
      {
        label: 'Description',
        filled: !!stripHtml(profile.description || '').trim(),
      },
      { label: 'Gender', filled: !!profile.gender },
      { label: 'Age', filled: !!profile.age },
      { label: 'Role', filled: !!profile.role },
      {
        label: 'Backstory',
        filled: !!stripHtml(profile.backstory || '').trim(),
      },
      { label: 'Character Arc', filled: !!stripHtml(profile.arc || '').trim() },
      {
        label: 'Speech Pattern',
        filled: !!stripHtml(profile.speechPattern || '').trim(),
      },
      {
        label: 'Vocabulary',
        filled: !!stripHtml(profile.vocabulary || '').trim(),
      },
      {
        label: 'Verbal Tics',
        filled: !!stripHtml(profile.verbalTics || '').trim(),
      },
      { label: 'Image', filled: (profile.images?.length || 0) > 0 },
    ]
    const filled = fields.filter((f) => f.filled).length
    const pct = Math.round((filled / fields.length) * 100)
    return { pct, filled, total: fields.length, fields }
  }, [])

  // Image helpers
  const getAssetUrl = useCallback(
    (assetId: string) => {
      return api.getAssetUrl(projectId, assetId)
    },
    [projectId],
  )

  const imageAssets = useMemo(() => {
    return assets.filter((a) => a.mime_type.startsWith('image/'))
  }, [assets])

  const handleUploadImage = useCallback(
    async (charName: string, file: File) => {
      if (!projectId) return
      setUploading(true)
      try {
        const data = await api.uploadAsset(projectId, file, [
          `character:${charName}`,
        ])
        const assetId = data.id || data.asset?.id
        if (assetId) {
          const profile = characterProfiles.find((p) => p.name === charName)
          const currentImages = profile?.images || []
          upsertCharacterProfile(charName, {
            images: [...currentImages, assetId],
          })
        }
        await fetchAssets()
        showToast('Image uploaded', 'success')
      } catch (err) {
        showToast(
          `Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          'error',
        )
      } finally {
        setUploading(false)
      }
    },
    [projectId, characterProfiles, upsertCharacterProfile, fetchAssets],
  )

  const handleAssociateAsset = useCallback(
    (charName: string, assetId: string) => {
      const profile = characterProfiles.find((p) => p.name === charName)
      const currentImages = profile?.images || []
      if (!currentImages.includes(assetId)) {
        upsertCharacterProfile(charName, {
          images: [...currentImages, assetId],
        })
      }
      setImagePickerFor(null)
      setImagePickerFilter('')
    },
    [characterProfiles, upsertCharacterProfile],
  )

  const handleRemoveImage = useCallback(
    (charName: string, assetId: string) => {
      const profile = characterProfiles.find((p) => p.name === charName)
      const currentImages = profile?.images || []
      upsertCharacterProfile(charName, {
        images: currentImages.filter((id) => id !== assetId),
      })
    },
    [characterProfiles, upsertCharacterProfile],
  )

  const handleSetPrimaryImage = useCallback(
    (charName: string, assetId: string) => {
      const profile = characterProfiles.find((p) => p.name === charName)
      const currentImages = profile?.images || []
      const filtered = currentImages.filter((id) => id !== assetId)
      upsertCharacterProfile(charName, { images: [assetId, ...filtered] })
    },
    [characterProfiles, upsertCharacterProfile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const charName = uploadTargetRef.current
      if (file && charName) {
        handleUploadImage(charName, file)
      }
      e.target.value = ''
    },
    [handleUploadImage],
  )

  const triggerUpload = useCallback((charName: string) => {
    uploadTargetRef.current = charName
    fileInputRef.current?.click()
  }, [])

  /** Render character detail fields — used in both card expansion and modal */
  const renderCharacterFields = (charName: string, isModal: boolean) => {
    const prof = getProfile(charName)
    const st = charStats.get(charName)
    return (
      <>
        {/* Description */}
        <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
          Description
        </label>
        <MiniRichText
          value={prof.description}
          onChange={(html) =>
            upsertCharacterProfile(charName, { description: html })
          }
          placeholder="A weary detective in his 50s, haunted by a cold case..."
          minHeight={isModal ? 80 : 50}
        />

        {/* Role / Gender / Age */}
        <div className="flex gap-1.5">
          <div className="flex flex-col flex-1 min-w-0">
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Role
            </label>
            <select
              className="char-profile-select h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-1 text-[11px] outline-none cursor-pointer focus:border-(--fd-accent)"
              value={prof.role}
              onChange={(e) =>
                upsertCharacterProfile(charName, { role: e.target.value })
              }
            >
              {CHARACTER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r || '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Gender
            </label>
            <input
              type="text"
              className="char-profile-input h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-2 text-[11px] outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
              value={prof.gender}
              onChange={(e) =>
                upsertCharacterProfile(charName, { gender: e.target.value })
              }
              placeholder="e.g. Male"
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Age
            </label>
            <input
              type="text"
              className="char-profile-input h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-2 text-[11px] outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
              value={prof.age}
              onChange={(e) =>
                upsertCharacterProfile(charName, { age: e.target.value })
              }
              placeholder="e.g. 30s"
            />
          </div>
        </div>

        {/* Images */}
        {prof.images && prof.images.length > 0 && projectId && (
          <div className="flex flex-col gap-1.5">
            <div className="w-full rounded-sm overflow-hidden bg-(--fd-input-bg) border border-(--fd-border)">
              <img
                src={getAssetUrl(prof.images[0])}
                alt={charName}
                className="block hover:opacity-85 w-full max-h-50 object-cover transition-opacity duration-150 cursor-pointer char-profile-image-main"
                onClick={() =>
                  setLightboxImage({
                    url: getAssetUrl(prof.images[0]),
                    name: charName,
                  })
                }
              />
            </div>
            {prof.images.length > 1 && (
              <div className="flex gap-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent pb-0.5 [&::-webkit-scrollbar-thumb]:rounded-xs [&::-webkit-scrollbar]:h-1 overflow-x-auto">
                {prof.images.map((imgId, idx) => (
                  <div
                    key={imgId}
                    className={`group relative shrink-0 w-11 h-11 rounded-sm overflow-hidden border-2 cursor-pointer hover:border-(--fd-accent) ${idx === 0 ? 'border-(--fd-accent)' : 'border-transparent'}`}
                  >
                    <img
                      src={getAssetUrl(imgId)}
                      alt={`${charName} ${idx + 1}`}
                      className="block w-full h-full object-cover"
                      onClick={() =>
                        setLightboxImage({
                          url: getAssetUrl(imgId),
                          name: charName,
                        })
                      }
                    />
                    {idx > 0 && (
                      <button
                        className="bottom-0 left-0 absolute bg-black/70 opacity-0 group-hover:opacity-100 p-0 border-none rounded-tr-sm w-4 h-4 text-[#f4d35e] text-[10px] text-center leading-4 transition-opacity duration-150 cursor-pointer"
                        onClick={() => handleSetPrimaryImage(charName, imgId)}
                        title="Set as primary image"
                      >
                        &#9733;
                      </button>
                    )}
                    <button
                      className="top-0 right-0 absolute bg-black/70 opacity-0 group-hover:opacity-100 p-0 border-none rounded-bl-sm w-4 h-4 text-[10px] text-white text-center leading-4 transition-opacity duration-150 cursor-pointer"
                      onClick={() => handleRemoveImage(charName, imgId)}
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {projectId && (
          <div className="flex gap-1.5">
            <button
              className="flex-1 px-2 py-1 bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] cursor-pointer text-center transition-colors duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent)"
              onClick={() => triggerUpload(charName)}
              disabled={uploading}
              title="Upload a new image for this character"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <button
              className="flex-1 px-2 py-1 bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] cursor-pointer text-center transition-colors duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent)"
              onClick={() => {
                setImagePickerFor(charName)
                setImagePickerFilter('')
              }}
              title="Associate an existing project asset"
            >
              From Assets
            </button>
          </div>
        )}

        {/* Backstory */}
        <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
          Backstory
        </label>
        <MiniRichText
          value={prof.backstory}
          onChange={(html) =>
            upsertCharacterProfile(charName, { backstory: html })
          }
          placeholder="Character history, motivations, secrets..."
          minHeight={isModal ? 100 : 60}
        />

        {/* Character Arc */}
        <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
          Character Arc
        </label>
        <MiniRichText
          value={prof.arc || ''}
          onChange={(html) => upsertCharacterProfile(charName, { arc: html })}
          placeholder="How does this character change through the story..."
          minHeight={isModal ? 80 : 50}
        />

        {/* Voice Profile (collapsible) */}
        <details className="my-1">
          <summary className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block cursor-pointer select-none hover:text-(--fd-text)">
            Voice Profile
          </summary>
          <div className="pt-1">
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Speech Pattern
            </label>
            <MiniRichText
              value={prof.speechPattern || ''}
              onChange={(html) =>
                upsertCharacterProfile(charName, { speechPattern: html })
              }
              placeholder="Short sentences, formal tone, uses contractions..."
              minHeight={40}
            />
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Vocabulary
            </label>
            <MiniRichText
              value={prof.vocabulary || ''}
              onChange={(html) =>
                upsertCharacterProfile(charName, { vocabulary: html })
              }
              placeholder="Educated, uses legal terms, street slang..."
              minHeight={40}
            />
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Verbal Tics
            </label>
            <MiniRichText
              value={prof.verbalTics || ''}
              onChange={(html) =>
                upsertCharacterProfile(charName, { verbalTics: html })
              }
              placeholder="Says 'you see' often, clears throat before lying..."
              minHeight={40}
            />
            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
              Sample Dialogue
            </label>
            <MiniRichText
              value={prof.sampleDialogue || ''}
              onChange={(html) =>
                upsertCharacterProfile(charName, { sampleDialogue: html })
              }
              placeholder="3-5 representative lines from the script..."
              minHeight={40}
            />
          </div>
        </details>

        {/* Color + Highlight */}
        <div className="flex flex-col gap-1">
          <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
            Color
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              '#8b5cf6',
              '#4f46e5',
              '#2563eb',
              '#059669',
              '#eab308',
              '#f97316',
              '#ef4444',
              '#000000',
              '#ffffff',
            ].map((c) => (
              <button
                key={c}
                className={`w-7 h-7 rounded-full border-2 cursor-pointer shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] opacity-100 ${(prof.color || '') === c ? 'border-(--fd-text)' : 'border-transparent'}`}
                style={{ background: c }}
                onClick={() => upsertCharacterProfile(charName, { color: c })}
              />
            ))}
            <label
              className="w-7 h-7 rounded-full border-2 border-dashed border-(--fd-border) flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
              title="Custom color"
            >
              <input
                type="color"
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                value={prof.color || '#999999'}
                onChange={(e) =>
                  upsertCharacterProfile(charName, { color: e.target.value })
                }
              />
              <span className="text-sm font-bold text-(--fd-text-muted) pointer-events-none">
                +
              </span>
            </label>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <label
              className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] block"
              style={{ marginBottom: 0 }}
            >
              Highlight
            </label>
            <button
              className={`char-profile-highlight-btn px-3 py-0.75 bg-transparent border rounded-[3px] text-[11px] cursor-pointer hover:border-[#555] ${prof.highlighted ? 'text-white border-transparent' : 'border-(--fd-border) text-(--fd-text-muted)'}`}
              onClick={() =>
                upsertCharacterProfile(charName, {
                  highlighted: !prof.highlighted,
                })
              }
              style={
                prof.highlighted
                  ? {
                      background: prof.color || '#999',
                      borderColor: prof.color || '#999',
                    }
                  : undefined
              }
            >
              {prof.highlighted ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Relationships (before scenes) */}
        {(() => {
          const nameUpper = charName.toUpperCase()
          const rels = characterRelationships.filter(
            (r) => r.characterA === nameUpper || r.characterB === nameUpper,
          )
          const isAdding = addRelFor === nameUpper
          return (
            <div className="mt-1.5">
              <div className="flex justify-between items-center mb-1">
                <label
                  className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] block"
                  style={{ marginBottom: 0 }}
                >
                  Relationships
                </label>
                {!isAdding && (
                  <button
                    className="bg-none border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] px-2 py-0.5 cursor-pointer hover:text-(--fd-text) hover:border-(--fd-text-muted)"
                    onClick={() => setAddRelFor(nameUpper)}
                  >
                    + Add
                  </button>
                )}
              </div>
              {rels.map((r) => {
                const other =
                  r.characterA === nameUpper ? r.characterB : r.characterA
                return (
                  <div
                    key={r.id}
                    className="px-2 py-1.5 border border-(--fd-border) rounded-sm mt-1 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-xs">{other}</span>
                      <span className="text-[10px] px-1.5 py-px rounded-[3px] bg-(--fd-overlay-light) text-(--fd-text-muted) capitalize">
                        {r.type}
                      </span>
                      {r.dynamic && (
                        <span className="text-[10px] text-(--fd-text-muted) italic">
                          {r.dynamic}
                        </span>
                      )}
                      <button
                        className="ml-auto bg-none border-none text-(--fd-text-muted) cursor-pointer text-sm px-0.5 leading-none hover:text-[#ef5350]"
                        onClick={() => deleteCharacterRelationship(r.id)}
                        title="Remove relationship"
                      >
                        &times;
                      </button>
                    </div>
                    {r.description && (
                      <div className="mt-0.75 text-[11px] text-(--fd-text-muted) leading-[1.4]">
                        {r.description}
                      </div>
                    )}
                  </div>
                )
              })}
              {rels.length === 0 && !isAdding && (
                <div className="text-[11px] text-(--fd-text-muted) py-1.5 italic">
                  No relationships defined yet
                </div>
              )}
              {isAdding && (
                <InlineRelForm
                  characterName={nameUpper}
                  allCharacters={allCharacters}
                  onSave={(rel) => {
                    upsertCharacterRelationship(rel)
                    setAddRelFor(null)
                  }}
                  onCancel={() => setAddRelFor(null)}
                />
              )}
            </div>
          )
        })()}

        {/* Scene appearances (collapsed by default) */}
        {st && st.scenes.length > 0 && (
          <details className="my-1">
            <summary className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block cursor-pointer select-none hover:text-(--fd-text)">
              Appears in ({st.scenes.length} scenes)
            </summary>
            <div className="flex flex-wrap gap-0.75">
              {st.scenes.map((s, i) => (
                <span
                  key={i}
                  className="char-profile-scene-chip py-0.5 px-1.5 bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] text-[9px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-32.5 cursor-pointer hover:border-(--fd-accent) hover:text-(--fd-text)"
                  onClick={() => handleNavigateToScene(s)}
                  title={`Go to: ${s}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </details>
        )}
      </>
    )
  }

  const { shouldRender, animationState } = useDelayedUnmount(
    characterProfilesOpen,
    250,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  useSwipeDismiss(panelRef, {
    direction: 'right',
    onDismiss: toggleCharacterProfiles,
    enabled: shouldRender && !isFullscreen,
  })

  if (!shouldRender) return null

  const panelClass =
    !isFullscreen && animationState === 'entered'
      ? 'panel-open'
      : !isFullscreen && animationState === 'exiting'
        ? 'panel-closing'
        : ''

  return (
    <div
      ref={panelRef}
      className={`char-profiles-panel w-75 min-w-50 bg-(--fd-navigator-bg) border-l border-(--fd-border) flex flex-col overflow-hidden relative${isFullscreen ? ' char-profiles-fullscreen' : ''}${isFullscreen && fsViewMode === 'list' ? ' char-fs-list-mode' : ''} ${panelClass}`}
      style={isFullscreen ? undefined : style}
    >
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <div className="char-profiles-header flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="char-profiles-title font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Characters
        </span>
        <span className="char-profiles-count text-[10px] text-(--fd-text-muted) ml-auto">
          {allCharacters.length}
        </span>
        <button
          className="char-profiles-fullscreen-btn bg-transparent border-0 text-(--fd-text-muted) text-sm cursor-pointer px-1 leading-none hover:text-(--fd-text)"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? '\u2716' : '\u26F6'}
        </button>
        {isFullscreen && (
          <div className="char-fs-view-toggle flex gap-0.5 bg-(--fd-input-bg) rounded p-0.5">
            <button
              className={`char-fs-view-btn px-2.5 py-0.75 bg-transparent border-0 rounded-[3px] text-[11px] cursor-pointer ${fsViewMode === 'cards' ? 'active bg-(--fd-accent) text-white' : 'text-(--fd-text-muted)'}`}
              onClick={() => setFsViewMode('cards')}
            >
              Cards
            </button>
            <button
              className={`char-fs-view-btn px-2.5 py-0.75 bg-transparent border-0 rounded-[3px] text-[11px] cursor-pointer ${fsViewMode === 'list' ? 'active bg-(--fd-accent) text-white' : 'text-(--fd-text-muted)'}`}
              onClick={() => setFsViewMode('list')}
            >
              List
            </button>
          </div>
        )}
        <button
          className="char-profiles-close bg-transparent border-0 text-(--fd-text-muted) text-lg cursor-pointer px-1 leading-none hover:text-(--fd-text)"
          onClick={() => {
            setIsFullscreen(false)
            toggleCharacterProfiles()
          }}
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* Tabs: Profiles / Relationship Map */}
      <div className="char-profiles-tabs flex border-b border-(--fd-border) shrink-0">
        <button
          className={`char-profiles-tab px-3.5 py-1.5 text-xs font-medium bg-transparent border-0 border-b-2 cursor-pointer transition-all duration-100 ${activeTab === 'profiles' ? 'active text-(--fd-text) border-b-(--fd-accent)' : 'text-(--fd-text-muted) border-b-transparent hover:text-(--fd-text)'}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profiles
        </button>
        <button
          className={`char-profiles-tab px-3.5 py-1.5 text-xs font-medium bg-transparent border-0 border-b-2 cursor-pointer transition-all duration-100 ${activeTab === 'map' ? 'active text-(--fd-text) border-b-(--fd-accent)' : 'text-(--fd-text-muted) border-b-transparent hover:text-(--fd-text)'}`}
          onClick={() => setActiveTab('map')}
        >
          Relationship Map
        </button>
      </div>

      {/* Relationship Map tab */}
      {activeTab === 'map' && (
        <RelationshipMap
          key={currentScriptId || 'no-script'}
          scriptId={currentScriptId || undefined}
          onSelectCharacter={(name) => {
            setActiveTab('profiles')
            setSelectedCharacter(name)
            setExpandedChar(name)
            setModalChar(name)
          }}
        />
      )}

      {/* Profiles tab content */}
      {activeTab === 'profiles' && (
        <>
          {/* Toolbar: Search + Build */}
          <div className="char-profiles-toolbar flex gap-1.5 px-3 py-2 border-b border-(--fd-border) shrink-0">
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="char-profiles-search-input flex-1 w-full h-7 bg-[#222] text-(--fd-text) border border-(--fd-border) rounded px-2 text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
            />
            <button
              className="char-profiles-build-btn px-2.5 h-7 bg-transparent border border-(--fd-accent) rounded text-(--fd-accent) text-[11px] cursor-pointer whitespace-nowrap shrink-0 hover:bg-[rgba(74,158,255,0.1)]"
              onClick={handleBuildFromScript}
              title="Scan the screenplay for characters and extract descriptions from action lines"
            >
              Build from Script
            </button>
          </div>
          {/* Sort bar */}
          <div className="char-profiles-sort flex items-center gap-1.5 pt-1 px-3 pb-1.5 border-b border-(--fd-border) shrink-0">
            <span className="char-sort-label text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px]">
              Sort
            </span>
            <select
              className="char-sort-select flex-1 h-5.5 bg-[#222] text-(--fd-text) border border-(--fd-border) rounded-[3px] px-1.5 text-[11px] cursor-pointer outline-none focus:border-(--fd-accent)"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="name">Name</option>
              <option value="importance">Importance</option>
              <option value="scenes">Scenes</option>
              <option value="dialogues">Dialogues</option>
              <option value="appearance">Appearance</option>
            </select>
          </div>

          {/* Character list */}
          <div className="flex-1 p-1.5 overflow-y-auto char-profiles-list">
            {allCharacters.length === 0 ? (
              <div className="char-profiles-empty py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal">
                {searchQuery
                  ? 'No characters match your search.'
                  : 'No characters detected. Add character elements to your screenplay.'}
              </div>
            ) : (
              allCharacters.map((name) => {
                const profile = getProfile(name)
                const stats = charStats.get(name)
                const isExpanded = isFullscreen || expandedChar === name
                const isOrphaned = orphanedNames.has(name)
                const primaryImageId = profile.images?.[0]

                return (
                  <div
                    key={name}
                    data-char-name={name}
                    className={`char-profile-card bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md mb-1 overflow-hidden transition-colors duration-150 hover:border-[#555]${isOrphaned ? ' char-orphaned opacity-70 border-[#553333]' : ''}`}
                  >
                    {/* Orphaned banner */}
                    {isOrphaned && (
                      <div className="flex justify-between items-center bg-[rgba(224,96,96,0.1)] px-2.5 py-1 border-[rgba(224,96,96,0.2)] border-b text-[#e06060] text-[10px] char-orphaned-banner">
                        <span>Not in script</span>
                        <button
                          className="bg-transparent hover:bg-[rgba(224,96,96,0.15)] px-2 py-0.5 border border-[#e06060] rounded-[3px] text-[#e06060] text-[10px] cursor-pointer char-orphaned-remove"
                          onClick={() => setPendingRemoveChar(name)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {/* Header row */}
                    <div
                      className="flex items-center gap-2 px-2.5 py-2 cursor-pointer char-profile-row"
                      onClick={() => setExpandedChar(isExpanded ? null : name)}
                    >
                      {/* Avatar: show primary image or color swatch */}
                      {primaryImageId && projectId ? (
                        <img
                          src={getAssetUrl(primaryImageId)}
                          alt={name}
                          className="char-profile-avatar w-7 h-7 rounded-full object-cover shrink-0 border-2 border-(--fd-border)"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <input
                          type="color"
                          className="bg-transparent p-0 border-0 rounded-[3px] w-5 h-5 cursor-pointer char-profile-color shrink-0"
                          value={profile.color || '#999999'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            upsertCharacterProfile(name, {
                              color: e.target.value,
                            })
                          }
                          title="Highlight color"
                        />
                      )}
                      <div className="flex flex-col flex-1 gap-0.5 min-w-0 char-profile-name-col">
                        <span
                          className="char-profile-name text-xs font-semibold text-(--fd-text) uppercase tracking-[0.3px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis hover:text-(--fd-accent)"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNavigateToCharacter(name)
                          }}
                          title="Click to navigate to first appearance"
                        >
                          {name}
                        </span>
                        {profile.description &&
                          !isExpanded &&
                          (() => {
                            const plain = stripHtml(profile.description)
                            return plain ? (
                              <span className="char-profile-desc-preview text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis">
                                {plain.slice(0, 50)}
                                {plain.length > 50 ? '...' : ''}
                              </span>
                            ) : null
                          })()}
                      </div>
                      <div className="char-profile-stats flex flex-col items-end gap-px text-[9px] text-(--fd-text-muted) shrink-0 whitespace-nowrap">
                        {stats && (
                          <>
                            <span
                              title={`${stats.dialogueCount} dialogue lines`}
                            >
                              {stats.dialogueCount} lines
                            </span>
                            <span title={`In ${stats.sceneCount} scenes`}>
                              {stats.sceneCount} scenes
                            </span>
                          </>
                        )}
                      </div>
                      {/* Profile completeness indicator */}
                      {(() => {
                        const comp = getProfileCompleteness(profile)
                        const color =
                          comp.pct === 0
                            ? 'var(--fd-text-muted, #666)'
                            : comp.pct < 40
                              ? '#f44336'
                              : comp.pct < 70
                                ? '#ff9800'
                                : comp.pct < 100
                                  ? '#4caf50'
                                  : '#2e7d32'
                        return (
                          <div className="group relative flex flex-col items-center gap-px cursor-help char-profile-completeness shrink-0">
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 22 22"
                              className="block"
                            >
                              <circle
                                cx="11"
                                cy="11"
                                r="9"
                                fill="none"
                                stroke="var(--fd-border, #333)"
                                strokeWidth="2"
                              />
                              <circle
                                cx="11"
                                cy="11"
                                r="9"
                                fill="none"
                                stroke={color}
                                strokeWidth="2"
                                strokeDasharray={`${comp.pct * 0.5655} 56.55`}
                                strokeLinecap="round"
                                transform="rotate(-90 11 11)"
                              />
                            </svg>
                            <span
                              className="font-bold text-[8px] leading-none char-profile-completeness-label"
                              style={{ color }}
                            >
                              {comp.pct}%
                            </span>
                            <div className="char-completeness-tooltip hidden group-hover:block absolute top-full right-0 mt-1.5 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md py-2 px-2.5 min-w-40 z-100 shadow-[0_4px_16px_rgba(0,0,0,0.5)] pointer-events-none">
                              <div className="char-completeness-tooltip-title text-[11px] font-bold mb-1 text-(--fd-text) pb-1 border-b border-(--fd-border)">
                                Profile: {comp.filled}/{comp.total}
                              </div>
                              {comp.fields.map((f) => (
                                <div
                                  key={f.label}
                                  className={`char-completeness-tooltip-row${f.filled ? ' filled' : ''}`}
                                >
                                  <span>{f.filled ? '\u2713' : '\u2717'}</span>{' '}
                                  {f.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                      <button
                        className="char-profile-enlarge-btn bg-transparent border-0 text-(--fd-text-muted) text-xs cursor-pointer px-1 leading-none shrink-0 hover:text-(--fd-text)"
                        onClick={(e) => {
                          e.stopPropagation()
                          setModalChar(name)
                        }}
                        title="View enlarged"
                      >
                        &#x26F6;
                      </button>
                      <span
                        className={`char-profile-chevron text-[10px] text-(--fd-text-muted) transition-transform duration-150 shrink-0${isExpanded ? ' expanded' : ''}`}
                      >
                        &#9662;
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div
                        className={`char-profile-detail px-2.5 pt-2 pb-3 border-t border-(--fd-border) flex flex-col gap-2${isFullscreen && fsViewMode === 'cards' ? ' char-profile-detail-fs' : ''}`}
                      >
                        {/* Top section: Description + Role/Gender/Age and Images (side-by-side in fullscreen) */}
                        <div className="char-profile-detail-top flex flex-col gap-2">
                          <div className="flex flex-col gap-2 char-profile-detail-info">
                            {/* Description */}
                            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                              Description
                            </label>
                            <MiniRichText
                              value={profile.description}
                              onChange={(html) =>
                                upsertCharacterProfile(name, {
                                  description: html,
                                })
                              }
                              placeholder="A weary detective in his 50s, haunted by a cold case..."
                              minHeight={50}
                            />

                            {/* Role / Gender / Age */}
                            <div className="flex gap-1.5 char-profile-meta-row char-profile-meta-row-3">
                              <div className="flex flex-col flex-1 min-w-0 char-profile-meta-field">
                                <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                  Role
                                </label>
                                <select
                                  className="char-profile-select h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-1 text-[11px] outline-none cursor-pointer focus:border-(--fd-accent)"
                                  value={profile.role}
                                  onChange={(e) =>
                                    upsertCharacterProfile(name, {
                                      role: e.target.value,
                                    })
                                  }
                                >
                                  {CHARACTER_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {r || '—'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col flex-1 min-w-0 char-profile-meta-field">
                                <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                  Gender
                                </label>
                                <input
                                  type="text"
                                  className="char-profile-input h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-2 text-[11px] outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
                                  value={profile.gender}
                                  onChange={(e) =>
                                    upsertCharacterProfile(name, {
                                      gender: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Male"
                                />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0 char-profile-meta-field">
                                <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                  Age
                                </label>
                                <input
                                  type="text"
                                  className="char-profile-input h-6.5 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-2 text-[11px] outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
                                  value={profile.age}
                                  onChange={(e) =>
                                    upsertCharacterProfile(name, {
                                      age: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. 30s"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Images section */}
                          <div className="flex flex-col gap-2 char-profile-detail-media">
                            {profile.images &&
                              profile.images.length > 0 &&
                              projectId && (
                                <div className="flex flex-col gap-1.5 char-profile-images">
                                  <div className="char-profile-images-primary w-full rounded overflow-hidden bg-(--fd-input-bg) border border-(--fd-border)">
                                    <img
                                      src={getAssetUrl(profile.images[0])}
                                      alt={name}
                                      className="block hover:opacity-85 w-full max-h-50 object-cover transition-opacity duration-150 cursor-pointer char-profile-image-main"
                                      onClick={() =>
                                        setLightboxImage({
                                          url: getAssetUrl(profile.images[0]),
                                          name,
                                        })
                                      }
                                    />
                                  </div>
                                  {profile.images.length > 1 && (
                                    <div className="flex gap-1 pb-0.5 overflow-x-auto char-profile-images-strip">
                                      {profile.images.map((imgId, idx) => (
                                        <div
                                          key={imgId}
                                          className={`char-profile-thumb-wrap relative shrink-0 w-11 h-11 rounded overflow-hidden border-2 border-transparent cursor-pointer hover:border-(--fd-accent)${idx === 0 ? ' active border-(--fd-accent)' : ''}`}
                                        >
                                          <img
                                            src={getAssetUrl(imgId)}
                                            alt={`${name} ${idx + 1}`}
                                            className="block w-full h-full object-cover char-profile-thumb"
                                            onClick={() =>
                                              setLightboxImage({
                                                url: getAssetUrl(imgId),
                                                name,
                                              })
                                            }
                                          />
                                          {idx > 0 && (
                                            <button
                                              className="bottom-0 left-0 absolute bg-black/70 opacity-0 p-0 border-0 rounded-tr-md w-4 h-4 text-[#f4d35e] text-[10px] text-center leading-4 transition-opacity duration-150 cursor-pointer char-profile-thumb-primary"
                                              onClick={() =>
                                                handleSetPrimaryImage(
                                                  name,
                                                  imgId,
                                                )
                                              }
                                              title="Set as primary image"
                                            >
                                              &#9733;
                                            </button>
                                          )}
                                          <button
                                            className="top-0 right-0 absolute bg-black/70 opacity-0 p-0 border-0 rounded-bl-md w-4 h-4 text-[10px] text-white text-center leading-4 transition-opacity duration-150 cursor-pointer char-profile-thumb-remove"
                                            onClick={() =>
                                              handleRemoveImage(name, imgId)
                                            }
                                            title="Remove image"
                                          >
                                            &times;
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                            {projectId && (
                              <div className="flex gap-1.5 char-profile-image-actions">
                                <button
                                  className="char-profile-img-btn flex-1 py-1 px-2 bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] cursor-pointer text-center transition-[border-color,color] duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent) disabled:opacity-50 disabled:cursor-default"
                                  onClick={() => triggerUpload(name)}
                                  disabled={uploading}
                                  title="Upload a new image for this character"
                                >
                                  {uploading ? 'Uploading...' : 'Upload Image'}
                                </button>
                                <button
                                  className="char-profile-img-btn flex-1 py-1 px-2 bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] cursor-pointer text-center transition-[border-color,color] duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent)"
                                  onClick={() => {
                                    setImagePickerFor(name)
                                    setImagePickerFilter('')
                                  }}
                                  title="Associate an existing project asset"
                                >
                                  From Assets
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom section: Backstory, Arc, Color/Highlight, Scenes */}
                        <div className="char-profile-detail-bottom flex flex-col gap-2">
                          <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                            Backstory
                          </label>
                          <MiniRichText
                            value={profile.backstory}
                            onChange={(html) =>
                              upsertCharacterProfile(name, { backstory: html })
                            }
                            placeholder="Character history, motivations, secrets..."
                            minHeight={60}
                          />

                          <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                            Character Arc
                          </label>
                          <MiniRichText
                            value={profile.arc || ''}
                            onChange={(html) =>
                              upsertCharacterProfile(name, { arc: html })
                            }
                            placeholder="How does this character change through the story..."
                            minHeight={50}
                          />

                          {/* Voice Profile (collapsible) */}
                          <details className="my-1 char-profile-voice-section">
                            <summary className="char-profile-label char-profile-voice-toggle text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block cursor-pointer select-none hover:text-(--fd-text)">
                              Voice Profile
                            </summary>
                            <div className="pt-1 char-profile-voice-fields">
                              <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                Speech Pattern
                              </label>
                              <MiniRichText
                                value={profile.speechPattern || ''}
                                onChange={(html) =>
                                  upsertCharacterProfile(name, {
                                    speechPattern: html,
                                  })
                                }
                                placeholder="Short sentences, formal tone..."
                                minHeight={40}
                              />
                              <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                Vocabulary
                              </label>
                              <MiniRichText
                                value={profile.vocabulary || ''}
                                onChange={(html) =>
                                  upsertCharacterProfile(name, {
                                    vocabulary: html,
                                  })
                                }
                                placeholder="Educated, uses legal terms..."
                                minHeight={40}
                              />
                              <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                Verbal Tics
                              </label>
                              <MiniRichText
                                value={profile.verbalTics || ''}
                                onChange={(html) =>
                                  upsertCharacterProfile(name, {
                                    verbalTics: html,
                                  })
                                }
                                placeholder="Says 'you see' often..."
                                minHeight={40}
                              />
                              <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                                Sample Dialogue
                              </label>
                              <MiniRichText
                                value={profile.sampleDialogue || ''}
                                onChange={(html) =>
                                  upsertCharacterProfile(name, {
                                    sampleDialogue: html,
                                  })
                                }
                                placeholder="3-5 representative lines..."
                                minHeight={40}
                              />
                            </div>
                          </details>

                          <div className="flex flex-col gap-1 char-profile-color-highlight">
                            <label className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block">
                              Color
                            </label>
                            <div className="flex flex-wrap items-center gap-1.5 char-color-swatches">
                              {[
                                '#8b5cf6',
                                '#4f46e5',
                                '#2563eb',
                                '#059669',
                                '#eab308',
                                '#f97316',
                                '#ef4444',
                                '#000000',
                                '#ffffff',
                              ].map((c) => (
                                <button
                                  key={c}
                                  className={`synopsis-color-swatch w-7 h-7 rounded-full border-2 cursor-pointer shrink-0 opacity-100 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] ${(profile.color || '') === c ? 'active border-(--fd-text)' : 'border-transparent'}`}
                                  style={{ background: c }}
                                  onClick={() =>
                                    upsertCharacterProfile(name, { color: c })
                                  }
                                />
                              ))}
                              <label
                                className="synopsis-color-custom w-7 h-7 rounded-full border-2 border-dashed border-(--fd-border) flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
                                title="Custom color"
                              >
                                <input
                                  type="color"
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                  value={profile.color || '#999999'}
                                  onChange={(e) =>
                                    upsertCharacterProfile(name, {
                                      color: e.target.value,
                                    })
                                  }
                                />
                                <span className="text-sm font-bold text-(--fd-text-muted) pointer-events-none">
                                  +
                                </span>
                              </label>
                            </div>
                            <div className="char-profile-highlight-inline flex items-center gap-1.5 mt-0.5">
                              <label
                                className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0"
                                style={{ marginBottom: 0 }}
                              >
                                Highlight
                              </label>
                              <button
                                className={`char-profile-highlight-btn px-3 py-0.75 bg-transparent border border-(--fd-border) rounded-[3px] text-[11px] cursor-pointer hover:border-[#555]${profile.highlighted ? ' active text-white border-transparent' : ' text-(--fd-text-muted)'}`}
                                onClick={() =>
                                  upsertCharacterProfile(name, {
                                    highlighted: !profile.highlighted,
                                  })
                                }
                                style={
                                  profile.highlighted
                                    ? {
                                        background: profile.color || '#999',
                                        borderColor: profile.color || '#999',
                                      }
                                    : undefined
                                }
                              >
                                {profile.highlighted ? 'On' : 'Off'}
                              </button>
                            </div>
                          </div>

                          {/* Relationships (before scenes) */}
                          {(() => {
                            const rels = characterRelationships.filter(
                              (r) =>
                                r.characterA === name || r.characterB === name,
                            )
                            const isAdding = addRelFor === name
                            return (
                              <div className="mt-1.5 char-profile-relationships">
                                <div className="flex justify-between items-center mb-1 char-profile-rel-header-row">
                                  <label
                                    className="char-profile-label text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0"
                                    style={{ marginBottom: 0 }}
                                  >
                                    Relationships
                                  </label>
                                  {!isAdding && (
                                    <button
                                      className="char-profile-rel-add-btn bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[10px] py-0.5 px-2 cursor-pointer hover:text-(--fd-text) hover:border-(--fd-text-muted)"
                                      onClick={() => setAddRelFor(name)}
                                    >
                                      + Add
                                    </button>
                                  )}
                                </div>
                                {rels.map((r) => {
                                  const other =
                                    r.characterA === name
                                      ? r.characterB
                                      : r.characterA
                                  return (
                                    <div
                                      key={r.id}
                                      className="char-profile-rel-item py-1.5 px-2 border border-(--fd-border) rounded mt-1 text-xs"
                                    >
                                      <div className="flex flex-wrap items-center gap-1.5 char-profile-rel-header">
                                        <span className="char-profile-rel-other font-semibold text-xs text-(--fd-text-muted)">
                                          {other}
                                        </span>
                                        <span className="char-profile-rel-type text-[10px] py-px px-1.5 rounded-[3px] bg-(--fd-overlay-light,rgba(255,255,255,0.08)) text-(--fd-text-muted) capitalize">
                                          {r.type}
                                        </span>
                                        {r.dynamic && (
                                          <span className="char-profile-rel-dynamic text-[10px] text-(--fd-text-muted) italic">
                                            {r.dynamic}
                                          </span>
                                        )}
                                        <button
                                          className="char-profile-rel-remove ml-auto bg-transparent border-0 text-(--fd-text-muted) cursor-pointer text-sm px-0.5 leading-none hover:text-[#ef5350]"
                                          onClick={() =>
                                            deleteCharacterRelationship(r.id)
                                          }
                                          title="Remove relationship"
                                        >
                                          &times;
                                        </button>
                                      </div>
                                      {r.description && (
                                        <div className="char-profile-rel-desc mt-0.75 text-[11px] text-(--fd-text-muted) leading-normal">
                                          {r.description}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                                {rels.length === 0 && !isAdding && (
                                  <div className="char-profile-rel-empty text-[11px] text-(--fd-text-muted) py-1.5 italic">
                                    No relationships defined yet
                                  </div>
                                )}
                                {isAdding && (
                                  <InlineRelForm
                                    characterName={name}
                                    allCharacters={allCharacters}
                                    onSave={(rel) => {
                                      upsertCharacterRelationship(rel)
                                      setAddRelFor(null)
                                    }}
                                    onCancel={() => setAddRelFor(null)}
                                  />
                                )}
                              </div>
                            )
                          })()}

                          {/* Scene appearances (collapsed by default) */}
                          {stats && stats.scenes.length > 0 && (
                            <details className="my-1 char-profile-scenes-collapsible">
                              <summary className="char-profile-label char-profile-scenes-toggle cursor-pointer select-none text-(--fd-text-muted,#888) hover:text-(--fd-text)">
                                Appears in ({stats.scenes.length} scenes)
                              </summary>
                              <div className="flex flex-wrap gap-0.75 char-profile-scene-chips">
                                {stats.scenes.map((s, i) => (
                                  <span
                                    key={i}
                                    className="char-profile-scene-chip py-0.5 px-1.5 bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] text-[9px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-32 cursor-pointer hover:border-(--fd-accent) hover:text-(--fd-text)"
                                    onClick={() => handleNavigateToScene(s)}
                                    title={`Go to: ${s}`}
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* "Referred in Script" button at the bottom */}
          {unmatchedNames.length > 0 && (
            <button
              className="char-referred-btn m-2 mb-3 mt-2 p-2 bg-transparent border border-dashed border-(--fd-border) rounded text-(--fd-text-muted) text-xs cursor-pointer shrink-0 text-center transition-all duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent) hover:bg-[rgba(74,158,255,0.05)]"
              onClick={() => setShowReferred(true)}
            >
              Referred in Script ({unmatchedNames.length})
            </button>
          )}

          {/* Referred in Script overlay panel */}
          {showReferred && (
            <div className="char-referred-overlay absolute inset-0 z-2 bg-(--fd-navigator-bg) flex flex-col">
              <div className="flex flex-col flex-1 overflow-hidden char-referred-panel">
                <div className="char-referred-header flex items-center justify-between py-2.5 px-3 border-b border-(--fd-border) font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
                  <span>Referred in Script</span>
                  <button
                    className="char-profiles-close bg-transparent border-0 text-(--fd-text-muted) text-lg cursor-pointer px-1 leading-none hover:text-(--fd-text)"
                    onClick={() => setShowReferred(false)}
                  >
                    &times;
                  </button>
                </div>
                <div className="char-referred-desc py-2 px-3 text-[11px] text-(--fd-text-muted) border-b border-(--fd-border) leading-normal">
                  Names found in ALL CAPS in action lines that are not yet in
                  the character list.
                </div>
                <div className="flex-1 p-1.5 overflow-y-auto char-referred-list">
                  {unmatchedNames.map((name) => (
                    <div
                      key={name}
                      className="char-unmatched-row flex items-center justify-between py-1 px-2 rounded-[3px] hover:bg-(--fd-overlay-subtle)"
                    >
                      <span className="char-unmatched-name text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px]">
                        {name}
                      </span>
                      <button
                        className="char-unmatched-add py-0.5 px-2 bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-accent) text-[10px] cursor-pointer hover:bg-[rgba(74,158,255,0.1)] hover:border-(--fd-accent)"
                        onClick={() => handleAddUnmatched(name)}
                        title="Add to character list"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* End of profiles tab */}

      {/* Image Picker Overlay */}
      {imagePickerFor && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
          onClick={() => {
            setImagePickerFor(null)
            setImagePickerFilter('')
          }}
        >
          <div
            className="dialog-box char-image-picker-dialog bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col max-w-120 w-[90vw] max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header flex justify-between items-center px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              Select Image for {imagePickerFor}
              <button
                className="char-profiles-close bg-transparent border-0 text-(--fd-text-muted) text-lg cursor-pointer px-1 leading-none hover:text-(--fd-text)"
                onClick={() => {
                  setImagePickerFor(null)
                  setImagePickerFilter('')
                }}
              >
                &times;
              </button>
            </div>
            <div className="px-3 pt-2 pb-1 char-image-picker-search">
              <input
                type="text"
                placeholder="Filter by name..."
                value={imagePickerFilter}
                onChange={(e) => setImagePickerFilter(e.target.value)}
                className="char-profiles-search-input w-full h-7 bg-[#222] text-(--fd-text) border border-(--fd-border) rounded px-2 text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted)"
                autoFocus
              />
            </div>
            <div className="gap-2 char-image-picker-grid grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] px-3 pt-2 pb-3 max-h-100 overflow-y-auto">
              {imageAssets.length === 0 ? (
                <div className="char-profiles-empty py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal">
                  No image assets in this project. Upload images via the Asset
                  Manager or the Upload button on a character.
                </div>
              ) : (
                imageAssets
                  .filter(
                    (a) =>
                      !imagePickerFilter ||
                      a.original_name
                        .toLowerCase()
                        .includes(imagePickerFilter.toLowerCase()),
                  )
                  .map((asset) => {
                    const alreadyLinked = (
                      characterProfiles.find((p) => p.name === imagePickerFor)
                        ?.images || []
                    ).includes(asset.id)
                    return (
                      <div
                        key={asset.id}
                        className={`char-image-picker-item border-2 rounded overflow-hidden cursor-pointer transition-[border-color,opacity] duration-150 relative ${alreadyLinked ? 'linked opacity-50 cursor-default border-(--fd-border)' : 'border-(--fd-border) hover:border-(--fd-accent)'}`}
                        onClick={() =>
                          !alreadyLinked &&
                          handleAssociateAsset(imagePickerFor, asset.id)
                        }
                        title={
                          alreadyLinked
                            ? 'Already associated'
                            : `Associate ${asset.original_name}`
                        }
                      >
                        <img
                          className="block w-full h-20 object-cover"
                          src={getAssetUrl(asset.id)}
                          alt={asset.original_name}
                        />
                        <span className="char-image-picker-name block text-[9px] text-(--fd-text-muted) py-0.75 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                          {asset.original_name}
                        </span>
                        {alreadyLinked && (
                          <span className="char-image-picker-linked absolute top-0.5 right-0.5 bg-(--fd-accent) text-white text-[8px] py-px px-1 rounded-sm">
                            Linked
                          </span>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="dialog-overlay char-lightbox-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 h-(--vv-height,100dvh) flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] char-lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className="shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-md max-w-[90vw] max-h-[85vh]"
              src={lightboxImage.url}
              alt={lightboxImage.name}
            />
            <button
              className="-top-2 -right-2 absolute bg-black/80 hover:bg-[#e74c3c] border-0 rounded-full w-7 h-7 text-white text-base text-center leading-7 cursor-pointer char-lightbox-close"
              onClick={() => setLightboxImage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Per-character enlarge modal */}
      {modalChar && (
        <div
          className="z-9999 fixed inset-0 flex justify-center items-center bg-black/50 char-modal-overlay"
          onClick={() => setModalChar(null)}
        >
          <div
            className="char-modal-detail max-w-175 w-[90vw] max-h-[85vh] overflow-y-auto bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header flex justify-between items-center px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              {modalChar}
              <button
                className="char-profiles-close bg-transparent border-0 text-(--fd-text-muted) text-lg cursor-pointer px-1 leading-none hover:text-(--fd-text)"
                onClick={() => setModalChar(null)}
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4 char-modal-body">
              {renderCharacterFields(modalChar, true)}
            </div>
          </div>
        </div>
      )}

      {pendingRemoveChar && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
          onClick={() => setPendingRemoveChar(null)}
        >
          <div
            className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-80 max-w-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              Remove Character
            </div>
            <div className="flex-1 p-5 overflow-y-auto dialog-body">
              <p style={{ margin: 0 }}>
                Remove &ldquo;{pendingRemoveChar}&rdquo; from the character
                list?
              </p>
            </div>
            <div className="dialog-actions flex justify-end gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
              <button
                className="h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-menu-hover)"
                onClick={() => setPendingRemoveChar(null)}
              >
                Cancel
              </button>
              <button
                className="dialog-primary h-8.5 px-4.5 border rounded cursor-pointer text-sm bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                style={{ background: '#c0392b' }}
                onClick={() => {
                  deleteCharacterProfile(pendingRemoveChar)
                  setPendingRemoveChar(null)
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CharacterProfiles
