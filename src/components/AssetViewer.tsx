import React from 'react';
import type { Asset } from '../stores/assetStore';
import { api } from '../services/api';

interface AssetViewerProps {
  asset: Asset;
  projectId: string;
  onClose: () => void;
}

const AssetViewer: React.FC<AssetViewerProps> = ({ asset, projectId, onClose }) => {
  const assetUrl = api.getAssetUrl(projectId, asset.id, asset.filename);
  const mime = asset.mime_type;

  const renderPreview = () => {
    if (mime.startsWith('image/')) {
      return <img src={assetUrl} alt={asset.original_name} className="max-w-full max-h-[60vh] object-contain rounded" />;
    }
    if (mime === 'application/pdf') {
      // Use ?disposition=inline for backend URLs; asset:// protocol serves inline by default
      const pdfUrl = assetUrl.startsWith('asset://')
        ? assetUrl
        : assetUrl + (assetUrl.includes('?') ? '&' : '?') + 'disposition=inline';
      return <embed src={pdfUrl} type="application/pdf" className="w-full h-[60vh] border-none rounded" title={asset.original_name} />;
    }
    if (mime.startsWith('audio/')) {
      return (
        <audio controls className="w-full">
          <source src={assetUrl} type={mime} />
          Your browser does not support the audio element.
        </audio>
      );
    }
    if (mime.startsWith('video/')) {
      return (
        <video controls className="max-w-full max-h-[60vh] rounded">
          <source src={assetUrl} type={mime} />
          Your browser does not support the video element.
        </video>
      );
    }
    if (mime.startsWith('text/')) {
      return <TextPreview url={assetUrl} />;
    }
    return (
      <div className="text-center p-6">
        <div className="text-5xl mb-3">&#128196;</div>
        <div className="text-sm font-medium text-(--fd-text) mb-1">{asset.original_name}</div>
        <div className="text-xs text-(--fd-text-muted) mb-4">
          {mime} &middot; {formatSize(asset.size_bytes)}
        </div>
        <a href={assetUrl} download={asset.original_name} className="inline-block py-2 px-4 bg-(--fd-accent) text-white no-underline rounded text-[13px] font-medium hover:opacity-85">
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="asset-viewer-overlay fixed inset-0 bg-black/70 z-3500 flex items-center justify-center" onClick={onClose}>
      <div className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] w-175 max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center py-2.5 px-4 border-b border-(--fd-border) shrink-0">
          <span className="text-[13px] font-semibold text-(--fd-text) overflow-hidden text-ellipsis whitespace-nowrap">{asset.original_name}</span>
          <button
            className="bg-transparent border-none text-(--fd-text-muted) text-xl cursor-pointer py-0 px-1 leading-none hover:text-(--fd-text)"
            onClick={onClose}
            aria-label="Close asset viewer"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

const TextPreview: React.FC<{ url: string }> = ({ url }) => {
  const [text, setText] = React.useState<string>('Loading...');

  React.useEffect(() => {
    fetch(url)
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText('Failed to load text content'));
  }, [url]);

  return <pre className="w-full max-h-[60vh] overflow-auto bg-[#1a1a1a] text-(--fd-text) p-4 rounded font-[Courier_New,Courier,monospace] text-xs leading-normal whitespace-pre-wrap wrap-break-word">{text}</pre>;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default AssetViewer;
