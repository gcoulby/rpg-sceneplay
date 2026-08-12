import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { getAssetObjectUrl } from '../../storage/assetStore';

const LINE_HEIGHT_PX = 16; // 12pt — matches pagination LINE_HEIGHT_PT

/**
 * React NodeView for the screenplayImage node. Resolves the asset URL (or falls
 * back to an inline data URL), renders the image at its stored width with simple
 * corner resizing, and records an estimated height (in screenplay lines) so the
 * paginator can roughly account for the image.
 */
export const ScreenplayImageView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor }) => {
  const { assetId, src, width, align } = node.attrs as {
    assetId: string | null; src: string | null;
    width: number | null; align: string;
  };
  const imgRef = useRef<HTMLImageElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  // Images live outside the document as `assetId` references into IndexedDB, so
  // resolve the blob to an object URL. A stored data: URL in `src` needs no
  // lookup and is used directly below.
  useEffect(() => {
    if (src || !assetId) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      try {
        const resolved = await getAssetObjectUrl(assetId);
        if (!resolved) return;
        objectUrl = resolved;
        if (!cancelled) setBlobUrl(resolved);
      } catch { /* leave blank on failure */ }
    })();
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [assetId, src]);

  const url = useMemo(() => src || blobUrl, [src, blobUrl]);

  // On first load (no stored width), default to the natural width capped to the
  // content column, and record the rendered height in lines for pagination.
  const onLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const colWidth = (img.closest('.ProseMirror') as HTMLElement | null)?.clientWidth || 600;
    const naturalW = img.naturalWidth || 300;
    const w = width && width > 0 ? width : Math.min(naturalW, Math.round(colWidth * 0.9));
    const renderedH = (img.naturalHeight / (img.naturalWidth || 1)) * w;
    const heightLines = Math.max(1, Math.ceil(renderedH / LINE_HEIGHT_PX) + 1);
    if (!width || node.attrs.heightLines !== heightLines) {
      updateAttributes({ width: w, heightLines });
    }
  }, [width, node.attrs.heightLines, updateAttributes]);

  // Corner resize: drag to set width; height-in-lines is recomputed from aspect.
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const startX = e.clientX;
    const startW = width || img.clientWidth;
    const aspect = (img.naturalHeight || 1) / (img.naturalWidth || 1);
    const onMove = (me: MouseEvent) => {
      const w = Math.max(40, Math.round(startW + (me.clientX - startX)));
      const heightLines = Math.max(1, Math.ceil((w * aspect) / LINE_HEIGHT_PX) + 1);
      updateAttributes({ width: w, heightLines });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [width, updateAttributes]);

  const editable = editor.isEditable;

  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

  return (
    <NodeViewWrapper
      className={`block my-2 ${alignClass}`}
      data-drag-handle
    >
      <span
        className={`relative inline-block max-w-full leading-0 ${selected ? 'outline-2 outline-(--fd-accent)' : ''}`}
        style={{ width: width ? `${width}px` : undefined }}
      >
        <img
          ref={imgRef}
          src={url}
          alt=""
          draggable={false}
          onLoad={onLoad}
          className="block w-full h-auto max-w-full"
        />
        {selected && editable && (
          <span
            className="absolute -right-1.25 -bottom-1.25 w-3 h-3 bg-(--fd-accent) border border-white rounded-sm cursor-nwse-resize z-3"
            onMouseDown={startResize}
            title="Drag to resize"
          />
        )}
      </span>
    </NodeViewWrapper>
  );
};
