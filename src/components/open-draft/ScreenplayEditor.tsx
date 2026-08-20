import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import {
  ScreenplayHardBreak,
  HardBreakLeafText,
} from "@/editor/extensions/ScreenplayHardBreak";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import History from "@tiptap/extension-history";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

import {
  SceneHeading,
  Action,
  Character,
  Dialogue,
  Parenthetical,
  Transition,
  General,
  Shot,
  NewAct,
  EndOfAct,
  Lyrics,
  ShowEpisode,
  CastList,
  FontSize,
  ScriptNoteMark,
  RollAnchorNode,
  TagMark,
  ItemMark,
  FormatOverride,
  CustomElement,
  DualDialogue,
  DualDialogueColumn,
  TitlePage,
  AvBlock,
  AvRow,
  AvCell,
  AvPara,
  AvShot,
  AvDirection,
  AvKeymap,
} from "@/editor/extensions";
import { registerAvCellPicker } from "@/editor/extensions/AvBlock";
import Strike from "@tiptap/extension-strike";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Highlight from "@tiptap/extension-highlight";
import { useFormattingTemplateStore } from "@/stores/formattingTemplateStore";
import { useMapStore } from "@/components/screens/map/useMapStore";
import type { ProjectMap, MapRef } from "@/components/screens/map/types";
import { useSheetStore } from "@/components/screens/character-sheets/store/useSheetStore";
import type { CharacterSheet } from "@/components/screens/character-sheets/types";
import {
  generateTemplateCss,
  injectTemplateCss,
} from "@/utils/open-draft/templateCss";
import { docHasAnyText } from "@/utils/open-draft/docText";
import {
  getCurrentElementRule,
  getLockedFormatting,
} from "@/utils/open-draft/effectiveFormatting";
import { createPaginationPlugin, getPageMetrics } from "@/editor/pagination";
import { createContdCasePlugin } from "@/editor/contdCase";
import { ScreenplayImage } from "@/editor/extensions/ScreenplayImage";
import {
  insertImageNode,
  buildImageAttrs,
} from "@/utils/open-draft/insertImage";

import {
  useEditorStore,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_FOOTER_CONTENT,
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_TAG_CATEGORIES,
  resolveMoresContds,
} from "@/stores/editorStore";
import type { ElementType } from "@/stores/editorStore";
import { useRollNoteStore } from "@/stores/rollNoteStore";
import type { RollNote } from "@/oracles/rollTypes";
import { usePdfViewerStore } from "@/components/screens/pdf-viewer/store/usePdfViewerStore";
import type {
  PdfEmbed,
  PdfAnnotation,
  PdfFormFieldValue,
} from "@/components/screens/pdf-viewer/types";
import { useOracleStore } from "@/stores/oracleStore";
import type {
  OracleSource,
  OracleCollection,
  OracleCombo,
} from "@/oracles/types";
import { useActivityBarStore } from "@/stores/activity-bar-store";
import FormatPanel from "./FormatPanel";
import ElementPicker from "./ElementPicker";
import CharacterAutocomplete from "./CharacterAutocomplete";
import ScriptContextMenu from "./ScriptContextMenu";
import {
  SpellCheck,
  spellCheckPluginKey,
} from "@/editor/extensions/SpellCheck";
import { Grammar, grammarPluginKey } from "@/editor/extensions/Grammar";
import { spellChecker, BUILTIN_LANGUAGE } from "@/editor/spellchecker";
import { grammarIgnore } from "@/editor/grammar/grammarIgnore";
import {
  buildSaveContent as buildSaveContentShared,
  stripSaveMetadata,
} from "@/storage/saveContent";
import { characterKey, parseSceneHeading } from "@/utils/open-draft/nodeText";
import { getSlugSuggestionContext } from "@/utils/open-draft/sluglineSuggestions";
import { computeContdChanges, type ContdBlock } from "@/editor/contdAuto";
import {
  runRetext,
  RETEXT_CATEGORIES,
  type RetextCategory,
} from "@/editor/grammar/retextProvider";
import { runHarper } from "@/editor/grammar/harperProvider";
import { clearEditorHistory } from "@/editor/clearHistory";
import { useProjectStore } from "@/stores/projectStore";
import type { StorageDoc } from "@/storage/types";
import {
  restoreStorageOnBoot,
  getActiveMode,
  saveActiveDoc,
  loadActiveDoc,
  switchModeKeepingDoc,
  getLastActiveDocId,
} from "@/storage/storageManager";
import type { StorageMode } from "@/storage/types";
import { buildStorageDoc as buildStorageDocFromEditor } from "@/storage/buildStorageDoc";
import { diskHandleProvider } from "@/storage/providers/diskHandleProvider";
import { useStorageAutoSave } from "@/storage/useStorageAutoSave";
import StorageModeDialog from "@/storage/StorageModeDialog";
import { openBinaryFile } from "@/storage/fileOps";
import { unpackAssets } from "@/storage/assetStore";
import { useBrowserStorageStatusStore } from "@/stores/browserStorageStatusStore";
import { showToast } from "@/actions/show-toast";
import AssetManager from "./AssetManager";
import WelcomeDialog, { type WelcomeChoice } from "./WelcomeDialog";
import { parseFountain } from "@/utils/open-draft/fountainParser";
import { parseFDXFull } from "@/utils/open-draft/fdxParser";
import {
  parseOdraft,
  downloadOdraft,
  parseSceneplayAny,
  isSceneplayFile,
} from "@/storage/formats/sceneplayFormat";
import { hydrateEditorStoresFromContent } from "@/storage/hydrateStores";
import { stashSessionDoc, takeSessionDoc } from "@/utils/open-draft/sessionDoc";
import { useIsTouchDevice, usePinchZoom } from "@/hooks/useTouch";
import { pluginRegistry } from "@/plugins/registry";
import {
  createTrackChangesPlugin,
  trackChangesPluginKey,
} from "@/editor/trackChanges";

//replacements
import { createSearchPlugin } from "@/components/plugins/search-replace/search-replace-plugin";
import { useGoToPage } from "@/components/plugins/goto-page/useGotoPage";

// Default next element type when pressing Enter
const DEFAULT_NEXT_TYPE: Record<string, string> = {
  sceneHeading: "action",
  action: "action",
  character: "dialogue",
  dialogue: "dialogue",
  parenthetical: "dialogue",
  transition: "sceneHeading",
  general: "general",
  shot: "action",
  newAct: "sceneHeading",
  endOfAct: "newAct",
  lyrics: "lyrics",
  showEpisode: "action",
  castList: "castList",
};

const ALL_ELEMENT_TYPES: ElementType[] = [
  "sceneHeading",
  "action",
  "character",
  "dialogue",
  "parenthetical",
  "transition",
  "general",
  "shot",
  "newAct",
  "endOfAct",
  "lyrics",
  "showEpisode",
  "castList",
];

const SAMPLE_CONTENT = {
  type: "doc",
  content: [
    {
      type: "sceneHeading",
      content: [{ type: "text", text: "INT. COFFEE SHOP - DAY" }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "A busy coffee shop in downtown Los Angeles. Patrons sit at small tables, laptops open, headphones on. The hiss of the espresso machine punctuates the low murmur of conversation. A BARISTA calls out orders while steam curls from ceramic cups.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "SARAH CHEN (30s, sharp eyes, worn leather jacket) sits alone at a corner table, nursing a cold coffee. She stares at her phone, waiting. Her leg bounces under the table — the only outward sign of the tension coiled inside her.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    {
      type: "parenthetical",
      content: [{ type: "text", text: "(under her breath)" }],
    },
    {
      type: "dialogue",
      content: [{ type: "text", text: "Come on... pick up." }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "The door SWINGS open. MARCUS WEBB (40s, rumpled suit, easy smile that hides something harder) enters, shaking rain off his umbrella. He spots Sarah and heads her way, weaving between tables with practiced ease.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "MARCUS" }] },
    {
      type: "dialogue",
      content: [
        {
          type: "text",
          text: "You know, most people just text when they want to meet.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    {
      type: "dialogue",
      content: [{ type: "text", text: "Most people aren't being followed." }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Marcus's smile fades. He sits down across from her, leaning in close. The ambient noise of the coffee shop seems to recede, leaving them in their own bubble of urgency.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "MARCUS" }] },
    { type: "parenthetical", content: [{ type: "text", text: "(low)" }] },
    {
      type: "dialogue",
      content: [
        { type: "text", text: "Tell me everything. From the beginning." },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    {
      type: "dialogue",
      content: [
        {
          type: "text",
          text: "Three weeks ago I found a file on Reeves' server. Something called NIGHTFALL. It had names, dates, bank accounts — everything. The next day, my access was revoked and someone broke into my apartment.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "MARCUS" }] },
    {
      type: "dialogue",
      content: [{ type: "text", text: "Did you make a copy?" }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Sarah reaches into her jacket and slides a USB drive across the table. Marcus stares at it like it might explode.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    {
      type: "dialogue",
      content: [
        {
          type: "text",
          text: "That's the only copy. Guard it with your life. I mean that literally.",
        },
      ],
    },
    { type: "transition", content: [{ type: "text", text: "CUT TO:" }] },
    {
      type: "sceneHeading",
      content: [{ type: "text", text: "EXT. CITY STREET - NIGHT" }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Rain slicks the pavement, reflecting neon signs in shattered patterns. Sarah walks quickly, collar up, glancing over her shoulder every few steps. The city feels hostile — every shadow a threat, every passing car a potential tail.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "She turns down an alley. Stops. Listens. Nothing but the patter of rain on dumpsters and the distant wail of a siren. She exhales, allows herself a moment of relief.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Then: FOOTSTEPS. Behind her. Measured. Deliberate.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Sarah doesn't run. She turns slowly, hands loose at her sides, ready.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "A FIGURE emerges from the shadows. Tall, broad-shouldered, face hidden under a dark hood. He stops ten feet away.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "HOODED FIGURE" }] },
    {
      type: "dialogue",
      content: [
        { type: "text", text: "You should have left it alone, Sarah." },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    {
      type: "dialogue",
      content: [{ type: "text", text: "I tried. Your boss wouldn't let me." }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "The figure takes a step forward. Sarah holds her ground. Rain streams down her face, but her eyes are steady, defiant.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "HOODED FIGURE" }] },
    {
      type: "dialogue",
      content: [
        {
          type: "text",
          text: "Give me the drive and you walk away. That's the deal. Only deal you're going to get.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "SARAH" }] },
    { type: "parenthetical", content: [{ type: "text", text: "(smiling)" }] },
    {
      type: "dialogue",
      content: [{ type: "text", text: "I don't have it anymore." }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "The figure's posture shifts. Anger, barely contained.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "HOODED FIGURE" }] },
    {
      type: "dialogue",
      content: [{ type: "text", text: "Then we have a problem." }],
    },
    { type: "transition", content: [{ type: "text", text: "SMASH CUT TO:" }] },
    {
      type: "sceneHeading",
      content: [{ type: "text", text: "INT. MARCUS' APARTMENT - NIGHT" }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "A small, cluttered studio. Stacks of newspapers, half-eaten takeout containers, a wall covered in pinned photos and red string. Marcus sits at his desk, the USB drive plugged into his laptop.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "His eyes widen as he scrolls through the files. Page after page of financial records, offshore accounts, wire transfers. Names he recognizes — senators, CEOs, a Supreme Court justice.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "MARCUS" }] },
    { type: "parenthetical", content: [{ type: "text", text: "(whispered)" }] },
    { type: "dialogue", content: [{ type: "text", text: "Holy shit." }] },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: 'His phone BUZZES. A text from an unknown number: "CHECK YOUR DOOR."',
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Marcus freezes. Slowly turns toward his front door. Through the peephole: nothing but the empty hallway. But on his doormat — a manila envelope.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "He opens it with trembling hands. Inside: a single photograph of Sarah, taken from above, a red X drawn across her face.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Marcus grabs his phone, dials Sarah. It rings. And rings. And rings.",
        },
      ],
    },
    { type: "character", content: [{ type: "text", text: "MARCUS" }] },
    {
      type: "parenthetical",
      content: [{ type: "text", text: "(into phone, desperate)" }],
    },
    {
      type: "dialogue",
      content: [{ type: "text", text: "Pick up, Sarah. Pick up..." }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "No answer. Marcus stares at the photograph, then at the laptop screen full of secrets. He makes a decision.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "He copies the files to a second drive, tapes it under his desk drawer, grabs his coat and the original drive, and heads for the door.",
        },
      ],
    },
    { type: "transition", content: [{ type: "text", text: "CUT TO:" }] },
    {
      type: "sceneHeading",
      content: [{ type: "text", text: "EXT. CITY STREET - CONTINUOUS" }],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Marcus bursts out of his building into the rain. He looks left, right — the street is deserted. He starts walking fast, then running.",
        },
      ],
    },
    {
      type: "action",
      content: [
        {
          type: "text",
          text: "Behind him, a black sedan pulls away from the curb. Its headlights stay off.",
        },
      ],
    },
  ],
};

interface OverlayInfo {
  top: number;
  pageNumber: number;
  isDialogueSplit: boolean;
  characterName: string;
  isTitlePage: boolean;
}

/** Resolve dynamic field placeholders in header/footer text */
function resolveHFFields(
  text: string,
  pageNum: number,
  totalPages: number,
  title: string,
  revisionColor: string,
): string {
  if (!text) return "";
  return text
    .replace(/\{page\}/gi, String(pageNum))
    .replace(/\{pages\}/gi, String(totalPages))
    .replace(/\{title\}/gi, title)
    .replace(/\{date\}/gi, new Date().toLocaleDateString())
    .replace(/\{revision\}/gi, revisionColor);
}

const ScreenplayEditor: React.FC = () => {
  const {
    setActiveElement,
    setScenes,
    setPageCount,
    setCurrentPage,
    zoomLevel,
    setZoomLevel,
    viewMode,
    fontFamily,
    fontSize,
    pageLayout,
    tagsVisible,
    itemsVisible,
    notesVisible,
    spellCheckEnabled,
    grammarCheckEnabled,
    setDocumentTitle,
    sceneNumbersVisible,
    sceneNumbersLocked,
    saveStatus,
    saveError,
    setSaveStatus,
  } = useEditorStore();

  const { currentDocId, setCurrentDocId } = useProjectStore();

  // Bumped to force TipTap to recreate the editor instance.
  const [editorKey] = useState(0);

  const editorMainRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const setPageCountRef = useRef(setPageCount);
  setPageCountRef.current = setPageCount;
  const pageLayoutRef = useRef(pageLayout);
  pageLayoutRef.current = pageLayout;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  // ── Touch gestures (must be after editorMainRef) ──
  const isTouch = useIsTouchDevice();
  usePinchZoom(editorMainRef, {
    currentZoom: zoomLevel,
    onZoomChange: setZoomLevel,
    enabled: isTouch,
  });

  // 3-finger touch opens context menu on touch devices
  useEffect(() => {
    if (!isTouch) return;
    const handleThreeFingerTouch = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        e.preventDefault();
        // Use center of the three touches as position
        let cx = 0,
          cy = 0;
        for (let i = 0; i < 3; i++) {
          cx += e.touches[i].clientX;
          cy += e.touches[i].clientY;
        }
        cx /= 3;
        cy /= 3;
        setCtxMenuState({
          visible: true,
          position: { x: cx, y: cy },
          spellInfo: null,
          grammarInfo: null,
        });
      }
    };
    document.addEventListener("touchstart", handleThreeFingerTouch, {
      passive: false,
    });
    return () =>
      document.removeEventListener("touchstart", handleThreeFingerTouch);
  }, [isTouch]);

  const zoomLevelRef = useRef(zoomLevel);
  // Preserve scroll position when zoom changes: content scales but scrollTop
  // is in viewport pixels, so without an adjustment the user lands on a
  // completely different page after each zoom step.
  const prevZoomRef = useRef(zoomLevel);
  useEffect(() => {
    const el = editorMainRef.current;
    if (!el) {
      prevZoomRef.current = zoomLevel;
      return;
    }
    const oldScale = (prevZoomRef.current || 100) / 100;
    const newScale = (zoomLevel || 100) / 100;
    if (oldScale !== newScale && el.scrollTop > 0) {
      el.scrollTop = el.scrollTop * (newScale / oldScale);
    }
    prevZoomRef.current = zoomLevel;
  }, [zoomLevel]);
  zoomLevelRef.current = zoomLevel;

  const [overlays, setOverlays] = useState<OverlayInfo[]>([]);

  // Auto-fit page to viewport on mobile/tablet
  const autoZoomApplied = useRef(false);
  useEffect(() => {
    const handleAutoZoom = () => {
      if (window.innerWidth <= 768 && editorMainRef.current) {
        const containerWidth = editorMainRef.current.clientWidth - 16; // small padding
        const pageWidthPx = pageLayout.pageWidth * 96; // 1in = 96px
        const fitZoom = Math.floor((containerWidth / pageWidthPx) * 100);
        setZoomLevel(Math.max(50, Math.min(100, fitZoom)));
        autoZoomApplied.current = true;
      } else if (autoZoomApplied.current && window.innerWidth > 768) {
        setZoomLevel(100);
        autoZoomApplied.current = false;
      }
    };
    // Delay initial call to ensure editorMainRef is measured
    const timer = setTimeout(handleAutoZoom, 100);
    window.addEventListener("resize", handleAutoZoom);
    window.addEventListener("orientationchange", handleAutoZoom);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleAutoZoom);
      window.removeEventListener("orientationchange", handleAutoZoom);
    };
  }, [pageLayout.pageWidth, setZoomLevel]);

  // Welcome dialog — show on first visit
  const [showWelcome, setShowWelcome] = useState(
    () => !localStorage.getItem("opendraft:welcomed"),
  );

  // First-run storage picker. Shown in place of the welcome dialog until a mode
  // is chosen — where the work is kept has to be settled before there is
  // anything to keep.
  const [showStorageModes, setShowStorageModes] = useState(false);

  // ── Drag-and-drop file import state ──
  const [dragOverEditor, setDragOverEditor] = useState(false);
  const [pendingDropFile, setPendingDropFile] = useState<File | null>(null);
  const [dropConfirmOpen, setDropConfirmOpen] = useState(false);

  // Element picker state. `availableTypes`, when set, restricts the picker
  // to that exact list (used inside AV cells where only avPara/avShot/avDirection apply).
  const [pickerState, setPickerState] = useState<{
    visible: boolean;
    position: { top: number; left: number };
    defaultType: ElementType;
    availableTypes?: ElementType[];
  }>({ visible: false, position: { top: 0, left: 0 }, defaultType: "action" });

  const showPickerRef = useRef<
    (defaultType: ElementType, availableTypes?: ElementType[]) => void
  >(() => {});

  // Character autocomplete state
  const [knownCharacters, setKnownCharacters] = useState<string[]>([]);
  const [charAutoState, setCharAutoState] = useState<{
    visible: boolean;
    position: { top: number; left: number };
    suggestions: string[];
  }>({ visible: false, position: { top: 0, left: 0 }, suggestions: [] });
  const charAutoDismissedRef = useRef(false);

  // Slugline autocomplete state (INT./EXT..., then known locations, then
  // time of day) — mirrors character autocomplete above, except each stage
  // replaces only the fragment currently being typed rather than the whole
  // line, so `slugSegmentRef` tracks that fragment's doc-position range
  // alongside the suggestion list shown for it.
  const [knownLocations, setKnownLocations] = useState<string[]>([]);
  const [slugAutoState, setSlugAutoState] = useState<{
    visible: boolean;
    position: { top: number; left: number };
    suggestions: string[];
  }>({ visible: false, position: { top: 0, left: 0 }, suggestions: [] });
  const slugAutoDismissedRef = useRef(false);
  const slugSegmentRef = useRef<{ from: number; to: number } | null>(null);

  const [formatPanelOpen, setFormatPanelOpen] = useState(false);

  // Script context menu state
  const [ctxMenuState, setCtxMenuState] = useState<{
    visible: boolean;
    position: { x: number; y: number };
    spellInfo: {
      word: string;
      from: number;
      to: number;
      suggestions: string[];
    } | null;
    grammarInfo: {
      from: number;
      to: number;
      ruleId: string;
      message: string;
      severity: "style" | "grammar";
      suggestions: string[];
    } | null;
    savedSelection?: { from: number; to: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    spellInfo: null,
    grammarInfo: null,
  });

  const breaksRef = useRef<import("@/editor/pagination").BreakInfo[]>([]);

  // Measure overlay positions from the actual DOM after decorations are applied
  const measureOverlays = useCallback(() => {
    if (viewModeRef.current === "continuous") return;
    if (!pageRef.current) return;
    const pageEl = pageRef.current;
    const root = pageEl.querySelector(".tiptap");
    if (!root) return;

    const pageRect = pageEl.getBoundingClientRect();
    const m = getPageMetrics(pageLayoutRef.current);
    // Track-change deletion widgets become DOM siblings of real document
    // nodes, which would shift every index after them and make the page
    // break overlay land in the wrong place.  Filter them out so
    // children[brk.nodeIndex] matches the ProseMirror model index.
    // Normal editing (no track changes) has no such widgets, so this is
    // a no-op there.
    const children = (Array.from(root.children) as HTMLElement[]).filter(
      (el) =>
        !el.classList.contains("track-change-deleted") &&
        !el.classList.contains("track-change-deleted-block"),
    );
    const breaks = breaksRef.current;
    if (breaks.length === 0) {
      setOverlays([]);
      return;
    }

    // getBoundingClientRect returns coordinates in viewport space (affected by
    // CSS transform: scale), but the overlay top is in the page's local
    // (unscaled) coordinate system.  Divide by zoom to convert.
    const scale = (zoomLevelRef.current || 100) / 100;
    const lineHeightPx = 12 * (96 / 72); // 16px — matches pagination LINE_HEIGHT_PT
    const newOverlays: OverlayInfo[] = [];
    for (const brk of breaks) {
      const el = children[brk.nodeIndex];
      if (!el) continue;
      const elRect = el.getBoundingClientRect();
      const contdHeight = brk.isDialogueSplit ? lineHeightPx : 0;
      const overlayTop =
        (elRect.top - pageRect.top) / scale - m.sepHeightPx - contdHeight;
      newOverlays.push({
        top: overlayTop,
        pageNumber: brk.pageNumber,
        isDialogueSplit: brk.isDialogueSplit,
        characterName: brk.characterName,
        isTitlePage: brk.isTitlePage,
      });
    }
    setOverlays(newOverlays);
  }, []);

  // measureOverlays bails out while continuous (its DOM measurements only
  // make sense against the paginated layout — continuous mode has no page
  // margin decorations or fixed page width to measure against). That means
  // any page break that occurs *while* continuous leaves `overlays` stale:
  // switching back to paginated would show that break's margin (applied via
  // ProseMirror decoration, unaffected by view mode) with no matching, or a
  // wrongly-positioned, `.page-sep` overlay. Re-measure once paginated DOM
  // is actually on screen again.
  useEffect(() => {
    if (viewMode === "continuous") return;
    requestAnimationFrame(() => requestAnimationFrame(measureOverlays));
  }, [viewMode, measureOverlays]);

  const [PaginationExtension] = React.useState(() =>
    Extension.create({
      name: "pagination",
      addProseMirrorPlugins() {
        return [
          createPaginationPlugin(
            (state) => {
              setPageCountRef.current(state.pageCount);
              breaksRef.current = state.breaks;
              // Measure from DOM after ProseMirror applies decoration margins
              requestAnimationFrame(() =>
                requestAnimationFrame(measureOverlays),
              );
            },
            () => pageLayoutRef.current,
            undefined,
            () => viewModeRef.current === "continuous",
          ),
        ];
      },
    }),
  );

  const [ContdCaseExtension] = React.useState(() =>
    Extension.create({
      name: "contdCase",
      addProseMirrorPlugins() {
        return [createContdCasePlugin(() => pageLayoutRef.current)];
      },
    }),
  );

  // Search highlight plugin
  const [SearchExtension] = React.useState(() =>
    Extension.create({
      name: "searchHighlight",
      addProseMirrorPlugins() {
        return [createSearchPlugin()];
      },
    }),
  );

  // Track changes plugin
  const [TrackChangesExtension] = React.useState(() =>
    Extension.create({
      name: "trackChanges",
      addProseMirrorPlugins() {
        return [createTrackChangesPlugin()];
      },
    }),
  );

  // Block formatting shortcuts (Mod-b/i/u) when the attribute is locked by the template
  const [EnforceGuardExtension] = React.useState(() =>
    Extension.create({
      name: "enforceGuard",
      priority: 1001,
      addKeyboardShortcuts() {
        const isLocked = (
          editor: any,
          attr: "bold" | "italic" | "underline",
        ) => {
          const tpl = useFormattingTemplateStore.getState().getActiveTemplate();
          if (tpl.mode !== "enforce") return false;
          const rule = getCurrentElementRule(editor, tpl);
          const locked = getLockedFormatting(rule, true);
          return locked[attr];
        };
        return {
          "Mod-b": ({ editor }) => isLocked(editor, "bold"),
          "Mod-i": ({ editor }) => isLocked(editor, "italic"),
          "Mod-u": ({ editor }) => isLocked(editor, "underline"),
        };
      },
    }),
  );

  // Centralized Enter handler — overrides per-extension Enter handlers via high priority
  const [EnterHandlerExtension] = React.useState(() =>
    Extension.create({
      name: "enterHandler",
      priority: 1000,
      addKeyboardShortcuts() {
        return {
          Enter: ({ editor }) => {
            const { $from } = editor.state.selection;
            const currentNode = $from.parent;
            const currentType = currentNode.type.name;
            const isEmpty = currentNode.textContent.trim() === "";

            // A non-text selection (e.g. a selected image atom) — let ProseMirror's
            // default Enter handle it. Computing block positions below would throw
            // "no position before the top-level node" for a top-level NodeSelection.
            if (!$from.parent.isTextblock) return false;

            // Title-page lines must STAY in the title page: Enter adds another
            // (blank) title-page line instead of a body element, so the content
            // shifts down one line rather than breaking to the next page.
            if (currentType === "titlePage") {
              const atStartTp = $from.parentOffset === 0;
              editor.chain().splitBlock().run();
              const s2 = editor.state;
              const np = s2.selection.$from;
              if (np.depth > 0) {
                const cursorStart = np.before(np.depth);
                let blankPos = -1;
                if (atStartTp) {
                  if (cursorStart > 0) {
                    const prev = s2.doc.resolve(cursorStart - 1);
                    if (prev.depth > 0) blankPos = prev.before(prev.depth);
                  }
                } else {
                  const n = s2.doc.nodeAt(cursorStart);
                  if (n && n.textContent.trim() === "") blankPos = cursorStart;
                }
                if (blankPos >= 0) {
                  const bn = s2.doc.nodeAt(blankPos);
                  if (
                    bn &&
                    bn.type.name === "titlePage" &&
                    bn.attrs.field !== "blank"
                  ) {
                    editor.view.dispatch(
                      s2.tr.setNodeMarkup(blankPos, undefined, {
                        ...bn.attrs,
                        field: "blank",
                      }),
                    );
                  }
                }
              }
              return true;
            }

            // Inside dualDialogue on an empty line: exit the container
            if (isEmpty) {
              for (let d = $from.depth; d >= 0; d--) {
                if ($from.node(d).type.name === "dualDialogue") {
                  // Delete the empty node, then insert action after dual dialogue
                  const emptyFrom = $from.before($from.depth);
                  const emptyTo = $from.after($from.depth);
                  const afterDual = $from.after(d);
                  editor
                    .chain()
                    .deleteRange({ from: emptyFrom, to: emptyTo })
                    .insertContentAt(afterDual - (emptyTo - emptyFrom), {
                      type: "action",
                    })
                    .focus(afterDual - (emptyTo - emptyFrom) + 1)
                    .run();
                  return true;
                }
              }
              // Normal blank line: show element picker
              showPickerRef.current(currentType as ElementType);
              return true;
            }

            // Check if cursor is at the very beginning of the block
            const atBlockStart = $from.parentOffset === 0;

            // Non-empty line: split block, then fix up both halves' types
            // Use template rules if available, fall back to DEFAULT_NEXT_TYPE
            const templateStore = useFormattingTemplateStore.getState();
            const activeTemplate = templateStore.getActiveTemplate();
            // For custom elements, use customTypeId to find the rule
            const effectiveType =
              currentType === "customElement"
                ? currentNode.attrs?.customTypeId || currentType
                : currentType;
            const elementRule = activeTemplate.rules[effectiveType];
            const nextType =
              elementRule?.nextOnEnter ||
              DEFAULT_NEXT_TYPE[currentType] ||
              currentType;
            editor.chain().splitBlock().run();

            // After split, cursor is in the new (second) block.
            const { tr, schema, selection } = editor.state;
            const pos = selection.$from;
            const newBlockStart = pos.before(pos.depth);

            if (atBlockStart) {
              // Cursor was at position 0: user is inserting a blank line above.
              // The second block (with content) should keep the original type.
              // The first block (empty, above) becomes action for a clean blank line.
              const origNodeType = schema.nodes[currentType];
              if (
                origNodeType &&
                tr.doc.nodeAt(newBlockStart)?.type.name !== currentType
              ) {
                tr.setNodeMarkup(newBlockStart, origNodeType);
              }
              const prevResolved = tr.doc.resolve(newBlockStart - 1);
              const prevBlockStart = prevResolved.before(prevResolved.depth);
              const actionType = schema.nodes["action"];
              if (
                actionType &&
                tr.doc.nodeAt(prevBlockStart)?.type.name !== "action"
              ) {
                tr.setNodeMarkup(prevBlockStart, actionType);
              }
            } else {
              // Cursor was in the middle/end: apply normal type transition.
              // Fix the new block's type, and ensure the first block kept original type.
              const isNextBuiltIn = !!schema.nodes[nextType];
              if (isNextBuiltIn) {
                const newNodeType = schema.nodes[nextType];
                if (
                  newNodeType &&
                  tr.doc.nodeAt(newBlockStart)?.type.name !== nextType
                ) {
                  tr.setNodeMarkup(newBlockStart, newNodeType);
                }
              } else {
                // Custom element transition
                const customNodeType = schema.nodes["customElement"];
                const nextRule = activeTemplate.rules[nextType];
                if (customNodeType && nextRule) {
                  tr.setNodeMarkup(newBlockStart, customNodeType, {
                    customTypeId: nextType,
                    customLabel: nextRule.label,
                  });
                }
              }
              const prevResolved = tr.doc.resolve(newBlockStart - 1);
              const prevBlockStart = prevResolved.before(prevResolved.depth);
              const origNodeType =
                schema.nodes[currentType] || schema.nodes["customElement"];
              if (
                origNodeType &&
                tr.doc.nodeAt(prevBlockStart)?.type.name !== currentType
              ) {
                if (schema.nodes[currentType]) {
                  tr.setNodeMarkup(prevBlockStart, schema.nodes[currentType]);
                }
                // For customElement, the type is already correct from splitBlock
              }
            }
            if (tr.steps.length > 0) {
              editor.view.dispatch(tr);
            }
            return true;
          },
        };
      },
    }),
  );

  // Element shortcuts: Mod-1 through Mod-9 to set element type. Reads the
  // active template's `elementMenuOrder` when set (e.g. RPG Sceneplay's
  // restricted 8-type S-T-A-R-T mapping); falls back to the original
  // hardcoded 8 built-ins otherwise, so Film Screenplay (and every other
  // template without elementMenuOrder) is unaffected.
  const DEFAULT_SHORTCUT_TYPES = [
    "sceneHeading",
    "action",
    "character",
    "dialogue",
    "parenthetical",
    "transition",
    "general",
    "shot",
  ];
  const [ElementShortcutExtension] = React.useState(() => {
    const setElementByIndex = (editor: any, i: number) => {
      const activeTemplate = useFormattingTemplateStore
        .getState()
        .getActiveTemplate();
      const types = activeTemplate.elementMenuOrder || DEFAULT_SHORTCUT_TYPES;
      const type = types[i];
      if (!type) return false;
      if (editor.schema.nodes[type]) {
        editor.chain().focus().setNode(type).run();
        return true;
      }
      const rule = activeTemplate.rules[type];
      if (!rule) return false;
      editor
        .chain()
        .focus()
        .setNode("customElement", {
          customTypeId: type,
          customLabel: rule.label,
        })
        .run();
      return true;
    };

    const openRollDialog = (editor: any) => {
      useRollNoteStore
        .getState()
        .requestRollDialog(editor.state.selection.from);
      return true;
    };

    return Extension.create({
      name: "elementShortcuts",
      priority: 999,
      addKeyboardShortcuts() {
        const shortcuts: Record<string, any> = {};
        for (let i = 0; i < 9; i++) {
          shortcuts[`Mod-${i + 1}`] = ({ editor }: { editor: any }) =>
            setElementByIndex(editor, i);
        }
        // Roll dialog: Mod-0 (can't use Mod-R/O/D — reload/open are
        // browser-reserved and D is Dual Dialogue's shortcut).
        shortcuts["Mod-0"] = ({ editor }: { editor: any }) =>
          openRollDialog(editor);
        return shortcuts;
      },
      addProseMirrorPlugins() {
        // Secondary bindings on the numpad digits (Numpad0-Numpad9), no Mod
        // required — numpad keys report the same `event.key` as the top-row
        // digits, so they can't be targeted via addKeyboardShortcuts (which
        // matches on `.key`); this reads `event.code` directly instead.
        // F-keys were tried first but Mod-F1..F12 are reserved system-wide
        // on macOS (Mission Control, VoiceOver, etc.) and can't be
        // overridden.
        return [
          new Plugin({
            key: new PluginKey("elementShortcutsNumpad"),
            props: {
              handleKeyDown: (_view, event) => {
                const match = /^Numpad([0-9])$/.exec(event.code);
                if (!match) return false;
                const digit = Number(match[1]);
                const handled =
                  digit === 0
                    ? openRollDialog(this.editor)
                    : setElementByIndex(this.editor, digit - 1);
                if (handled) event.preventDefault();
                return handled;
              },
            },
          }),
        ];
      },
    });
  });

  // Centralized Tab handler — reads nextOnTab from active template
  const [TabHandlerExtension] = React.useState(() =>
    Extension.create({
      name: "tabHandler",
      priority: 1000,
      addKeyboardShortcuts() {
        return {
          Tab: ({ editor }) => {
            const { $from } = editor.state.selection;
            const currentNode = $from.parent;
            const currentType = currentNode.type.name;

            // For custom elements, look up by customTypeId
            const effectiveType =
              currentType === "customElement"
                ? currentNode.attrs?.customTypeId || currentType
                : currentType;

            const templateStore = useFormattingTemplateStore.getState();
            const activeTemplate = templateStore.getActiveTemplate();
            const rule = activeTemplate.rules[effectiveType];

            if (!rule?.nextOnTab) return false;

            const nextId = rule.nextOnTab;
            // Check if next type is a built-in or custom element
            const isBuiltIn = ALL_ELEMENT_TYPES.includes(nextId as ElementType);

            if (isBuiltIn) {
              return editor.chain().splitBlock().setNode(nextId).run();
            } else {
              // Custom element
              const nextRule = activeTemplate.rules[nextId];
              if (nextRule) {
                return editor
                  .chain()
                  .splitBlock()
                  .setNode("customElement", {
                    customTypeId: nextId,
                    customLabel: nextRule.label,
                  })
                  .run();
              }
            }
            return false;
          },
        };
      },
    }),
  );

  const editor = useEditor(
    {
      extensions: [
        Document.extend({
          content: "block+",
        }),
        // HardBreakLeafText must travel with ScreenplayHardBreak — see that module.
        Text,
        ScreenplayHardBreak,
        HardBreakLeafText,
        Bold,
        Italic,
        Underline,
        Strike,
        Dropcursor,
        Gapcursor,
        Subscript,
        Superscript,
        Highlight.configure({ multicolor: true }),
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        FormatOverride,
        CustomElement,
        ScreenplayImage,
        History.configure({ newGroupDelay: 150 }),
        TextAlign.configure({ types: [...ALL_ELEMENT_TYPES, "customElement"] }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            // Check template rules first for custom placeholders
            const tplStore = useFormattingTemplateStore.getState();
            const tpl = tplStore.getActiveTemplate();
            // For custom elements, use customTypeId attribute
            if (node.type.name === "customElement") {
              const customTypeId = node.attrs?.customTypeId;
              if (customTypeId && tpl.rules[customTypeId]) {
                return tpl.rules[customTypeId].placeholder || "";
              }
              return "";
            }
            // For built-in elements, check template rule
            if (tpl.rules[node.type.name]?.placeholder) {
              return tpl.rules[node.type.name].placeholder;
            }
            // Fallback defaults
            const m: Record<string, string> = {
              sceneHeading: "INT./EXT. LOCATION - TIME",
              action: "Describe what happens...",
              character: "CHARACTER NAME",
              dialogue: "Dialogue...",
              parenthetical: "(direction)",
              transition: "CUT TO:",
              general: "Text...",
              shot: "SHOT DESCRIPTION",
              newAct: "ACT ONE",
              endOfAct: "END OF ACT",
              lyrics: "Lyrics...",
              showEpisode: "SHOW TITLE",
              castList: "Cast...",
            };
            return m[node.type.name] || "";
          },
        }),
        SceneHeading,
        Action,
        Character,
        Dialogue,
        Parenthetical,
        Transition,
        General,
        Shot,
        NewAct,
        EndOfAct,
        Lyrics,
        ShowEpisode,
        CastList,
        DualDialogue,
        DualDialogueColumn,
        TitlePage,
        AvBlock,
        AvRow,
        AvCell,
        AvPara,
        AvShot,
        AvDirection,
        AvKeymap,
        ScriptNoteMark,
        RollAnchorNode,
        TagMark,
        ItemMark,
        PaginationExtension,
        ContdCaseExtension,
        SearchExtension,
        TrackChangesExtension,
        EnforceGuardExtension,
        EnterHandlerExtension,
        TabHandlerExtension,
        ElementShortcutExtension,
        SpellCheck,
        Grammar,
        ...pluginRegistry.getEditorExtensions(),
      ],
      content: { type: "doc", content: [{ type: "action", content: [] }] },
      editorProps: {
        attributes: {
          class: "screenplay-content",
          spellcheck: "false",
        },
      },
      onSelectionUpdate: ({ editor: ed }) => {
        // Check custom element first
        if (ed.isActive("customElement")) {
          // Use customTypeId as the active element label
          const attrs = ed.getAttributes("customElement");
          if (attrs?.customTypeId) {
            setActiveElement(attrs.customTypeId as ElementType);
            return;
          }
        }
        for (const type of ALL_ELEMENT_TYPES) {
          if (ed.isActive(type)) {
            setActiveElement(type);
            break;
          }
        }
      },
    },
    [editorKey],
  );

  const setEditorInStore = useEditorStore((s) => s.setEditor);
  useEffect(() => {
    setEditorInStore(editor);
    return () => setEditorInStore(null);
  }, [editor, setEditorInStore]);

  // Route native undo/redo (e.g. iOS shake-to-undo) to the editor
  useEffect(() => {
    if (!editor) return;
    const handleBeforeInput = (e: Event) => {
      const ie = e as InputEvent;
      if (ie.inputType === "historyUndo") {
        e.preventDefault();
        try {
          editor.chain().undo().run();
        } catch {
          //
        }
      } else if (ie.inputType === "historyRedo") {
        e.preventDefault();
        try {
          editor.chain().redo().run();
        } catch {
          //
        }
      }
    };
    document.addEventListener("beforeinput", handleBeforeInput);
    return () => document.removeEventListener("beforeinput", handleBeforeInput);
  }, [editor]);

  // ── Dynamic CSS injection for custom formatting templates ──
  const activeTemplateId = useFormattingTemplateStore(
    (s) => s.activeTemplateId,
  );
  const templatesLoaded = useFormattingTemplateStore((s) => s.loaded);
  const templates = useFormattingTemplateStore((s) => s.templates);

  useEffect(() => {
    // Load templates on mount
    useFormattingTemplateStore.getState().loadTemplates();
  }, []);

  useEffect(() => {
    const template = useFormattingTemplateStore.getState().getActiveTemplate();
    // If the resolved template is industry standard, use static CSS
    if (template.id === "__industry_standard__") {
      injectTemplateCss(null);
      return;
    }
    const css = generateTemplateCss(template, pageLayout);
    injectTemplateCss(css);

    return () => {
      injectTemplateCss(null);
    };
  }, [activeTemplateId, templatesLoaded, templates, pageLayout]);

  // --- Image insertion: upload to the project's assets, then insert a node that
  // references the asset (keeps the document small). Falls back to an inline data
  // URL only when there is no project to upload to. ---
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  // The cursor position captured when the menu/toolbar triggers image insertion,
  // so the upload's async gap (file dialog) doesn't lose the insertion point.
  const imageInsertPosRef = useRef<number | null>(null);
  const setImageInsertHandler = useEditorStore((s) => s.setImageInsertHandler);
  useEffect(() => {
    setImageInsertHandler(() => {
      imageInsertPosRef.current = editor ? editor.state.selection.to : null;
      imageFileInputRef.current?.click();
    });
    return () => setImageInsertHandler(null);
  }, [setImageInsertHandler, editor]);

  const handleImageFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      void currentDocId;
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file
      if (!file || !editor) return;
      if (!file.type.startsWith("image/")) {
        showToast({
          description: "Please choose an image file",
          type: "error",
        });
        return;
      }
      // Insert at the captured cursor position (valid block position), not doc start.
      const pos = imageInsertPosRef.current ?? editor.state.selection.to;
      const insertAt = (attrs: Record<string, unknown>) =>
        insertImageNode(editor, attrs, pos);
      try {
        insertAt(await buildImageAttrs(file));
      } catch (err) {
        showToast({
          description: `Failed to insert image: ${err instanceof Error ? err.message : String(err)}`,
          type: "error",
        });
      }
    },
    [editor, currentDocId],
  );

  // Helper: clear track changes when switching documents
  const clearTrackChanges = useCallback(() => {
    const store = useEditorStore.getState();
    if (!store.trackChangesEnabled) return;
    store.setTrackChangesEnabled(false);
    store.setTrackChangesLabel("");
    if (editor) {
      const { tr } = editor.state;
      tr.setMeta(trackChangesPluginKey, { enabled: false, baseline: null });
      editor.view.dispatch(tr);
    }
  }, [editor]);

  // --- Scene navigator + scene number assignment ---
  const updateScenes = useCallback(() => {
    if (!editor) return;
    const list: {
      id: string;
      heading: string;
      sceneNumber: number | null;
      color: string;
      synopsis: string;
    }[] = [];
    const locked = useEditorStore.getState().sceneNumbersLocked;
    const visible = useEditorStore.getState().sceneNumbersVisible;
    let idx = 0;
    // Collect scene positions for attribute updates
    const attrUpdates: { pos: number; number: string }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "sceneHeading") {
        idx++;
        let num: string;
        if (locked && node.attrs.sceneNumber != null) {
          // Keep the locked number
          num = String(node.attrs.sceneNumber);
        } else {
          num = String(idx);
        }
        const sceneId = `scene-${idx}`;
        list.push({
          id: sceneId,
          heading: node.textContent || "Untitled Scene",
          sceneNumber: parseInt(num, 10),
          color: node.attrs.sceneColor || "",
          synopsis: node.attrs.synopsis || "",
        });
        // Update node attrs if scene numbers are visible and the number changed
        if (visible && String(node.attrs.sceneNumber) !== num) {
          attrUpdates.push({ pos, number: num });
        }
        // Clear scene number attr if not visible and it was set
        if (!visible && node.attrs.sceneNumber != null) {
          attrUpdates.push({ pos, number: "" });
        }
      }
      return true;
    });
    // Batch attribute updates in a single transaction
    if (attrUpdates.length > 0) {
      const { tr } = editor.state;
      for (const { pos, number } of attrUpdates) {
        tr.setNodeMarkup(pos, undefined, {
          ...editor.state.doc.nodeAt(pos)?.attrs,
          sceneNumber: number || null,
        });
      }
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    }
    setScenes(list);
  }, [editor, setScenes]);

  useEffect(() => {
    if (!editor) return;
    updateScenes();
    editor.on("update", updateScenes);
    return () => {
      editor.off("update", updateScenes);
    };
  }, [editor, updateScenes]);

  // Re-run when scene numbering visibility or lock state changes
  useEffect(() => {
    if (editor) updateScenes();
  }, [editor, sceneNumbersVisible, sceneNumbersLocked, updateScenes]);

  // --- Collect character names from document ---
  // `characterKey` (utils/nodeText) is the one normalization: collapse hard
  // breaks to spaces, drop extensions like (CONT'D)/(V.O.)/(O.S.), uppercase.
  // Every site that compares a cue to a stored name must use it on both sides.
  const { setCharacters } = useEditorStore();
  // Per-document "Mores & Continueds" config. Reactive: editing it re-runs the
  // CONT'D effect and re-renders the page-break markers.
  const moresContds = resolveMoresContds(pageLayout);
  const { characterContd, contdText } = moresContds;

  const updateCharacters = useCallback(() => {
    if (!editor) return;
    const names = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (node.type.name === "character") {
        const base = characterKey(node.textContent);
        if (base) names.add(base);
      }
      return true;
    });
    const sorted = Array.from(names).sort();
    setKnownCharacters(sorted);
    setCharacters(sorted);
  }, [editor, setCharacters]);

  useEffect(() => {
    if (!editor) return;
    updateCharacters();
    // Only update character list when the cursor leaves a character node
    // (i.e., user finished typing the name and pressed Enter / moved away)
    let prevInCharNode = false;
    const handleSelectionUpdate = () => {
      const { $from } = editor.state.selection;
      const inCharNode = $from.parent.type.name === "character";
      // Update when leaving a character node, or when entering a non-character node after being in one
      if (prevInCharNode && !inCharNode) {
        updateCharacters();
      }
      prevInCharNode = inCharNode;
    };
    // Also update on transaction that changes node type (e.g., setNode from character to dialogue)
    const handleUpdate = ({
      transaction,
    }: {
      transaction: { docChanged: boolean };
    }) => {
      if (!transaction.docChanged) return;
      const { $from } = editor.state.selection;
      if ($from.parent.type.name !== "character") {
        updateCharacters();
      }
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor, updateCharacters]);

  // --- Collect known locations from existing scene headings ---
  // Same "update when leaving the relevant node" pattern as
  // `updateCharacters` above, scanning `sceneHeading` nodes instead.
  const updateLocations = useCallback(() => {
    if (!editor) return;
    const locations = new Set<string>();
    editor.state.doc.descendants((node) => {
      if (node.type.name === "sceneHeading") {
        const { location } = parseSceneHeading(node.textContent);
        if (location) locations.add(location.toUpperCase());
      }
      return true;
    });
    setKnownLocations(Array.from(locations).sort());
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    updateLocations();
    let prevInSceneHeading = false;
    const handleSelectionUpdate = () => {
      const { $from } = editor.state.selection;
      const inNode = $from.parent.type.name === "sceneHeading";
      if (prevInSceneHeading && !inNode) updateLocations();
      prevInSceneHeading = inNode;
    };
    const handleUpdate = ({
      transaction,
    }: {
      transaction: { docChanged: boolean };
    }) => {
      if (!transaction.docChanged) return;
      const { $from } = editor.state.selection;
      if ($from.parent.type.name !== "sceneHeading") updateLocations();
    };
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("update", handleUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor, updateLocations]);

  // --- Auto CONT'D: add/remove (CONT'D) based on previous dialogue ---
  // Industry rule (Final Draft / WriterDuet / Fade In): append the continued
  // marker when the same character resumes speaking after action *within the same
  // scene*. A scene heading / transition resets continuation. A per-cue override
  // remembers when the writer deletes it so it is not re-added there. Gated by the
  // per-document characterContd setting; page-break (CONT'D)/(MORE) is separate.
  useEffect(() => {
    if (!editor || !characterContd) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    // Configured marker, e.g. "(CONT'D)".
    const contdMarker = contdText.trim() || "(CONT'D)";

    const updateContd = () => {
      const { doc } = editor.state;

      // Collect every top-level block. `nodeSize` travels with each one so the
      // replace range is derived from it rather than from the text length —
      // the latter is short by one per hard break, which would leave the tail
      // of the cue behind and duplicate it.
      const blocks: ContdBlock[] = [];
      doc.forEach((node, offset) => {
        blocks.push({
          type: node.type.name,
          text: node.textContent,
          pos: offset,
          nodeSize: node.nodeSize,
          attrs: node.attrs,
        });
      });

      const changes = computeContdChanges(blocks, { contdMarker });
      if (changes.length === 0) return;

      // Apply changes in reverse document order so earlier positions don't shift.
      const { tr } = editor.state;
      for (let i = changes.length - 1; i >= 0; i--) {
        const c = changes[i];
        if (c.attrs) tr.setNodeMarkup(c.pos, undefined, c.attrs);
        if (c.oldText !== null && c.newText !== null) {
          tr.insertText(c.newText, c.from, c.to);
        }
      }
      tr.setMeta("addToHistory", false);
      editor.view.dispatch(tr);
    };

    const debouncedUpdate = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(updateContd, 800);
    };

    editor.on("update", debouncedUpdate);
    setTimeout(updateContd, 500);
    return () => {
      editor.off("update", debouncedUpdate);
      if (timeout) clearTimeout(timeout);
    };
  }, [editor, characterContd, contdText]);

  // --- Character autocomplete: show/update on each editor update while in character block ---
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (!editor.isActive("character")) {
        setCharAutoState((s) => (s.visible ? { ...s, visible: false } : s));
        charAutoDismissedRef.current = false;
        return;
      }
      if (charAutoDismissedRef.current) return;

      const { $from } = editor.state.selection;
      const text = characterKey($from.parent.textContent);
      if (!text) {
        setCharAutoState((s) => (s.visible ? { ...s, visible: false } : s));
        charAutoDismissedRef.current = false;
        return;
      }

      // Filter known characters that start with typed text (exclude exact match)
      // Only match against base names (without extensions)
      const matches = knownCharacters.filter(
        (n) => n.startsWith(text) && n !== text,
      );

      if (matches.length === 0) {
        setCharAutoState((s) => (s.visible ? { ...s, visible: false } : s));
        return;
      }

      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      setCharAutoState({
        visible: true,
        position: { top: coords.bottom + 4, left: coords.left },
        suggestions: matches,
      });
    };
    editor.on("update", onUpdate);
    editor.on("selectionUpdate", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      editor.off("selectionUpdate", onUpdate);
    };
  }, [editor, knownCharacters]);

  // --- Slugline autocomplete: show/update on each editor update while in a scene heading ---
  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (!editor.isActive("sceneHeading")) {
        setSlugAutoState((s) => (s.visible ? { ...s, visible: false } : s));
        slugAutoDismissedRef.current = false;
        return;
      }
      if (slugAutoDismissedRef.current) return;

      const { $from } = editor.state.selection;
      const ctx = getSlugSuggestionContext(
        $from.parent.textContent,
        knownLocations,
      );
      if (!ctx) {
        setSlugAutoState((s) => (s.visible ? { ...s, visible: false } : s));
        return;
      }

      // Absolute doc positions of the fragment `ctx` matched, so selecting a
      // suggestion replaces just that fragment — not the whole line, which
      // would also wipe out whatever prefix/location was already confirmed.
      const blockStart = $from.start();
      slugSegmentRef.current = {
        from: blockStart + ctx.segmentStart,
        to: blockStart + ctx.segmentEnd,
      };

      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      setSlugAutoState({
        visible: true,
        position: { top: coords.bottom + 4, left: coords.left },
        suggestions: ctx.suggestions,
      });
    };
    editor.on("update", onUpdate);
    editor.on("selectionUpdate", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      editor.off("selectionUpdate", onUpdate);
    };
  }, [editor, knownLocations]);

  // Re-measure overlays after editor updates (decorations settle)
  useEffect(() => {
    if (!editor) return;
    const run = () =>
      requestAnimationFrame(() => requestAnimationFrame(measureOverlays));
    editor.on("update", run);
    // Initial measurement passes
    const timers = [200, 500, 1000].map((ms) => setTimeout(run, ms));
    return () => {
      editor.off("update", run);
      timers.forEach(clearTimeout);
    };
  }, [editor, measureOverlays]);

  // Re-paginate when page layout changes (e.g., after FDX import)
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      const { tr } = editor.state;
      tr.setMeta("forceRepaginate", true);
      editor.view.dispatch(tr);
    }, 300);
    return () => clearTimeout(t);
  }, [editor, pageLayout]);

  // --- Initialize spell checker on mount ---
  useEffect(() => {
    spellChecker.init().catch(() => {});
  }, []);

  // --- Toggle spell check plugin when store changes ---
  useEffect(() => {
    if (!editor) return;
    const { tr } = editor.state;
    tr.setMeta(spellCheckPluginKey, { toggle: spellCheckEnabled });
    editor.view.dispatch(tr);
  }, [editor, spellCheckEnabled]);

  // --- Register the local rule-based grammar providers exactly once. ---
  // retext: style/wordiness checks (passive voice, weak intensifiers, etc.)
  // harper: actual grammar (subject-verb agreement, tense, articles, ...)
  useEffect(() => {
    pluginRegistry.registerGrammarProvider(
      "opendraft-retext",
      async (text, baseOffset, signal) => {
        const enabledSet = new Set<RetextCategory>();
        const rulesEnabled =
          useEditorStore.getState().grammarRulesEnabled || {};
        for (const cat of RETEXT_CATEGORIES) {
          if (rulesEnabled[cat] !== false) enabledSet.add(cat);
        }
        return runRetext(text, baseOffset, enabledSet, signal);
      },
    );
    pluginRegistry.registerGrammarProvider(
      "opendraft-harper",
      (text, baseOffset, signal) => {
        return runHarper(text, baseOffset, signal);
      },
    );
    return () => {
      pluginRegistry.unregisterGrammarProvider("opendraft-retext");
      pluginRegistry.unregisterGrammarProvider("opendraft-harper");
    };
  }, []);

  // --- Toggle grammar plugin when store changes ---
  useEffect(() => {
    if (!editor) return;
    const { tr } = editor.state;
    tr.setMeta(grammarPluginKey, { toggle: grammarCheckEnabled });
    editor.view.dispatch(tr);
  }, [editor, grammarCheckEnabled]);

  // Build a saveable content object: editor JSON + store metadata at top level.
  // The payload shape lives in utils/saveContent so MenuBar's Cmd+S and the
  // backup writer cannot drift from it again. Keep the useCallback wrapper —
  // its identity is a dependency of the auto-save and metadata-save effects.
  const buildSaveContent = useCallback(
    (): Record<string, unknown> | undefined => buildSaveContentShared(editor),
    [editor],
  );

  // Tracks whether the document currently in the editor has real (textful)
  // content saved. When true, an autosave that finds the editor body suddenly
  // empty is treated as an editor glitch (reset/remount) and skipped.
  const lastSavedJsonRef = useRef<string>("");
  const lastSavedNonEmptyRef = useRef<boolean>(Boolean(currentDocId));

  // Guard: suppress autosave while switching documents. During the switch the
  // store metadata is cleared (0 relationships, 0 profiles, etc.) but the
  // autosave closure still holds the OLD document id.
  const scriptSwitchingRef = useRef(false);

  // Autosave into whichever provider is active. Debounced: notifyChange()
  // (called below on every editor change) schedules a write shortly after
  // the user pauses, rather than waiting for the interval's next tick.
  const buildStorageDoc = useCallback((): StorageDoc | null => {
    const doc = buildStorageDocFromEditor(editor);
    if (!doc) return null;
    // Data-loss guard: never let an empty/just-reset editor body overwrite a
    // document that has real content saved (the blank-document bug).
    if (!docHasAnyText(doc.content) && lastSavedNonEmptyRef.current)
      return null;
    lastSavedNonEmptyRef.current = docHasAnyText(doc.content);
    return doc;
  }, [editor]);

  const { notifyChange } = useStorageAutoSave({
    buildDoc: buildStorageDoc,
    scriptSwitchingRef,
  });

  // --- Mark unsaved as the user types (status bar) + schedule a debounced save ---
  useEffect(() => {
    if (!editor) return;
    const markUnsaved = () => {
      const { saveStatus } = useEditorStore.getState();
      if (saveStatus === "idle" || saveStatus === "saved") {
        useEditorStore.getState().setSaveStatus("unsaved");
      }
      notifyChange();
    };
    editor.on("update", markUnsaved);
    return () => {
      editor.off("update", markUnsaved);
    };
  }, [editor, notifyChange]);

  // --- Keep the open document across route changes ---
  // Going to Settings (or any other route) unmounts this component and destroys
  // the editor, and only a script whose ids are in the URL is refetched below.
  // Everything else — File → Open, an imported file, an unsaved draft — used to
  // come back blank. TipTap schedules the destroy a tick after unmount, so the
  // document is still readable from this cleanup.
  useEffect(() => {
    if (!editor) return;
    return () => {
      if (editor.isDestroyed) return;
      try {
        const doc = editor.getJSON();
        // A blank body is never worth restoring, and stashing one could put an
        // empty document back over a real one.
        if (!docHasAnyText(doc)) return;
        stashSessionDoc({ doc, docId: currentDocId });
      } catch (err) {
        console.warn("Could not stash the open document:", err);
      }
    };
  }, [editor, currentDocId]);

  // Put it back on the way in.
  //
  // Strictly a mount-time action: the attempt is marked done as soon as the
  // editor exists, whether or not anything was restored. Retrying later would
  // mean a stash left over from an earlier document could land on top of a
  // script that has since been loaded from the library.
  const sessionRestoreDoneRef = useRef(false);
  useEffect(() => {
    if (!editor) return;
    if (sessionRestoreDoneRef.current) return;
    sessionRestoreDoneRef.current = true;

    const doc = takeSessionDoc(currentDocId);
    if (!doc) return;
    try {
      editor.commands.setContent(doc as Record<string, unknown>, false);
      clearEditorHistory(editor);
      setShowWelcome(false);
      updateScenes();
    } catch (err) {
      console.error("Could not restore the open document:", err);
      showToast({
        description: "Could not restore the document you had open",
        type: "error",
      });
    }
  }, [editor, currentDocId, updateScenes]);

  // --- Load script from URL params ---
  // Reset the guard when the editor instance changes so we reload
  // content if TipTap recreates the editor.
  // --- Load a document out of local storage into the editor ---
  //
  // Restores the ProseMirror document plus every `_`-prefixed store key that
  // `buildSaveContent` writes. This is the same restore the server load path
  // used to do, minus the Project entity: dictionary words now travel inside
  // the document payload, because there is nothing else for them to live on.
  const applyStoredDoc = useCallback(
    (doc: StorageDoc) => {
      if (!editor) return;
      scriptSwitchingRef.current = true;
      // Documents that came from a file (disk/memory mode, or an import) carry
      // their images embedded as base64. Decode them back into the asset store
      // — keeping their ids — so the document's references resolve. Deliberately
      // not awaited: the images fill in as they land, and blocking the whole
      // document on them would leave the editor empty meanwhile.
      if (doc.assets && doc.assets.length > 0) {
        void unpackAssets(doc.assets, doc.id);
      }
      try {
        clearTrackChanges();
        const content = doc.content as Record<string, unknown> | null;

        // Strip app metadata keys before feeding to ProseMirror
        let pmDoc: Record<string, unknown> | null = null;
        if (
          content &&
          typeof content === "object" &&
          "type" in content &&
          content.type === "doc"
        ) {
          const { pmDoc: stripped } = stripSaveMetadata(content);
          pmDoc = stripped;
        }

        try {
          if (
            pmDoc &&
            Array.isArray(pmDoc.content) &&
            pmDoc.content.length > 0
          ) {
            editor.commands.setContent(pmDoc);
          } else if (
            content &&
            typeof content === "object" &&
            Object.keys(content).length > 0
          ) {
            editor.commands.setContent(content);
          } else {
            editor.commands.setContent({
              type: "doc",
              content: [{ type: "action", content: [] }],
            });
          }
        } catch (setErr) {
          console.error("setContent failed:", setErr);
          showToast({
            description: `Failed to render content: ${setErr instanceof Error ? setErr.message : String(setErr)}`,
            type: "error",
          });
          editor.commands.setContent({
            type: "doc",
            content: [{ type: "action", content: [] }],
          });
        }
        clearEditorHistory(editor);

        // Record whether this document holds real content, so a later editor
        // reset to an empty body cannot silently overwrite it (data-loss guard).
        lastSavedNonEmptyRef.current = docHasAnyText(pmDoc ?? content);

        const store = useEditorStore.getState();
        // Clear per-screenplay metadata so nothing carries over from whatever
        // document was open before.
        store.setCharacterProfiles([]);
        store.setCharacterRelationships([]);
        store.setNotes([]);
        store.setGeneralNotes([]);
        store.setTags([]);
        store.setTagCategories([...DEFAULT_TAG_CATEGORIES]);
        store.setBeats([]);
        store.setBeatColumns([]);
        store.setPageLayout({ ...DEFAULT_PAGE_LAYOUT });
        useMapStore.getState().setMap(null);
        useMapStore.getState().setLocationMapRefs({});
        useSheetStore.getState().setSheets([]);
        useOracleStore.getState().setUserSources([]);
        useOracleStore.getState().setUserCollections([]);
        useOracleStore.getState().setUserCombos([]);
        useRollNoteStore.getState().setRollNotes([]);
        usePdfViewerStore.getState().setEmbeds([]);
        usePdfViewerStore.getState().setAnnotations([]);
        usePdfViewerStore.getState().setFormValues([]);

        const parseAttr = (val: unknown): unknown[] => {
          if (typeof val === "string") {
            try {
              const p = JSON.parse(val);
              return Array.isArray(p) ? p : [];
            } catch {
              return [];
            }
          }
          if (Array.isArray(val)) return val;
          return [];
        };

        if (content) {
          const c = content as Record<string, unknown>;
          const notes = parseAttr(c._notes);
          if (notes.length > 0)
            store.setNotes(notes as import("@/stores/editorStore").NoteInfo[]);
          const gNotes = parseAttr(c._generalNotes);
          if (gNotes.length > 0)
            store.setGeneralNotes(
              gNotes as import("@/stores/editorStore").GeneralNote[],
            );
          const tagsArr = parseAttr(c._tags);
          if (tagsArr.length > 0)
            store.setTags(tagsArr as import("@/stores/editorStore").TagItem[]);
          const tagCats = parseAttr(c._tagCategories);
          if (tagCats.length > 0)
            store.setTagCategories(
              tagCats as import("@/stores/editorStore").TagCategory[],
            );
          const profiles = parseAttr(c._characterProfiles);
          if (profiles.length > 0) {
            for (const prof of profiles as Record<string, unknown>[]) {
              if (prof.name && typeof prof.name === "string") {
                store.upsertCharacterProfile(prof.name, {
                  description: (prof.description as string) || "",
                  color: (prof.color as string) || "",
                  highlighted: (prof.highlighted as boolean) || false,
                  gender: (prof.gender as string) || "",
                  age: (prof.age as string) || "",
                  role: (prof.role as string) || "",
                  backstory: (prof.backstory as string) || "",
                  arc: (prof.arc as string) || "",
                  speechPattern: (prof.speechPattern as string) || "",
                  vocabulary: (prof.vocabulary as string) || "",
                  verbalTics: (prof.verbalTics as string) || "",
                  images: Array.isArray(prof.images)
                    ? (prof.images as string[])
                    : [],
                  sampleDialogue: (prof.sampleDialogue as string) || "",
                  sheetId:
                    typeof prof.sheetId === "string" ? prof.sheetId : null,
                });
              }
            }
          }
          const rels = parseAttr(c._characterRelationships);
          if (rels.length > 0) {
            store.setCharacterRelationships(
              rels as import("@/stores/editorStore").CharacterRelationship[],
            );
          }
          store.setBeats(
            parseAttr(c._beats) as import("@/stores/editorStore").BeatInfo[],
          );
          store.setBeatColumns(
            parseAttr(
              c._beatColumns,
            ) as import("@/stores/editorStore").BeatColumn[],
          );
          if (
            c._beatArrangeMode === "auto" ||
            c._beatArrangeMode === "custom"
          ) {
            store.setBeatArrangeMode(c._beatArrangeMode);
          }
          // Restore scene numbering state
          if (typeof c._sceneNumbersVisible === "boolean") {
            store.setSceneNumbersVisible(c._sceneNumbersVisible);
          }
          if (typeof c._sceneNumbersLocked === "boolean") {
            store.setSceneNumbersLocked(c._sceneNumbersLocked);
          }
          // Restore per-document formatting template
          if (c._templateId && typeof c._templateId === "string") {
            useFormattingTemplateStore
              .getState()
              .setActiveTemplateId(c._templateId);
          } else {
            useFormattingTemplateStore.getState().setActiveTemplateId(null);
          }
          // Restore per-document ignored words for spell check
          spellChecker.setIgnoredWords(parseAttr(c._ignoredWords) as string[]);
          spellChecker.setIgnoredOnce(parseAttr(c._ignoredOnce) as string[]);
          // The document's own dictionary words. These used to live on the
          // server-side Project entity; with no server they are per-document.
          spellChecker.setProjectWords(
            (parseAttr(c._customDictWords) as string[]).map((s) => String(s)),
          );
          if (c._enabledGlobalDicts === undefined) {
            // Legacy document (saved before this feature) — auto-enable
            // "Personal" if it exists, so users who had the old global custom
            // dictionary keep those words recognized.
            const lib = useEditorStore.getState().customDictionaries;
            spellChecker.setEnabledGlobalDicts(
              lib["Personal"] ? ["Personal"] : [],
            );
          } else {
            spellChecker.setEnabledGlobalDicts(
              parseAttr(c._enabledGlobalDicts) as string[],
            );
          }
          // Per-document project-dictionary toggle. Default enabled (back-compat).
          spellChecker.setProjectDictionaryEnabled(
            typeof c._projectDictEnabled === "boolean"
              ? c._projectDictEnabled
              : true,
          );
          // Per-document enabled languages. Default to built-in only.
          const langs = parseAttr(c._enabledLanguages);
          spellChecker.setEnabledLanguages(
            langs.length > 0 ? (langs as string[]) : [BUILTIN_LANGUAGE],
          );
          // Restore per-document ignored grammar rules / occurrences
          grammarIgnore.setIgnoredRules(
            parseAttr(c._ignoredGrammarRules) as string[],
          );
          grammarIgnore.setIgnoredOnce(
            parseAttr(c._ignoredGrammarOnce) as string[],
          );
          // Restore per-document spell/grammar check toggles (default off)
          store.setSpellCheckEnabled(c._spellCheckEnabled === true);
          store.setGrammarCheckEnabled(c._grammarCheckEnabled === true);
          // Restore per-document page layout (header/footer, margins)
          if (c._pageLayout && typeof c._pageLayout === "object") {
            store.setPageLayout({
              ...DEFAULT_PAGE_LAYOUT,
              ...(c._pageLayout as Record<string, unknown>),
            });
          }
          // Restore the project map and location→cell links
          const mapStore = useMapStore.getState();
          mapStore.setMap(
            c._map && typeof c._map === "object"
              ? (c._map as ProjectMap)
              : null,
          );
          mapStore.setLocationMapRefs(
            c._locationMapRefs && typeof c._locationMapRefs === "object"
              ? (c._locationMapRefs as Record<string, MapRef>)
              : {},
          );
          // Restore character sheets
          useSheetStore
            .getState()
            .setSheets(
              Array.isArray(c._sheets) ? (c._sheets as CharacterSheet[]) : [],
            );
          // Restore custom oracle sources/collections/combos
          const oracleStore = useOracleStore.getState();
          oracleStore.setUserSources(
            Array.isArray(c._oracleSources)
              ? (c._oracleSources as OracleSource[])
              : [],
          );
          oracleStore.setUserCollections(
            Array.isArray(c._oracleCollections)
              ? (c._oracleCollections as OracleCollection[])
              : [],
          );
          oracleStore.setUserCombos(
            Array.isArray(c._oracleCombos)
              ? (c._oracleCombos as OracleCombo[])
              : [],
          );
          // Restore roll notes (the Rolls sidebar's persisted anchors)
          useRollNoteStore
            .getState()
            .setRollNotes(
              Array.isArray(c._rollNotes) ? (c._rollNotes as RollNote[]) : [],
            );
          // Restore embedded PDFs, their markup, and their form field values
          const pdfStore = usePdfViewerStore.getState();
          pdfStore.setEmbeds(
            Array.isArray(c._pdfEmbeds) ? (c._pdfEmbeds as PdfEmbed[]) : [],
          );
          pdfStore.setAnnotations(
            Array.isArray(c._pdfAnnotations)
              ? (c._pdfAnnotations as PdfAnnotation[])
              : [],
          );
          pdfStore.setFormValues(
            Array.isArray(c._pdfFormValues)
              ? (c._pdfFormValues as PdfFormFieldValue[])
              : [],
          );
        }

        setCurrentDocId(doc.id);
        store.setImportedSource(null);
        setDocumentTitle(doc.meta.title || "Untitled Screenplay");
        useEditorStore.getState().setSaveStatus("idle");
        lastSavedJsonRef.current = "";
        requestAnimationFrame(() => updateScenes());
      } finally {
        scriptSwitchingRef.current = false;
      }
    },
    [editor, setCurrentDocId, setDocumentTitle, updateScenes],
  );

  // --- Boot the storage layer ---
  //
  // Reads the persisted mode, reconnects the disk handle if there is one, and
  // decides whether the first-run mode picker needs to appear. Runs once, and
  // only after the editor exists so a document can be applied straight away.
  const storageBootedRef = useRef(false);
  useEffect(() => {
    if (!editor || storageBootedRef.current) return;
    storageBootedRef.current = true;
    // No cancellation guard: this effect is a run-once (via the ref above),
    // not a per-render subscription, and the editor it applies results to
    // outlives the whole session — there's nothing to race against. Dev-only
    // StrictMode remounts the effect but doesn't really unmount the
    // component, so bailing out on "cancelled" here would just discard the
    // one real boot outcome.
    (async () => {
      try {
        const boot = await restoreStorageOnBoot();
        const status = useBrowserStorageStatusStore.getState();
        status.setMode(boot.mode);
        status.setNeedsDiskReconnect(boot.needsDiskReconnect);

        if (boot.isFirstRun) {
          setShowStorageModes(true);
          return;
        }
        // Returning user: pull whatever the active provider is holding.
        if (boot.mode === "disk" && !boot.needsDiskReconnect) {
          const doc = await diskHandleProvider.load();
          if (doc) {
            applyStoredDoc(doc);
            setShowWelcome(false);
          }
        } else if (boot.mode === "browser") {
          // Browser mode has no file handle to reconnect to — the last
          // document id (persisted whenever `setCurrentDocId` runs) is the
          // only pointer back to what was open. Falls through to the
          // welcome dialog's blank/sample/import choice if there's no
          // recorded id, or that id no longer resolves to a document.
          const lastId = await getLastActiveDocId();
          if (lastId) {
            try {
              const doc = await loadActiveDoc(lastId);
              if (doc) {
                applyStoredDoc(doc);
                setShowWelcome(false);
              }
            } catch {
              /* fall through to the blank/sample/import choice */
            }
          }
        }
      } catch (err) {
        console.error("Storage boot failed:", err);
      }
    })();
  }, [editor, applyStoredDoc]);

  // File → Open… — the only way back to the storage/document picker once the
  // first-run dialog has been dismissed (Browser mode otherwise has no menu
  // path to a previously saved document). Read directly at render time rather
  // than mirrored into local state, so there's nothing to keep in sync.
  const storagePickerOpen = useEditorStore((s) => s.storagePickerOpen);
  const setStoragePickerOpen = useEditorStore((s) => s.setStoragePickerOpen);

  /**
   * Switch storage mode mid-document — the current document moves with it,
   * same idea as "Save As" but for any target mode, not just disk. No load
   * happens here (that would clobber what's on screen): the new provider is
   * acquired, then what's currently open is written straight into it.
   */
  const handleSwitchStorageMode = useCallback(
    async (mode: StorageMode) => {
      if (getActiveMode() === mode) return;
      const title = useEditorStore.getState().documentTitle;
      const ok = await switchModeKeepingDoc(mode, title);
      if (!ok) return;
      useBrowserStorageStatusStore.getState().setMode(mode);
      if (mode === "memory") {
        showToast({
          description:
            "Now editing without automatic saving — use File → Export to save",
          type: "info",
        });
        return;
      }
      const doc = buildStorageDoc();
      if (!doc) return;
      try {
        await saveActiveDoc(doc);
        useBrowserStorageStatusStore.getState().noteSuccess();
        showToast({
          description:
            mode === "disk"
              ? "Now saving to that file automatically"
              : "Now saving automatically in this browser",
          type: "success",
        });
      } catch (err) {
        showToast({
          description: `Could not switch storage: ${err instanceof Error ? err.message : String(err)}`,
          type: "error",
        });
      }
    },
    [buildStorageDoc],
  );

  /** "Save to a file" — the disk-specific shorthand used by the save-failure
   *  recovery banner below. */
  const handleSaveAs = useCallback(
    () => handleSwitchStorageMode("disk"),
    [handleSwitchStorageMode],
  );

  // File → Switch Storage — consumes a pending request set from the header
  // menu (a different component; this is the same store-flag bridge as
  // storagePickerOpen above).
  const switchStorageModeRequest = useEditorStore(
    (s) => s.switchStorageModeRequest,
  );
  const setSwitchStorageModeRequest = useEditorStore(
    (s) => s.setSwitchStorageModeRequest,
  );
  useEffect(() => {
    if (!switchStorageModeRequest) return;
    const mode = switchStorageModeRequest;
    setSwitchStorageModeRequest(null);
    void handleSwitchStorageMode(mode);
  }, [
    switchStorageModeRequest,
    setSwitchStorageModeRequest,
    handleSwitchStorageMode,
  ]);

  /** A mode was picked in the first-run dialog. */
  const handleStorageModeChosen = useCallback(
    async (_mode: unknown, docId?: string) => {
      setShowStorageModes(false);
      setStoragePickerOpen(false);
      if (docId) {
        // An existing Browser document — open it and skip blank/sample/import.
        try {
          const doc = await loadActiveDoc(docId);
          if (doc) {
            applyStoredDoc(doc);
            setShowWelcome(false);
            return;
          }
        } catch (err) {
          showToast({
            description: `Could not open that document: ${err instanceof Error ? err.message : String(err)}`,
            type: "error",
          });
        }
      }
      const provider = getActiveMode();
      if (provider === "memory" || provider === "disk") {
        // Both may already be holding a document from the picker.
        try {
          const doc = await loadActiveDoc();
          if (doc) {
            applyStoredDoc(doc);
            setShowWelcome(false);
            return;
          }
        } catch {
          /* fall through to the blank/sample/import choice */
        }
      }
      setShowWelcome(true);
    },
    [applyStoredDoc, setStoragePickerOpen],
  );

  // --- Sync orphaned marks: runs ONCE after editor is ready, not on every doc change ---
  const orphanSyncDone = useRef(false);
  useEffect(() => {
    if (!editor || orphanSyncDone.current) return;
    const timer = setTimeout(() => {
      orphanSyncDone.current = true;
      const store = useEditorStore.getState();
      const noteMarkType = editor.schema.marks.scriptNote;
      const tagMarkType = editor.schema.marks.productionTag;
      const noteIds = new Set(store.notes.map((n) => n.id));
      const tagIds = new Set(store.tags.map((t) => t.id));
      const orphanedNotes: {
        noteId: string;
        text: string;
        elementType: string;
      }[] = [];
      const orphanedTags: {
        tagId: string;
        categoryId: string;
        color: string;
        text: string;
        elementType: string;
      }[] = [];

      editor.state.doc.descendants((node) => {
        if (!node.isText) return;
        for (const mark of node.marks) {
          if (noteMarkType && mark.type === noteMarkType) {
            const id = mark.attrs.noteId as string;
            if (id && !noteIds.has(id)) {
              orphanedNotes.push({
                noteId: id,
                text: node.textContent.slice(0, 80),
                elementType: "action",
              });
              noteIds.add(id);
            }
          }
          if (tagMarkType && mark.type === tagMarkType) {
            const id = mark.attrs.tagId as string;
            if (id && !tagIds.has(id)) {
              orphanedTags.push({
                tagId: id,
                categoryId: (mark.attrs.categoryId as string) || "props",
                color: (mark.attrs.color as string) || "#9370DB",
                text: node.textContent.slice(0, 80),
                elementType: "action",
              });
              tagIds.add(id);
            }
          }
        }
      });

      if (orphanedNotes.length > 0) {
        store.setNotes([
          ...store.notes,
          ...orphanedNotes.map((o) => ({
            id: o.noteId,
            content: "",
            anchorText: o.text,
            elementType: o.elementType,
            contextLabel: "",
            color: "Yellow" as const,
            createdAt: new Date().toISOString(),
            sceneId: null,
          })),
        ]);
      }
      if (orphanedTags.length > 0) {
        store.setTags([
          ...store.tags,
          ...orphanedTags.map((o) => ({
            id: o.tagId,
            categoryId: o.categoryId,
            name: o.text,
            text: o.text,
            notes: "",
            sceneId: null,
            elementType: o.elementType,
            createdAt: new Date().toISOString(),
          })),
        ]);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [editor]);

  // --- Scroll → current page tracking ---
  // ov.top is in the page's unscaled coordinate system; pageRect/containerRect
  // are in viewport (scaled) space, so ov.top must be multiplied by the zoom
  // scale before mixing with rect deltas.
  const handleScroll = useCallback(() => {
    if (!editorMainRef.current || !pageRef.current) return;
    const containerTop = editorMainRef.current.getBoundingClientRect().top;
    const pageTop = pageRef.current.getBoundingClientRect().top;
    const scale = (zoomLevelRef.current || 100) / 100;
    let page = 1;
    for (const ov of overlays) {
      if (pageTop + ov.top * scale - containerTop < 50) page = ov.pageNumber;
    }
    setCurrentPage(page);
  }, [overlays, setCurrentPage]);

  useEffect(() => {
    const el = editorMainRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleGoToPage = useGoToPage({
    editorMainRef,
    pageRef,
    overlays,
    zoomLevelRef,
    pageLayoutRef,
  });

  const setGoToPage = useEditorStore((s) => s.setGoToPage);

  useEffect(() => {
    setGoToPage(handleGoToPage);
  }, [handleGoToPage, setGoToPage]);

  // --- Go to page ---
  // Jump instantly: smooth-scrolling thousands of pixels on a long screenplay
  // takes seconds. ov.top is unscaled, so multiply by zoom scale to land on
  // the correct page when zoom != 100%. ov.top sits at the top of the page
  // separator block (previous page's bottom margin + gap + new page's top
  // margin). Skip past the previous-page bottom margin and the 40px visual
  // gap so the new page (with its header line at the top) lands flush with
  // the viewport top — not flush with the start of the body content, which
  // would hide the page header and look like we'd overshot.
  // const handleGoToPage = useCallback(
  //   (page: number) => {
  //     if (!editorMainRef.current || !pageRef.current) return
  //     if (page <= 1) {
  //       editorMainRef.current.scrollTo({ top: 0, behavior: 'auto' })
  //       return
  //     }
  //     const ov = overlays.find((o) => o.pageNumber === page)
  //     if (ov) {
  //       const pageRect = pageRef.current.getBoundingClientRect()
  //       const containerRect = editorMainRef.current.getBoundingClientRect()
  //       const scale = (zoomLevelRef.current || 100) / 100
  //       const layout = pageLayoutRef.current
  //       const bottomMarginPx = (layout.bottomMargin / 72) * 96
  //       const pageTopOffset = ov.top + bottomMarginPx + 40 // 40 = page-sep-gap
  //       const scrollTo =
  //         editorMainRef.current.scrollTop +
  //         (pageRect.top + pageTopOffset * scale - containerRect.top)
  //       editorMainRef.current.scrollTo({ top: scrollTo, behavior: 'auto' })
  //     }
  //   },
  //   [overlays],
  // )

  // Wire up the picker trigger
  showPickerRef.current = useCallback(
    (defaultType: ElementType, availableTypes?: ElementType[]) => {
      if (!editor) return;
      // Use requestAnimationFrame so the DOM has settled after the split
      requestAnimationFrame(() => {
        if (!editor.view) return;
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        setPickerState({
          visible: true,
          position: { top: coords.bottom + 4, left: coords.left },
          defaultType,
          availableTypes,
        });
      });
    },
    [editor],
  );

  // Bridge: let the AvKeymap extension surface the same element picker, but
  // restricted to the cell-valid types (avPara/avShot/avDirection).
  React.useEffect(() => {
    registerAvCellPicker((defaultType, types) => {
      showPickerRef.current(
        defaultType as ElementType,
        types as readonly ElementType[] as ElementType[],
      );
    });
    return () => registerAvCellPicker(null);
  }, []);

  const handlePickerSelect = useCallback(
    (type: ElementType) => {
      if (!editor) return;
      // setNode works for any real schema node (built-in screenplay elements as
      // well as the AV inner types avPara/avShot/avDirection). Custom-id elements
      // declared only in template rules go through the customElement wrapper.
      if (editor.schema.nodes[type]) {
        editor.chain().focus().setNode(type).run();
      } else {
        const tpl = useFormattingTemplateStore.getState().getActiveTemplate();
        const rule = tpl.rules[type];
        if (rule) {
          editor
            .chain()
            .focus()
            .setNode("customElement", {
              customTypeId: type,
              customLabel: rule.label,
            })
            .run();
        }
      }
      setPickerState((s) => ({ ...s, visible: false }));
    },
    [editor],
  );

  const handlePickerDismiss = useCallback(() => {
    setPickerState((s) => ({ ...s, visible: false }));
    // Re-focus editor
    editor?.commands.focus();
  }, [editor]);

  const handleWelcomeChoice = useCallback(
    async (choice: WelcomeChoice) => {
      setShowWelcome(false);
      localStorage.setItem("opendraft:welcomed", "true");

      if (choice === "sample") {
        editor?.commands.setContent(SAMPLE_CONTENT, true);
        if (editor) clearEditorHistory(editor);
      } else if (choice === "import") {
        if (!editor) return;
        const result = await openBinaryFile([
          {
            name: "Screenplay",
            extensions: ["fountain", "fdx", "txt", "sceneplay", "odraft"],
          },
        ]);
        if (!result) return;

        const { name, content: buf } = result;
        const isNative = isSceneplayFile(name);
        // fdx/fountain/txt are always text; a native file may be a v3 zip or
        // legacy flat JSON — parseSceneplayAny sniffs which, reading `buf`
        // directly, so this decode is only needed for the other formats.
        const text = isNative ? "" : new TextDecoder().decode(buf);

        if (isNative) {
          // Full document, not a plain-content import — restore everything
          // (notes, tags, characters, layout, embedded assets) the same way
          // opening a stored document does.
          const parsed = await parseSceneplayAny(buf);
          applyStoredDoc({
            id: "",
            meta: parsed.meta,
            content: parsed.content,
            assets: parsed.assets,
            updatedAt: new Date().toISOString(),
          });
          // An imported file is a new, unsaved document — drop the id
          // applyStoredDoc just set so the next autosave mints a fresh one
          // instead of overwriting whatever the source file's own id was.
          setCurrentDocId(null);
          useEditorStore.getState().setImportedSource({
            name,
            format: name.toLowerCase().endsWith(".odraft")
              ? "OpenDraft (.odraft)"
              : "Sceneplay (.sceneplay)",
          });
          return;
        }

        const ext = name.split(".").pop()?.toLowerCase();
        let doc;
        if (ext === "fdx") {
          const parsed = parseFDXFull(text);
          doc = parsed.doc;
          if (parsed.pageLayout) {
            useEditorStore.getState().setPageLayout({
              ...useEditorStore.getState().pageLayout,
              ...parsed.pageLayout,
            });
          }
          if (parsed.beats.length > 0) {
            const store = useEditorStore.getState();
            store.setBeats(parsed.beats);
            if (parsed.beatColumns.length > 0) {
              store.setBeatColumns(parsed.beatColumns);
            }
          }
          if (
            parsed.castList.length > 0 ||
            parsed.characterHighlighting.length > 0
          ) {
            const store = useEditorStore.getState();
            const highlightMap = new Map(
              parsed.characterHighlighting.map((h) => [
                h.name.toUpperCase(),
                h,
              ]),
            );
            for (const member of parsed.castList) {
              const hl = highlightMap.get(member.name.toUpperCase());
              store.upsertCharacterProfile(member.name, {
                description: member.description,
                color: hl?.color || "",
                highlighted: hl?.highlighted || false,
              });
              highlightMap.delete(member.name.toUpperCase());
            }
            for (const [, hl] of highlightMap) {
              store.upsertCharacterProfile(hl.name, {
                color: hl.color,
                highlighted: hl.highlighted,
              });
            }
          }
        } else {
          doc = parseFountain(text);
        }
        editor.commands.setContent(doc, true);
        clearEditorHistory(editor);
        const scriptTitle = name.replace(/\.\w+$/, "") || "Untitled";
        useEditorStore.getState().setDocumentTitle(scriptTitle);
        const fmtLabel =
          ext === "fdx"
            ? "Final Draft (.fdx)"
            : ext === "fountain"
              ? "Fountain (.fountain)"
              : ext
                ? `.${ext}`
                : "imported file";
        useEditorStore.getState().setImportedSource({ name, format: fmtLabel });
      }
      // 'blank' — editor already has empty content, nothing to do
    },
    [editor, applyStoredDoc, setCurrentDocId],
  );

  // ── Drag-and-drop file import ─────────────────────────────────────────
  const IMPORTABLE_EXTENSIONS = [
    "sceneplay",
    "fdx",
    "fountain",
    "odraft",
    "txt",
  ];

  const hasUnsavedChanges = useCallback((): boolean => {
    if (!editor) return false;
    const content = buildSaveContent();
    if (!content) return false;
    const json = JSON.stringify(content);
    return json !== lastSavedJsonRef.current && lastSavedJsonRef.current !== "";
  }, [editor, buildSaveContent]);

  const importDroppedFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      try {
        const text = await file.text();
        const ext = file.name.split(".").pop()?.toLowerCase();
        const title = file.name.replace(/\.\w+$/, "") || "Untitled";

        let doc: any;
        if (ext === "fdx") {
          const parsed = parseFDXFull(text);
          doc = parsed.doc;
          if (parsed.pageLayout) {
            useEditorStore.getState().setPageLayout({
              ...useEditorStore.getState().pageLayout,
              ...parsed.pageLayout,
            });
          }
          if (parsed.beats.length > 0) {
            const store = useEditorStore.getState();
            store.setBeats(parsed.beats);
            if (parsed.beatColumns.length > 0)
              store.setBeatColumns(parsed.beatColumns);
          }
          if (
            parsed.castList.length > 0 ||
            parsed.characterHighlighting.length > 0
          ) {
            const store = useEditorStore.getState();
            const highlightMap = new Map(
              parsed.characterHighlighting.map((h) => [
                h.name.toUpperCase(),
                h,
              ]),
            );
            for (const member of parsed.castList) {
              const hl = highlightMap.get(member.name.toUpperCase());
              store.upsertCharacterProfile(member.name, {
                description: member.description,
                color: hl?.color || "",
                highlighted: hl?.highlighted || false,
              });
              highlightMap.delete(member.name.toUpperCase());
            }
            for (const [, hl] of highlightMap) {
              store.upsertCharacterProfile(hl.name, {
                color: hl.color,
                highlighted: hl.highlighted,
              });
            }
          }
        } else if (ext === "odraft") {
          const parsed = parseOdraft(text);
          doc = parsed.content;
          // Bring back notes, tags, beats, character profiles and layout. Without
          // this an imported .odraft — including a restored backup — came back as
          // bare text with all of that silently dropped.
          hydrateEditorStoresFromContent(parsed.content);
          if (parsed.meta.title) {
            setDocumentTitle(parsed.meta.title);
            editor.commands.setContent(doc, true);
            clearEditorHistory(editor);
            setShowWelcome(false);
            return;
          }
        } else {
          doc = parseFountain(text);
        }

        editor.commands.setContent(doc, true);
        clearEditorHistory(editor);
        setDocumentTitle(title);
        setShowWelcome(false);
        const FORMAT_LABELS: Record<string, string> = {
          fdx: "Final Draft (.fdx)",
          fountain: "Fountain (.fountain)",
          sceneplay: "Sceneplay (.sceneplay)",
          odraft: "OpenDraft (.odraft)",
        };
        const fmtLabel =
          (ext && FORMAT_LABELS[ext]) || (ext ? `.${ext}` : "imported file");
        useEditorStore
          .getState()
          .setImportedSource({ name: file.name, format: fmtLabel });
      } catch (err) {
        console.error("Failed to import dropped file:", err);
        showToast({
          description: `Failed to import file: ${err instanceof Error ? err.message : String(err)}`,
          type: "error",
        });
      }
    },
    [editor, setDocumentTitle],
  );

  const handleEditorDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverEditor(true);
  }, []);

  const handleEditorDragLeave = useCallback((e: React.DragEvent) => {
    // Only close if leaving the editor-main container itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverEditor(false);
  }, []);

  const handleEditorDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverEditor(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !IMPORTABLE_EXTENSIONS.includes(ext)) {
        showToast({
          description:
            "Unsupported file type. Drop a .fdx, .fountain, .odraft, or .txt file.",
          type: "error",
        });
        return;
      }

      if (hasUnsavedChanges()) {
        setPendingDropFile(file);
        setDropConfirmOpen(true);
      } else {
        importDroppedFile(file);
      }
    },
    [IMPORTABLE_EXTENSIONS, hasUnsavedChanges, importDroppedFile],
  );

  const handleDropConfirmSave = useCallback(async () => {
    // Flush the current document to the active provider before replacing it.
    const doc = buildStorageDoc();
    if (doc) {
      try {
        await saveActiveDoc(doc);
        lastSavedJsonRef.current = JSON.stringify(doc.content);
      } catch (err) {
        showToast({
          description: `Save failed: ${err instanceof Error ? err.message : String(err)}`,
          type: "error",
        });
      }
    }
    setDropConfirmOpen(false);
    if (pendingDropFile) {
      importDroppedFile(pendingDropFile);
      setPendingDropFile(null);
    }
  }, [buildStorageDoc, pendingDropFile, importDroppedFile]);

  const handleDropConfirmDiscard = useCallback(() => {
    setDropConfirmOpen(false);
    if (pendingDropFile) {
      importDroppedFile(pendingDropFile);
      setPendingDropFile(null);
    }
  }, [pendingDropFile, importDroppedFile]);

  const handleDropConfirmCancel = useCallback(() => {
    setDropConfirmOpen(false);
    setPendingDropFile(null);
  }, []);

  const handleCharAutoSelect = useCallback(
    (name: string) => {
      if (!editor) return;
      // Replace the current character block text with the selected name
      const { $from } = editor.state.selection;
      const start = $from.start();
      const end = $from.end();
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.insertText(name, start, end);
          return true;
        })
        .run();
      setCharAutoState((s) => ({ ...s, visible: false }));
    },
    [editor],
  );

  const handleCharAutoDismiss = useCallback(() => {
    setCharAutoState((s) => ({ ...s, visible: false }));
    charAutoDismissedRef.current = true;
  }, []);

  const handleSlugAutoSelect = useCallback(
    (value: string) => {
      if (!editor || !slugSegmentRef.current) return;
      const { from, to } = slugSegmentRef.current;
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.insertText(value, from, to);
          return true;
        })
        .run();
      setSlugAutoState((s) => ({ ...s, visible: false }));
    },
    [editor],
  );

  const handleSlugAutoDismiss = useCallback(() => {
    setSlugAutoState((s) => ({ ...s, visible: false }));
    slugAutoDismissedRef.current = true;
  }, []);

  // --- Click on script note highlight → auto-filter notes panel ---
  // Only opens the panel when note highlights are visible (notesVisible).
  // When highlights are off, clicks pass through as normal editing.
  useEffect(() => {
    if (!editor) return;
    const handleClick = (e: MouseEvent) => {
      const store = useEditorStore.getState();
      // Only intercept clicks when highlights are visible
      if (!store.notesVisible) return;

      const target = e.target as HTMLElement;
      const noteEl = target.closest(
        ".script-note-highlight",
      ) as HTMLElement | null;
      if (!noteEl) return;

      const noteId = noteEl.getAttribute("data-note-id");
      if (!noteId) return;

      const note = store.notes.find((n) => n.id === noteId);
      if (!note) return;

      // Filter to this specific note
      store.setNoteFilter({
        elementType: null,
        contextLabel: null,
        color: null,
        noteId: noteId,
      });

      // Open the notes panel if not already open
      if (!store.scriptNotesOpen) store.toggleScriptNotes();
    };

    const editorEl = editor.view.dom;
    editorEl.addEventListener("click", handleClick);
    return () => editorEl.removeEventListener("click", handleClick);
  }, [editor]);

  // --- Click on a roll anchor glyph → jump to it in the Rolls sidebar ---
  useEffect(() => {
    if (!editor) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchorEl = target.closest(
        ".roll-anchor-glyph",
      ) as HTMLElement | null;
      if (!anchorEl) return;

      const anchorId = anchorEl.getAttribute("data-anchor-id");
      if (!anchorId) return;

      useActivityBarStore.getState().setActiveView("rolls");
      useRollNoteStore.getState().setFocusedRollId(anchorId);
    };

    const editorEl = editor.view.dom;
    editorEl.addEventListener("click", handleClick);
    return () => editorEl.removeEventListener("click", handleClick);
  }, [editor]);

  // --- Click on character element → expand in character panel ---
  useEffect(() => {
    if (!editor) return;
    const handleCharClick = (e: MouseEvent) => {
      const store = useEditorStore.getState();
      if (!store.characterProfilesOpen) return;

      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos) return;

      const resolved = editor.state.doc.resolve(pos.pos);
      const node = resolved.parent;

      if (node.type.name === "character") {
        const base = characterKey(node.textContent);
        if (base) {
          store.setSelectedCharacter(base);
        }
      }
    };

    const editorEl = editor.view.dom;
    editorEl.addEventListener("click", handleCharClick);
    return () => editorEl.removeEventListener("click", handleCharClick);
  }, [editor]);

  const handleCtxMenuClose = useCallback(() => {
    setCtxMenuState((s) => ({ ...s, visible: false }));
  }, []);

  // --- Spell check: open modal when toggled on (or from menu) ---
  // The modal is opened via the Tools menu or spellCheckEnabled toggle.

  const zoomScale = zoomLevel / 100;
  const isContinuous = viewMode === "continuous";

  // Compute last-page footer position so the last page shows its full extent
  const lastPageEnd = useMemo(() => {
    const m = getPageMetrics(pageLayout);
    if (overlays.length > 0) {
      const lastOverlay = overlays[overlays.length - 1];
      return lastOverlay.top + m.sepHeightPx + m.pageContentPx;
    }
    // Single page: content starts after top padding
    const topMarginPx = (pageLayout.topMargin / 72) * 96;
    return topMarginPx + m.pageContentPx;
  }, [overlays, pageLayout]);

  return (
    <div className="app-container flex flex-col h-(--app-h) w-full overflow-hidden">
      {saveStatus === "error" && (
        <div className="flex items-center gap-2.5 bg-linear-to-r from-[#3a1a1a] to-[#3a2a1a] px-4 py-1.5 border-[#7a3a3a] border-b min-h-8 text-[#e0a0a0] text-[13px] save-failure-banner shrink-0">
          <span className="text-[#ef4444] text-base shrink-0">&#9888;</span>
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            Auto-save failed{saveError ? `: ${saveError}` : ""}. Your changes
            may not be saved.
          </span>
          <button
            className="bg-transparent hover:bg-[#4a2a2a] px-2.5 py-0.75 border border-[#7a3a3a] rounded text-[#e0a0a0] text-xs whitespace-nowrap cursor-pointer save-failure-btn"
            onClick={() => {
              const doc = buildStorageDoc();
              if (!doc) return;
              setSaveStatus("saving");
              saveActiveDoc(doc)
                .then(() => {
                  lastSavedJsonRef.current = JSON.stringify(doc.content);
                  useBrowserStorageStatusStore.getState().noteSuccess();
                  setSaveStatus("saved");
                  showToast({
                    description: "Saved successfully",
                    type: "success",
                  });
                })
                .catch((err) => {
                  const msg = err instanceof Error ? err.message : String(err);
                  setSaveStatus("error", msg);
                });
            }}
          >
            Retry
          </button>
          <button
            className="bg-transparent hover:bg-[#4a2a2a] px-2.5 py-0.75 border border-[#7a3a3a] rounded text-[#e0a0a0] text-xs whitespace-nowrap cursor-pointer save-failure-btn"
            onClick={() => void handleSaveAs()}
          >
            Save to a File…
          </button>
          <button
            className="bg-transparent hover:bg-[#4a2a2a] px-2.5 py-0.75 border border-[#7a3a3a] rounded text-[#e0a0a0] text-xs whitespace-nowrap cursor-pointer save-failure-btn"
            onClick={() => {
              // Goes through downloadOdraft so the file gets the native
              // envelope and the app can actually reopen it. Writing a bare
              // payload here would produce a file parseOdraft rejects — an
              // emergency backup that cannot be imported.
              const content = buildSaveContent();
              if (!content) return;
              const store = useEditorStore.getState();
              const title = store.documentTitle || "Untitled";
              downloadOdraft(
                {
                  id: "",
                  title,
                  author: "",
                  format: "json",
                  created_at: "",
                  updated_at: "",
                  page_count: store.pageCount,
                  size_bytes: 0,
                  color: "",
                  pinned: false,
                  sort_order: 0,
                  preview: "",
                },
                content,
                { backupKind: "crash" },
              )
                .then(() =>
                  showToast({
                    description: "Backup exported",
                    type: "success",
                  }),
                )
                .catch((err) =>
                  showToast({
                    description: `Backup export failed: ${err instanceof Error ? err.message : String(err)}`,
                    type: "error",
                  }),
                );
            }}
          >
            Export Backup
          </button>
          <button
            className="bg-transparent px-1 py-0 border-none text-[#e0a0a0] text-base leading-none cursor-pointer save-failure-dismiss"
            onClick={() => setSaveStatus("unsaved")}
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden editor-layout">
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden editor-center">
          {
            <div
              className="editor-main flex-1 overflow-y-auto overflow-x-auto bg-(--fd-bg) flex justify-center pt-[30px] pb-[60px]"
              ref={editorMainRef}
              onDragOver={handleEditorDragOver}
              onDragLeave={handleEditorDragLeave}
              onDrop={handleEditorDrop}
            >
              {isContinuous && (
                <div
                  className={`page continuous${!tagsVisible ? " tags-hidden" : ""}${!notesVisible ? " notes-hidden" : ""}${!itemsVisible ? " items-hidden" : ""}`}
                  ref={pageRef}
                  style={{
                    fontFamily: `'${fontFamily}', 'Courier New', Courier, monospace`,
                    fontSize: `${fontSize}pt`,
                  }}
                >
                  <EditorContent editor={editor} />
                </div>
              )}
              {!isContinuous && (
                <div
                  className="page-sizer"
                  style={{
                    width: `calc(${pageLayout.pageWidth}in * ${zoomScale})`,
                    minWidth: `calc(${pageLayout.pageWidth}in * ${zoomScale})`,
                  }}
                >
                  <div
                    className="page-container"
                    style={{
                      transform: `scale(${zoomScale})`,
                      transformOrigin: "top left",
                      width: `${pageLayout.pageWidth}in`,
                      minWidth: `${pageLayout.pageWidth}in`,
                      maxWidth: `${pageLayout.pageWidth}in`,
                    }}
                  >
                    <div
                      className={`page${!tagsVisible ? " tags-hidden" : ""}${!notesVisible ? " notes-hidden" : ""}${!itemsVisible ? " items-hidden" : ""}${sceneNumbersVisible ? " show-scene-numbers" : ""}`}
                      ref={pageRef}
                      style={{
                        fontFamily: `'${fontFamily}', 'Courier New', Courier, monospace`,
                        fontSize: `${fontSize}pt`,
                        width: `${pageLayout.pageWidth}in`,
                        minHeight: `${lastPageEnd + (pageLayout.bottomMargin / 72) * 96}px`,
                        paddingTop: `${pageLayout.topMargin}pt`,
                        paddingBottom: `${pageLayout.bottomMargin}pt`,
                        paddingLeft: `${pageLayout.leftMargin}in`,
                        paddingRight: `${pageLayout.rightMargin}in`,
                        // CSS variables for element padding calculations
                        ...({
                          "--pl": `${pageLayout.leftMargin}in`,
                        } as React.CSSProperties),
                        ...({
                          "--pr": `${pageLayout.rightMargin}in`,
                        } as React.CSSProperties),
                        ...({
                          "--pw": `${pageLayout.pageWidth}in`,
                        } as React.CSSProperties),
                      }}
                    >
                      {/* Page break separators — absolutely positioned, full page width */}
                      {overlays.map((ov) => {
                        const hContent =
                          pageLayout.headerContent || DEFAULT_HEADER_CONTENT;
                        const fContent =
                          pageLayout.footerContent || DEFAULT_FOOTER_CONTENT;
                        const hStart = pageLayout.headerStartPage ?? 2;
                        const fStart = pageLayout.footerStartPage ?? 1;
                        const {
                          documentTitle: docTitle,
                          revisionColor: revColor,
                          pageCount: totalPages,
                        } = useEditorStore.getState();
                        const showHeader =
                          ov.pageNumber >= hStart && !ov.isTitlePage;
                        // The footer belongs to the page BEFORE this break (ov.pageNumber - 1).
                        // For the title-page break that previous page IS the title page, which
                        // is unnumbered and carries no header/footer.
                        const footerPage = ov.pageNumber - 1;
                        const showFooterForPrev =
                          footerPage >= fStart && !ov.isTitlePage;
                        return (
                          <div
                            key={ov.pageNumber}
                            className="page-sep"
                            style={{ top: `${ov.top}px` }}
                          >
                            <div
                              className="page-sep-bottom"
                              style={{
                                height: `${pageLayout.bottomMargin}pt`,
                                position: "relative",
                              }}
                            >
                              {ov.isDialogueSplit &&
                                moresContds.dialogueBreakContd && (
                                  <div className="page-sep-more">
                                    {moresContds.moreText}
                                  </div>
                                )}
                              {showFooterForPrev &&
                                (fContent.left ||
                                  fContent.center ||
                                  fContent.right) && (
                                  <div className="page-sep-footer">
                                    <span className="page-sep-hf-left">
                                      {resolveHFFields(
                                        fContent.left,
                                        footerPage,
                                        totalPages,
                                        docTitle,
                                        revColor,
                                      )}
                                    </span>
                                    <span className="page-sep-hf-center">
                                      {resolveHFFields(
                                        fContent.center,
                                        footerPage,
                                        totalPages,
                                        docTitle,
                                        revColor,
                                      )}
                                    </span>
                                    <span className="page-sep-hf-right">
                                      {resolveHFFields(
                                        fContent.right,
                                        footerPage,
                                        totalPages,
                                        docTitle,
                                        revColor,
                                      )}
                                    </span>
                                  </div>
                                )}
                            </div>
                            <div className="page-sep-gap" />
                            <div
                              className="page-sep-top"
                              style={{ height: `${pageLayout.topMargin}pt` }}
                            >
                              {showHeader && (
                                <div className="page-sep-header">
                                  <span className="page-sep-hf-left">
                                    {resolveHFFields(
                                      hContent.left,
                                      ov.pageNumber,
                                      totalPages,
                                      docTitle,
                                      revColor,
                                    )}
                                  </span>
                                  <span className="page-sep-hf-center">
                                    {resolveHFFields(
                                      hContent.center,
                                      ov.pageNumber,
                                      totalPages,
                                      docTitle,
                                      revColor,
                                    )}
                                  </span>
                                  <span className="page-sep-hf-right">
                                    {resolveHFFields(
                                      hContent.right,
                                      ov.pageNumber,
                                      totalPages,
                                      docTitle,
                                      revColor,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                            {ov.isDialogueSplit &&
                              ov.characterName &&
                              moresContds.dialogueBreakContd && (
                                <div className="page-sep-contd">
                                  {ov.characterName}{" "}
                                  <span style={{ textTransform: "none" }}>
                                    {moresContds.contdText}
                                  </span>
                                </div>
                              )}
                          </div>
                        );
                      })}

                      {/* Last page footer — no page break follows the last page, so render its footer separately */}
                      {(() => {
                        const fContent =
                          pageLayout.footerContent || DEFAULT_FOOTER_CONTENT;
                        const fStart = pageLayout.footerStartPage ?? 1;
                        const {
                          documentTitle: docTitle,
                          revisionColor: revColor,
                          pageCount: totalPages,
                        } = useEditorStore.getState();
                        const lastPage =
                          overlays.length > 0
                            ? overlays[overlays.length - 1].pageNumber
                            : 1;
                        const showFooter =
                          lastPage >= fStart &&
                          (fContent.left || fContent.center || fContent.right);
                        if (!showFooter) return null;
                        return (
                          <div
                            className="page-sep"
                            style={{ top: `${lastPageEnd}px` }}
                          >
                            <div
                              className="page-sep-bottom"
                              style={{
                                height: `${pageLayout.bottomMargin}pt`,
                                position: "relative",
                              }}
                            >
                              <div className="page-sep-footer">
                                <span className="page-sep-hf-left">
                                  {resolveHFFields(
                                    fContent.left,
                                    lastPage,
                                    totalPages,
                                    docTitle,
                                    revColor,
                                  )}
                                </span>
                                <span className="page-sep-hf-center">
                                  {resolveHFFields(
                                    fContent.center,
                                    lastPage,
                                    totalPages,
                                    docTitle,
                                    revColor,
                                  )}
                                </span>
                                <span className="page-sep-hf-right">
                                  {resolveHFFields(
                                    fContent.right,
                                    lastPage,
                                    totalPages,
                                    docTitle,
                                    revColor,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
        </div>
        {pluginRegistry.getPanels("right-sidebar").map((p) => (
          <p.component key={p.id} editor={editor} />
        ))}
      </div>
      {pickerState.visible && (
        <ElementPicker
          position={pickerState.position}
          defaultType={pickerState.defaultType}
          availableTypes={pickerState.availableTypes}
          onSelect={handlePickerSelect}
          onDismiss={handlePickerDismiss}
        />
      )}
      {charAutoState.visible && !pickerState.visible && (
        <CharacterAutocomplete
          position={charAutoState.position}
          suggestions={charAutoState.suggestions}
          onSelect={handleCharAutoSelect}
          onDismiss={handleCharAutoDismiss}
        />
      )}
      {slugAutoState.visible && !pickerState.visible && (
        <CharacterAutocomplete
          position={slugAutoState.position}
          suggestions={slugAutoState.suggestions}
          onSelect={handleSlugAutoSelect}
          onDismiss={handleSlugAutoDismiss}
        />
      )}
      {/* Context menu on mobile: 3-finger touch only */}
      {ctxMenuState.visible && editor && (
        <ScriptContextMenu
          editor={editor}
          position={ctxMenuState.position}
          spellInfo={ctxMenuState.spellInfo}
          grammarInfo={ctxMenuState.grammarInfo}
          onClose={handleCtxMenuClose}
          onOpenFormatPanel={() => {
            // Block opening if element disallows all format overrides
            if (editor) {
              const tpl = useFormattingTemplateStore
                .getState()
                .getActiveTemplate();
              if (tpl.mode === "enforce") {
                const rule = getCurrentElementRule(editor, tpl);
                if (rule && !rule.allowFormatOverride) return;
              }
            }
            setFormatPanelOpen(true);
          }}
          overrideSelection={ctxMenuState.savedSelection}
        />
      )}
      {formatPanelOpen && editor && (
        <FormatPanel
          editor={editor}
          onClose={() => setFormatPanelOpen(false)}
        />
      )}
      {currentDocId && <AssetManager projectId={currentDocId} />}
      {(showStorageModes || storagePickerOpen) && (
        <StorageModeDialog
          suggestedTitle={useEditorStore.getState().documentTitle}
          onModeChosen={handleStorageModeChosen}
        />
      )}
      {!showStorageModes && !storagePickerOpen && showWelcome && (
        <WelcomeDialog onChoice={handleWelcomeChoice} />
      )}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleImageFileChange}
      />
      {dragOverEditor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(37,99,235,.15)",
            border: "3px dashed var(--fd-accent, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "var(--fd-bg)",
              padding: "20px 32px",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,.3)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--fd-text)",
            }}
          >
            Drop screenplay file to open
          </div>
        </div>
      )}
      {dropConfirmOpen && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
          onClick={handleDropConfirmCancel}
        >
          <div
            className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] min-w-80 max-w-100 max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              Unsaved Changes
            </div>
            <div className="flex-1 p-5 overflow-y-auto dialog-body">
              <p style={{ margin: 0, fontSize: 14, color: "var(--fd-text)" }}>
                You have unsaved changes. Would you like to save before opening
                the new file?
              </p>
            </div>
            <div className="dialog-actions flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button:hover]:bg-(--fd-menu-hover)">
              <button onClick={handleDropConfirmCancel}>Cancel</button>
              <button onClick={handleDropConfirmDiscard}>Discard</button>
              <button
                className="dialog-primary bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                onClick={handleDropConfirmSave}
              >
                Save &amp; Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenplayEditor;
