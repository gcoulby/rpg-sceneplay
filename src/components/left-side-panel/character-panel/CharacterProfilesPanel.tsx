import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  useEditorStore,
  type CharacterProfile,
  type CharacterRelationship,
} from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useAssetStore } from '@/stores/assetStore'
import { addAssetFile, listAssets, useAssetUrls } from '@/storage/assetStore'
import { characterKey, singleLine } from '@/utils/open-draft/nodeText'
import { showToast } from '@/actions/show-toast'
import { useDocVersion } from '../utils/useDocVersion'
import { DEFAULT_HIGHLIGHT_COLORS } from './characterConstants'
import { getEmptyProfile } from './characterUtils'
import CharacterListToolbar, {
  type CharacterSortBy,
} from './CharacterListToolbar'
import CharacterCard from './CharacterCard'
import ReferredInScriptPanel from './ReferredInScriptPanel'
import RemoveCharacterDialog from './RemoveCharacterDialog'
import NewCharacterDialog from './NewCharacterDialog'
import ImagePickerDialog from './ImagePickerDialog'
import ImageLightboxDialog from './ImageLightboxDialog'
import CharacterDetailDialog from './CharacterDetailDialog'
import { RelationshipMap } from './RelationshipMap'
import { deleteCharacterCascade } from '@/components/screens/character-sheets/store/sheetLinking'
import { openCharacterSheet } from '@/components/screens/character-sheets/store/openCharacterSheet'
import * as ActivityPanel from '@/components/ui/activity-panel'
interface CharacterProfilesPanelProps {
  editor: Editor | null
  projectId: string | null
}

const CharacterProfilesPanel: React.FC<CharacterProfilesPanelProps> = ({
  editor,
  projectId,
}) => {
  const {
    characters,
    characterProfiles,
    upsertCharacterProfile,
    characterRelationships,
    upsertCharacterRelationship,
    deleteCharacterRelationship,
    selectedCharacter,
    setSelectedCharacter,
  } = useEditorStore()

  const currentScriptId = useProjectStore((s) => s.currentDocId)
  const { assets, setAssets } = useAssetStore()

  const [activeTab, setActiveTab] = useState<'profiles' | 'map'>('profiles')
  const [expandedChar, setExpandedChar] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showReferred, setShowReferred] = useState(false)
  const sortBy = useEditorStore((s) => s.characterSortBy)
  const setSortBy = useEditorStore((s) => s.setCharacterSortBy)
  const [pendingRemoveChar, setPendingRemoveChar] = useState<string | null>(
    null,
  )
  const [newCharacterOpen, setNewCharacterOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [modalChar, setModalChar] = useState<string | null>(null)

  const [imagePickerFor, setImagePickerFor] = useState<string | null>(null)
  const [imagePickerFilter, setImagePickerFilter] = useState('')
  const [lightboxImage, setLightboxImage] = useState<{
    url: string
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const docVersion = useDocVersion(editor)

  const fetchAssets = useCallback(async () => {
    if (!projectId) return
    try {
      const list = await listAssets(projectId)
      setAssets(list)
    } catch (err) {
      console.warn('Failed to fetch assets:', err)
    }
  }, [projectId, setAssets])

  useEffect(() => {
    if (imagePickerFor && projectId) fetchAssets()
  }, [imagePickerFor, projectId, fetchAssets])

  useEffect(() => {
    if (!selectedCharacter) return
    const name = selectedCharacter
    const t = setTimeout(() => {
      setExpandedChar(name)
      setSelectedCharacter(null)
      const card = document.querySelector(`[data-char-name="${name}"]`)
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
    return () => clearTimeout(t)
  }, [selectedCharacter, setSelectedCharacter])

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

  const handleBuildFromScript = useCallback(() => {
    if (!editor) return
    const doc = editor.state.doc

    const names = new Set<string>()
    doc.descendants((node) => {
      if (node.type.name === 'character') {
        const base = characterKey(node.textContent)
        if (base) names.add(base)
      }
      return true
    })

    const descriptions = new Map<string, string>()
    const ages = new Map<string, string>()

    for (const charName of names) {
      const existing = characterProfiles.find((p) => p.name === charName)
      if (existing?.description) continue

      let found = false
      doc.descendants((node) => {
        if (found) return false
        if (node.type.name !== 'action') return true
        const text = node.textContent
        const idx = text.indexOf(charName)
        if (idx === -1) return true

        const before = idx > 0 ? text[idx - 1] : ' '
        const after =
          idx + charName.length < text.length
            ? text[idx + charName.length]
            : ' '
        if (/[a-zA-Z]/.test(before) || /[a-z]/.test(after)) return true

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
          const afterName = text.slice(
            idx + charName.length,
            idx + charName.length + 60,
          )
          const ageMatch = afterName.match(/\(?(\d{1,2}0?s?|\d{1,2})\)?[,\s]/)
          if (ageMatch) ages.set(charName, ageMatch[1])
        }

        found = true
        return false
      })
    }

    for (const prof of characterProfiles) {
      if (!names.has(prof.name)) deleteCharacterCascade(prof.name)
    }

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
      if (desc && !existing?.description) updates.description = desc
      const age = ages.get(charName)
      if (age && !existing?.age) updates.age = age

      if (Object.keys(updates).length > 0)
        upsertCharacterProfile(charName, updates)
    }
  }, [editor, characterProfiles, upsertCharacterProfile])

  interface CharStats {
    dialogueCount: number
    sceneCount: number
    scenes: string[]
    appearanceOrder: number
  }
  const charStats = useMemo((): Map<string, CharStats> => {
    void docVersion
    if (!editor) return new Map()
    const stats = new Map<
      string,
      { dialogueCount: number; scenes: Set<string>; appearanceOrder: number }
    >()

    let currentScene = ''
    let currentChar = ''
    let orderCounter = 0
    editor.state.doc.descendants((node) => {
      if (node.type.name === 'sceneHeading')
        currentScene = singleLine(node.textContent)
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
  }, [editor, docVersion])

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

  const handleNavigateToScene = useCallback(
    (sceneText: string) => {
      if (!editor) return
      let targetPos: number | null = null

      editor.state.doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (
          node.type.name === 'sceneHeading' &&
          singleLine(node.textContent) === sceneText
        ) {
          targetPos = pos + 1
          return false
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

  const unmatchedNames = useMemo(() => {
    void docVersion
    if (!editor) return []
    const known = new Set<string>()
    for (const c of characters) known.add(c.toUpperCase())
    for (const p of characterProfiles) known.add(p.name)

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
      const regex = /\b([A-Z][A-Z.'\- ]{1,30}[A-Z])\b/g
      let match
      while ((match = regex.exec(text)) !== null) {
        const candidate = match[1].trim()
        if (candidate.length < 2) continue
        const words = candidate.split(/\s+/)
        if (words.every((w) => EXCLUDE.has(w.replace(/[.']/g, '')))) continue
        if (known.has(candidate)) continue
        found.add(candidate)
      }
      return true
    })

    return Array.from(found).sort()
  }, [editor, docVersion, characters, characterProfiles])

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

  const scriptCharacterNames = useMemo(() => {
    void docVersion
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
  }, [editor, docVersion])

  const orphanedNames = useMemo(() => {
    return new Set(
      characterProfiles
        .filter((p) => !scriptCharacterNames.has(p.name))
        .map((p) => p.name),
    )
  }, [characterProfiles, scriptCharacterNames])

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

    const isPlayer = (name: string) =>
      characterProfiles.find((p) => p.name === name)?.role === 'Player'

    list.sort((a, b) => {
      const aPlayer = isPlayer(a)
      const bPlayer = isPlayer(b)
      if (aPlayer !== bPlayer) return aPlayer ? -1 : 1

      const sa = charStats.get(a)
      const sb = charStats.get(b)
      switch (sortBy) {
        case 'name':
          return a.localeCompare(b)
        case 'importance':
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
      return existing || getEmptyProfile(name)
    },
    [characterProfiles],
  )

  const imageAssets = useMemo(
    () => assets.filter((a) => a.mime_type.startsWith('image/')),
    [assets],
  )

  // Every asset id this panel can display — the ids on profile portraits plus
  // everything offered by the image picker — resolved to object URLs for as long
  // as the panel is mounted (see assetStore's lifecycle note).
  const displayableAssetIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...characterProfiles
            .flatMap((p) => p.images || [])
            .filter(
              (img): img is string =>
                typeof img === 'string' && !img.startsWith('data:'),
            ),
          ...imageAssets.map((a) => a.id),
        ]),
      ),
    [characterProfiles, imageAssets],
  )
  const assetUrls = useAssetUrls(displayableAssetIds)
  const getAssetUrl = useCallback(
    (image: string) => {
      if (image.startsWith('data:')) return image
      return assetUrls[image] || ''
    },
    [assetUrls],
  )

  const handleUploadImage = useCallback(
    async (charName: string, file: File) => {
      setUploading(true)
      try {
        let imageValue: string
        if (projectId) {
          const stored = await addAssetFile(file, {
            docId: projectId,
            tags: [`character:${charName}`],
          })
          imageValue = stored.id
          await fetchAssets()
        } else {
          // No document id yet — embed the image directly, the same fallback
          // TitlePageEditor uses.
          imageValue = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
          })
        }
        const profile = characterProfiles.find((p) => p.name === charName)
        const currentImages = profile?.images || []
        upsertCharacterProfile(charName, {
          images: [...currentImages, imageValue],
        })
        showToast({ description: 'Image added', type: 'success' })
      } catch (err) {
        showToast({
          description: `Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          type: 'error',
        })
      } finally {
        setUploading(false)
      }
    },
    [projectId, characterProfiles, upsertCharacterProfile, fetchAssets],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      const charName = uploadTargetRef.current
      if (file && charName) handleUploadImage(charName, file)
      e.target.value = ''
    },
    [handleUploadImage],
  )

  const handleTriggerUpload = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const charName = e.currentTarget.dataset.charName
      if (!charName) return
      uploadTargetRef.current = charName
      fileInputRef.current?.click()
    },
    [],
  )

  const makeUpdateProfile = useCallback(
    (charName: string) => (updates: Partial<Omit<CharacterProfile, 'name'>>) =>
      upsertCharacterProfile(charName, updates),
    [upsertCharacterProfile],
  )

  const handleSaveRelationship = useCallback(
    (rel: CharacterRelationship) => upsertCharacterRelationship(rel),
    [upsertCharacterRelationship],
  )

  const relationshipsFor = useCallback(
    (nameUpper: string) =>
      characterRelationships.filter(
        (r) => r.characterA === nameUpper || r.characterB === nameUpper,
      ),
    [characterRelationships],
  )

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-background flex flex-col overflow-hidden'
          : 'w-full h-full bg-background flex flex-col overflow-hidden relative'
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <ActivityPanel.Shell>
        <ActivityPanel.Header>
          <ActivityPanel.Title>Characters</ActivityPanel.Title>
          <ActivityPanel.Meta>{allCharacters.length}</ActivityPanel.Meta>
          <ActivityPanel.Interactions>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted)"
              onClick={() => setIsFullscreen((v) => !v)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          </ActivityPanel.Interactions>
        </ActivityPanel.Header>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'profiles' | 'map')}
          className="flex flex-col flex-1 min-h-0"
        >
          <ActivityPanel.SubHeader>
            <TabsList className="w-full shrink-0 rounded-none border-b border-(--fd-border) bg-transparent h-auto p-0">
              <TabsTrigger
                value="profiles"
                className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
              >
                Profiles
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
              >
                Relationship Map
              </TabsTrigger>
            </TabsList>
          </ActivityPanel.SubHeader>
          <ActivityPanel.Content headerOffset="5dvh">
            <TabsContent
              value="map"
              className="flex flex-col flex-1 mt-0 h-full min-h-0"
            >
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
            </TabsContent>

            <TabsContent
              value="profiles"
              className="relative flex flex-col flex-1 mt-0 min-h-0"
            >
              <CharacterListToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onBuildFromScript={handleBuildFromScript}
                onNewCharacter={() => setNewCharacterOpen(true)}
                sortBy={sortBy as CharacterSortBy}
                onSortByChange={setSortBy}
              />

              <div className="flex-1 p-1.5 overflow-y-auto">
                {allCharacters.length === 0 ? (
                  <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal">
                    {searchQuery
                      ? 'No characters match your search.'
                      : 'No characters detected. Add character elements to your screenplay.'}
                  </div>
                ) : (
                  allCharacters.map((name) => {
                    const profile = getProfile(name)
                    const stats = charStats.get(name)
                    const isExpanded = isFullscreen || expandedChar === name
                    return (
                      <CharacterCard
                        key={name}
                        name={name}
                        profile={profile}
                        stats={stats}
                        isExpanded={isExpanded}
                        isOrphaned={orphanedNames.has(name)}
                        allCharacters={allCharacters}
                        relationships={relationshipsFor(name.toUpperCase())}
                        projectId={projectId}
                        uploading={uploading}
                        getAssetUrl={getAssetUrl}
                        onToggleExpand={() =>
                          setExpandedChar(isExpanded ? null : name)
                        }
                        onNavigateToCharacter={() =>
                          handleNavigateToCharacter(name)
                        }
                        onNavigateToScene={handleNavigateToScene}
                        onEnlarge={() => setModalChar(name)}
                        onRemoveRequest={() => setPendingRemoveChar(name)}
                        onUpdateProfile={makeUpdateProfile(name)}
                        onSaveRelationship={handleSaveRelationship}
                        onDeleteRelationship={deleteCharacterRelationship}
                        onOpenLightbox={(url, imgName) =>
                          setLightboxImage({ url, name: imgName })
                        }
                        onTriggerUpload={handleTriggerUpload}
                        onPickFromAssets={() => {
                          setImagePickerFor(name)
                          setImagePickerFilter('')
                        }}
                        onOpenSheet={() => openCharacterSheet(name)}
                      />
                    )
                  })
                )}
              </div>

              {unmatchedNames.length > 0 && (
                <Button
                  variant="outline"
                  className="m-2 mb-3 mt-2 h-auto p-2 border-dashed text-(--fd-text-muted) text-xs shrink-0"
                  onClick={() => setShowReferred(true)}
                >
                  Referred in Script ({unmatchedNames.length})
                </Button>
              )}

              {showReferred && (
                <ReferredInScriptPanel
                  names={unmatchedNames}
                  onAdd={handleAddUnmatched}
                  onClose={() => setShowReferred(false)}
                />
              )}
            </TabsContent>
          </ActivityPanel.Content>
        </Tabs>
      </ActivityPanel.Shell>

      <ImagePickerDialog
        characterName={imagePickerFor}
        filter={imagePickerFilter}
        onFilterChange={setImagePickerFilter}
        images={imageAssets}
        linkedAssetIds={
          (imagePickerFor &&
            characterProfiles.find((p) => p.name === imagePickerFor)?.images) ||
          []
        }
        getAssetUrl={getAssetUrl}
        onSelect={(assetId) => {
          if (!imagePickerFor) return
          const profile = characterProfiles.find(
            (p) => p.name === imagePickerFor,
          )
          const currentImages = profile?.images || []
          if (!currentImages.includes(assetId)) {
            upsertCharacterProfile(imagePickerFor, {
              images: [...currentImages, assetId],
            })
          }
          setImagePickerFor(null)
          setImagePickerFilter('')
        }}
        onOpenChange={(open) => {
          if (!open) {
            setImagePickerFor(null)
            setImagePickerFilter('')
          }
        }}
      />

      <ImageLightboxDialog
        image={lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      />

      <CharacterDetailDialog
        charName={modalChar}
        profile={modalChar ? getProfile(modalChar) : null}
        stats={modalChar ? charStats.get(modalChar) : undefined}
        allCharacters={allCharacters}
        relationships={
          modalChar ? relationshipsFor(modalChar.toUpperCase()) : []
        }
        projectId={projectId}
        uploading={uploading}
        getAssetUrl={getAssetUrl}
        onUpdateProfile={modalChar ? makeUpdateProfile(modalChar) : () => {}}
        onSaveRelationship={handleSaveRelationship}
        onDeleteRelationship={deleteCharacterRelationship}
        onNavigateToScene={handleNavigateToScene}
        onOpenLightbox={(url, imgName) =>
          setLightboxImage({ url, name: imgName })
        }
        onTriggerUpload={handleTriggerUpload}
        onPickFromAssets={() => {
          if (!modalChar) return
          setImagePickerFor(modalChar)
          setImagePickerFilter('')
        }}
        onOpenChange={(open) => !open && setModalChar(null)}
      />

      <RemoveCharacterDialog
        characterName={pendingRemoveChar}
        onOpenChange={(open) => !open && setPendingRemoveChar(null)}
        onConfirm={() => {
          if (!pendingRemoveChar) return
          deleteCharacterCascade(pendingRemoveChar)
          setPendingRemoveChar(null)
        }}
      />

      <NewCharacterDialog
        open={newCharacterOpen}
        onOpenChange={setNewCharacterOpen}
        existingNames={allCharacters}
        onCreate={(name) => {
          const colorIdx = characterProfiles.length % DEFAULT_HIGHLIGHT_COLORS.length
          upsertCharacterProfile(name, {
            color: DEFAULT_HIGHLIGHT_COLORS[colorIdx],
          })
          setExpandedChar(name)
        }}
      />
    </div>
  )
}

export default CharacterProfilesPanel
