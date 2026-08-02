import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import Placeholder from '@tiptap/extension-placeholder';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { showToast } from './Toast';
import {
  FaBold, FaItalic, FaUnderline, FaListUl, FaListOl,
  FaQuoteLeft, FaArrowLeft, FaSave,
} from 'react-icons/fa';

/**
 * TreatmentEditor — a simplified TipTap editor for prose treatments.
 * Manuscript-format page layout (serif font, double-spaced, 1-inch margins).
 */
const TreatmentEditor: React.FC = () => {
  const { projectId, scriptId } = useParams<{ projectId: string; scriptId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('Untitled Treatment');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingRef = useRef(true);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HardBreak,
      History,
      Dropcursor,
      Gapcursor,
      Placeholder.configure({
        placeholder: 'Start writing your treatment…',
      }),
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'treatment-content min-h-[200px] outline-none focus:outline-none [&_.ProseMirror-focused]:outline-none',
      },
    },
  });

  // Load existing treatment content
  useEffect(() => {
    if (!projectId || !scriptId || !editor) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await api.getScript(projectId, scriptId);
        if (cancelled) return;
        setTitle(resp.meta.title || 'Untitled Treatment');
        const c = resp.content as { type?: string; content?: unknown[] } | null | undefined;
        if (c && c.type === 'doc' && Array.isArray(c.content) && c.content.length > 0) {
          editor.commands.setContent(c as any);
        }
      } catch (err) {
        console.error('[TreatmentEditor] load failed:', err);
        if (!cancelled) showToast(
          err instanceof Error ? err.message : 'Failed to load treatment',
          'error',
        );
      } finally {
        loadingRef.current = false;
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, scriptId, editor]);

  // Debounced autosave
  const save = useCallback(async (newTitle?: string) => {
    if (!projectId || !scriptId || !editor) return;
    if (loadingRef.current) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      await api.saveScript(projectId, scriptId, {
        title: newTitle ?? title,
        content: editor.getJSON() as Record<string, unknown>,
      });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }, [projectId, scriptId, editor, title]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), 1200);
  }, [save]);

  // Wire editor changes to autosave
  useEffect(() => {
    if (!editor) return;
    const handler = () => scheduleSave();
    editor.on('update', handler);
    return () => { editor.off('update', handler); };
  }, [editor, scheduleSave]);

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(newTitle), 1200);
  };

  const handleBack = () => {
    if (projectId) navigate(`/project/${projectId}`);
    else navigate('/projects');
  };

  const isActive = (type: string, opts?: Record<string, unknown>) =>
    editor ? editor.isActive(type, opts) : false;

  const toolBtnBase = 'bg-transparent border-none text-(--fd-text-muted) py-1.5 px-2 rounded-[3px] cursor-pointer flex items-center justify-center min-w-7 min-h-7 transition-all duration-100 hover:bg-(--fd-overlay-light) hover:text-(--fd-text)';
  const toolBtnActive = 'bg-(--fd-accent) text-white border-none py-1.5 px-2 rounded-[3px] cursor-pointer flex items-center justify-center min-w-7 min-h-7';

  return (
    <div className="fixed inset-0 flex flex-col bg-(--fd-background) z-1">
      <div className="flex items-center gap-3 py-2.5 px-4 border-b border-(--fd-border) shrink-0">
        <button
          className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) py-1.5 px-2.5 rounded cursor-pointer flex items-center hover:bg-(--fd-overlay-subtle) hover:text-(--fd-text)"
          onClick={handleBack}
          title="Back to project"
        >
          <FaArrowLeft />
        </button>
        <input
          type="text"
          className="flex-1 min-w-0 bg-transparent border border-transparent outline-none text-(--fd-text) text-lg font-semibold py-1.5 px-2.5 rounded transition-[border-color,background] duration-150 cursor-text hover:border-(--fd-border) hover:bg-(--fd-overlay-subtle) focus:border-(--fd-accent) focus:bg-(--fd-overlay-subtle)"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Treatment title…"
        />
        <div className="text-[11px] text-(--fd-text-muted)">
          {saveStatus === 'saving' && 'Saving…'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Save failed'}
        </div>
        <button
          className="bg-(--fd-accent) text-white border-none py-1.5 px-3 rounded cursor-pointer flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => save()}
          disabled={saving || !editor}
          title="Save (⌘S)"
        >
          <FaSave /> Save
        </button>
      </div>

      <div className="flex items-center gap-1 py-2 px-4 border-b border-(--fd-border) bg-(--fd-overlay-subtle) shrink-0">
        <select
          className="bg-(--fd-background) border border-(--fd-border) text-(--fd-text) py-1 px-2 rounded-[3px] text-xs mr-2"
          value={
            isActive('heading', { level: 1 }) ? 'h1' :
            isActive('heading', { level: 2 }) ? 'h2' :
            isActive('heading', { level: 3 }) ? 'h3' :
            isActive('blockquote') ? 'blockquote' :
            'paragraph'
          }
          disabled={!editor}
          onChange={(e) => {
            if (!editor) return;
            const v = e.target.value;
            const chain = editor.chain().focus();
            if (v === 'paragraph') chain.setParagraph().run();
            else if (v === 'h1') chain.toggleHeading({ level: 1 }).run();
            else if (v === 'h2') chain.toggleHeading({ level: 2 }).run();
            else if (v === 'h3') chain.toggleHeading({ level: 3 }).run();
            else if (v === 'blockquote') chain.toggleBlockquote().run();
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h1">Act / Section</option>
          <option value="h2">Sequence / Beat</option>
          <option value="h3">Sub-heading</option>
          <option value="blockquote">Block Quote</option>
        </select>
        <button
          className={isActive('bold') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor}
          title="Bold"
        ><FaBold /></button>
        <button
          className={isActive('italic') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor}
          title="Italic"
        ><FaItalic /></button>
        <button
          className={isActive('underline') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={!editor}
          title="Underline"
        ><FaUnderline /></button>
        <div className="w-px h-5 bg-(--fd-border) mx-1.5" />
        <button
          className={isActive('bulletList') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={!editor}
          title="Bullet list"
        ><FaListUl /></button>
        <button
          className={isActive('orderedList') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={!editor}
          title="Numbered list"
        ><FaListOl /></button>
        <button
          className={isActive('blockquote') ? toolBtnActive : toolBtnBase}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={!editor}
          title="Block quote"
        ><FaQuoteLeft /></button>
      </div>

      <div className="flex-1 overflow-y-auto py-10 bg-(--fd-canvas-bg,#1a1a1a)">
        <div className="treatment-page max-w-[720px] min-h-[900px] mx-auto bg-(--fd-page-bg,white) text-[#111] py-18 px-24 font-['Times_New_Roman',Times,serif] text-[12pt] leading-[2] shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="text-[#888] italic py-5">Initializing editor…</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreatmentEditor;
