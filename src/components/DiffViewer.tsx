import React from 'react';

interface DiffViewerProps {
  diff: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diff }) => {
  if (!diff) {
    return (
      <div className="py-5 px-4 text-(--fd-text-muted) text-xs italic text-center">
        No diff to display
      </div>
    );
  }

  const lines = diff.split('\n');

  return (
    <div className="overflow-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-thumb]:rounded-[3px]">
      <pre className="font-['Courier_New',Courier,monospace] text-[11px] leading-normal py-2 m-0 whitespace-pre-wrap break-all">
        {lines.map((line, i) => {
          let className = 'px-4 text-(--fd-text-muted)';
          if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff ')) {
            className = 'px-4 py-0.5 text-(--fd-text) font-semibold bg-white/5';
          } else if (line.startsWith('+')) {
            className = 'px-4 bg-[rgba(80,200,80,0.15)] text-[#6fcf6f]';
          } else if (line.startsWith('-')) {
            className = 'px-4 bg-[rgba(255,80,80,0.15)] text-[#ff6b6b]';
          } else if (line.startsWith('@@')) {
            className = 'px-4 py-0.5 text-[#5cacee] bg-[rgba(92,172,238,0.08)] font-semibold';
          }
          return (
            <div key={i} className={className}>
              {line}
            </div>
          );
        })}
      </pre>
    </div>
  );
};

export default DiffViewer;
