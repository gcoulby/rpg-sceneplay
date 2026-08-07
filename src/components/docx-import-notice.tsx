export const docXImportNotice = (
  <div className="flex flex-col gap-5">
    <p>
      OpenDraft will detect screenplay element types (scene heading, action,
      character, dialogue, parenthetical, transition, etc.) from the Word
      document's formatting.
    </p>
    <p>
      Detection is best-effort and depends on consistent formatting being
      applied throughout the document. Results will be accurate if you used:
    </p>
    <p>
      Final Draft, Fade In, Trelby, or Highland style names, OR Standard Final
      Draft indents (Action 1.5", Character 3.5", Dialogue 2.5", Parenthetical
      3.0"), OR Conventional text patterns (INT./EXT., ALL-CAPS character cues,
      "CUT TO:" transitions).
    </p>
  </div>
)
