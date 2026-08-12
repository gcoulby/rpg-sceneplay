import React from 'react'

export type WelcomeChoice = 'blank' | 'sample' | 'import'

interface WelcomeDialogProps {
  onChoice: (choice: WelcomeChoice) => void
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ onChoice }) => {
  return (
    <div className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto bg-black/50">
      <div
        className="welcome-card bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-xl shadow-[0_12px_40px_rgba(0,0,0,.5)] w-95 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[linear-gradient(135deg,#1a2a3a_0%,#2b2b2b_100%)] px-6 pt-8 pb-5 welcome-hero">
          <div className="w-12 h-12 mx-auto mb-3 bg-(--fd-accent) rounded-[10px] flex items-center justify-center font-bold text-[18px] text-white tracking-[1px]">
            OD
          </div>
          <h1 className="m-0 mb-1 font-semibold text-[22px] text-white">
            RPG Sceneplay
          </h1>
          <p className="text-[13px] text-(--fd-text-muted) m-0">
            Screenplay writing software for capturing Solo TTRPG Scenes
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-6 pt-5 pb-2 welcome-tips">
          <div className="flex items-center gap-2.5 text-[13px] text-(--fd-text) text-left [&_kbd]:bg-[#444] [&_kbd]:text-(--fd-text) [&_kbd]:py-px [&_kbd]:px-1.25 [&_kbd]:rounded-[3px] [&_kbd]:text-[11px] [&_kbd]:border [&_kbd]:border-[#555]">
            <span className="w-7 h-7 shrink-0 bg-[rgba(74,158,255,0.12)] rounded-md flex items-center justify-center text-sm text-(--fd-accent)">
              &#9998;
            </span>
            <span>Click the editor and start writing</span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-(--fd-text) text-left [&_kbd]:bg-[#444] [&_kbd]:text-(--fd-text) [&_kbd]:py-px [&_kbd]:px-1.25 [&_kbd]:rounded-[3px] [&_kbd]:text-[11px] [&_kbd]:border [&_kbd]:border-[#555]">
            <span className="w-7 h-7 shrink-0 bg-[rgba(74,158,255,0.12)] rounded-md flex items-center justify-center text-sm text-(--fd-accent)">
              &#8629;
            </span>
            <span>
              Press <kbd>Enter</kbd> on a blank line to pick element type
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-(--fd-text) text-left [&_kbd]:bg-[#444] [&_kbd]:text-(--fd-text) [&_kbd]:py-px [&_kbd]:px-1.25 [&_kbd]:rounded-[3px] [&_kbd]:text-[11px] [&_kbd]:border [&_kbd]:border-[#555]">
            <span className="w-7 h-7 shrink-0 bg-[rgba(74,158,255,0.12)] rounded-md flex items-center justify-center text-sm text-(--fd-accent)">
              &#8677;
            </span>
            <span>
              <kbd>Tab</kbd> cycles Action &rarr; Character &rarr; Dialogue
            </span>
          </div>
        </div>

        <p className="mt-4 mx-6 text-xs font-semibold text-(--fd-text-muted) uppercase tracking-[0.5px]">
          How would you like to start?
        </p>

        <div className="flex flex-col gap-2 px-6 pt-3">
          <button
            className="flex items-center gap-3 w-full py-3 px-3.5 bg-white/5 border border-(--fd-border) rounded-lg cursor-pointer transition-colors duration-150 text-left hover:bg-[rgba(74,158,255,0.1)] hover:border-(--fd-accent)"
            onClick={() => onChoice('blank')}
          >
            <span className="flex justify-center items-center bg-[rgba(74,158,255,0.12)] rounded-lg w-9 h-9 text-[22px] shrink-0">
              &#128196;
            </span>
            <span className="flex flex-col gap-0.5 [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:text-(--fd-text) [&_small]:text-[11px] [&_small]:text-(--fd-text-muted)">
              <strong>Blank Document</strong>
              <small>Start with an empty page</small>
            </span>
          </button>
          <button
            className="flex items-center gap-3 w-full py-3 px-3.5 bg-white/5 border border-(--fd-border) rounded-lg cursor-pointer transition-colors duration-150 text-left hover:bg-[rgba(74,158,255,0.1)] hover:border-(--fd-accent)"
            onClick={() => onChoice('sample')}
          >
            <span className="flex justify-center items-center bg-[rgba(74,158,255,0.12)] rounded-lg w-9 h-9 text-[22px] shrink-0">
              &#127916;
            </span>
            <span className="flex flex-col gap-0.5 [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:text-(--fd-text) [&_small]:text-[11px] [&_small]:text-(--fd-text-muted)">
              <strong>Sample Script</strong>
              <small>Explore with a demo screenplay</small>
            </span>
          </button>
          <button
            className="flex items-center gap-3 w-full py-3 px-3.5 bg-white/5 border border-(--fd-border) rounded-lg cursor-pointer transition-colors duration-150 text-left hover:bg-[rgba(74,158,255,0.1)] hover:border-(--fd-accent)"
            onClick={() => onChoice('import')}
          >
            <span className="flex justify-center items-center bg-[rgba(74,158,255,0.12)] rounded-lg w-9 h-9 text-[22px] shrink-0">
              &#128194;
            </span>
            <span className="flex flex-col gap-0.5 [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:text-(--fd-text) [&_small]:text-[11px] [&_small]:text-(--fd-text-muted)">
              <strong>Import File</strong>
              <small>.fountain, .fdx, or .txt</small>
            </span>
          </button>
        </div>

        <p className="py-3.5 px-6 pb-5 text-[11px] text-(--fd-text-muted) m-0 [&_strong]:text-(--fd-text)">
          Explore features in the menus above
        </p>
      </div>
    </div>
  )
}

export default WelcomeDialog
