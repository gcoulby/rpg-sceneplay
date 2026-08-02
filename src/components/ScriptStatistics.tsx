import React, { useEffect, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '../stores/editorStore';
import {
  computeOverviewStats,
  computeCharacterDialogue,
  computeGenderBreakdown,
  computeSceneBreakdown,
  computePacingData,
  computeCharacterPresence,
} from '../utils/scriptStatistics';
import { computeSceneTiming, formatRuntime, formatSceneDuration, getTimingColor } from '../utils/scriptTiming';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
  AreaChart, Area,
} from 'recharts';
interface Props {
  editor: Editor;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

function formatTime(minutes: number): string {
  const h = Math.floor(minutes);
  const m = Math.round((minutes - h) * 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const ScriptStatistics: React.FC<Props> = ({ editor }) => {
  const { characterProfiles, pageCount, setStatisticsOpen, statisticsScrollTo, setStatisticsScrollTo } = useEditorStore();

  const doc = useMemo(() => editor.getJSON(), [editor]);

  const overview = useMemo(() => computeOverviewStats(doc, pageCount), [doc, pageCount]);
  const charDialogue = useMemo(() => computeCharacterDialogue(doc, characterProfiles), [doc, characterProfiles]);
  const genderStats = useMemo(() => computeGenderBreakdown(charDialogue), [charDialogue]);
  const sceneBreakdown = useMemo(() => computeSceneBreakdown(doc), [doc]);
  const pacingData = useMemo(() => computePacingData(doc), [doc]);
  const charPresence = useMemo(() => computeCharacterPresence(doc, characterProfiles), [doc, characterProfiles]);
  const timingResult = useMemo(() => computeSceneTiming(doc), [doc]);

  const sceneHeadings = useMemo(() => pacingData.map((d) => d.heading), [pacingData]);

  useEffect(() => {
    if (!statisticsScrollTo) return;
    const id = statisticsScrollTo;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setStatisticsScrollTo(null);
    }, 50);
    return () => clearTimeout(t);
  }, [statisticsScrollTo, setStatisticsScrollTo]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--fd-bg)] [&_.recharts-cartesian-axis-tick-value]:!fill-[var(--fd-text-muted)] [&_.recharts-cartesian-axis-line]:!stroke-white/[0.08] [&_.recharts-cartesian-grid-horizontal_line]:!stroke-white/[0.08] [&_.recharts-cartesian-grid-vertical_line]:!stroke-white/[0.08] [&_.recharts-legend-item-text]:!text-[var(--fd-text-muted)] [&_.recharts-legend-item-text]:!text-[11px] [&_.recharts-label]:!fill-[var(--fd-text-muted)] [&_.recharts-pie-label-text]:!fill-[var(--fd-text-muted)] [&_.recharts-pie-label-text]:!text-[10px]">
      <div className="flex items-center justify-between py-3 px-5 border-b border-[var(--fd-border)] shrink-0">
        <h2 className="text-[15px] font-semibold text-[var(--fd-text)] m-0">Script Statistics</h2>
        <button className="bg-transparent border-none text-[var(--fd-text-muted)] text-[22px] cursor-pointer py-0 px-1 leading-none rounded hover:text-[var(--fd-text)] hover:bg-white/[0.06]" onClick={() => setStatisticsOpen(false)} title="Close">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* A. Overview Cards */}
        <div className="grid grid-cols-4 gap-3 max-[768px]:grid-cols-2">
          <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4 text-center">
            <div className="text-[28px] font-bold text-[var(--fd-text)] leading-[1.2]">{overview.totalPages}</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] uppercase tracking-[0.5px] mt-1">Pages</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] mt-0.5 opacity-70">Est. {timingResult.totalSeconds > 0 ? formatRuntime(timingResult.totalSeconds) : formatTime(overview.estimatedRuntime)}</div>
          </div>
          <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4 text-center">
            <div className="text-[28px] font-bold text-[var(--fd-text)] leading-[1.2]">{overview.totalScenes}</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] uppercase tracking-[0.5px] mt-1">Scenes</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] mt-0.5 opacity-70">Avg {overview.averageSceneLength.toFixed(1)} pages</div>
          </div>
          <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4 text-center">
            <div className="text-[28px] font-bold text-[var(--fd-text)] leading-[1.2]">{overview.totalCharacters}</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] uppercase tracking-[0.5px] mt-1">Characters</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] mt-0.5 opacity-70">{overview.totalDialogueLines} dialogue lines</div>
          </div>
          <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4 text-center">
            <div className="text-[28px] font-bold text-[var(--fd-text)] leading-[1.2]">{overview.totalWords.toLocaleString()}</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] uppercase tracking-[0.5px] mt-1">Words</div>
            <div className="text-[11px] text-[var(--fd-text-muted)] mt-0.5 opacity-70">{overview.totalPages > 0 ? Math.round(overview.totalWords / overview.totalPages) : 0} per page</div>
          </div>
        </div>

        {/* B. Dialogue Distribution */}
        <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4">
          <h3 className="text-[13px] font-semibold text-[var(--fd-text)] m-0 mb-3 uppercase tracking-[0.3px]">Dialogue Distribution</h3>
          <div className="mb-3">
            {charDialogue.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, charDialogue.slice(0, 15).length * 28)}>
                <BarChart data={charDialogue.slice(0, 15)} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={95} />
                  <Tooltip
                    formatter={((value: any, name: any) => [
                      name === 'wordCount' ? `${value} words` : `${Number(value).toFixed(1)}%`,
                      name === 'wordCount' ? 'Words' : '% of dialogue',
                    ]) as any}
                    contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }}
                  />
                  <Bar dataKey="wordCount" name="wordCount" radius={[0, 3, 3, 0]}>
                    {charDialogue.slice(0, 15).map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[var(--fd-text-muted)] text-xs text-center p-6 italic">No dialogue found</div>
            )}
          </div>
          {charDialogue.length > 0 && (
            <table className="w-full border-collapse text-xs [&_th]:text-left [&_th]:text-[10px] [&_th]:text-[var(--fd-text-muted)] [&_th]:uppercase [&_th]:tracking-[0.3px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border-b [&_th]:border-[var(--fd-border)] [&_th]:font-medium [&_td]:py-[5px] [&_td]:px-2 [&_td]:text-[var(--fd-text)] [&_td]:border-b [&_td]:border-white/[0.04] [&_tbody_tr:hover]:bg-white/[0.03]">
              <thead>
                <tr>
                  <th>Character</th>
                  <th>Lines</th>
                  <th>Words</th>
                  <th>% Dialogue</th>
                  <th>Scenes</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {charDialogue.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: c.color || '#666' }} />
                      {c.name}
                    </td>
                    <td>{c.lineCount}</td>
                    <td>{c.wordCount}</td>
                    <td>{c.dialoguePercentage.toFixed(1)}%</td>
                    <td>{c.sceneCount}</td>
                    <td>{c.role || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* C. Gender Analysis */}
        {genderStats.length > 0 && (
          <div className="bg-[var(--fd-dropdown-bg)] border border-[var(--fd-border)] rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-[var(--fd-text)] m-0 mb-3 uppercase tracking-[0.3px]">Gender Analysis</h3>
            <div className="grid grid-cols-2 gap-4 items-start max-[768px]:grid-cols-1">
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genderStats}
                      dataKey="wordCount"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      paddingAngle={2}
                      label={({ gender, dialoguePercentage }: any) => `${gender} ${Number(dialoguePercentage).toFixed(0)}%`}
                    >
                      {genderStats.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={((value: any) => [`${value} words`, 'Dialogue']) as any}
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <table className="self-center w-full border-collapse text-xs [&_th]:text-left [&_th]:text-[10px] [&_th]:text-(--fd-text-muted) [&_th]:uppercase [&_th]:tracking-[0.3px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border-b [&_th]:border-(--fd-border) [&_th]:font-medium [&_td]:py-1.25 [&_td]:px-2 [&_td]:text-(--fd-text) [&_td]:border-b [&_td]:border-white/4 [&_tbody_tr:hover]:bg-white/3">
                <thead>
                  <tr><th>Gender</th><th>Characters</th><th>Lines</th><th>Words</th><th>%</th></tr>
                </thead>
                <tbody>
                  {genderStats.map((g, idx) => (
                    <tr key={g.gender}>
                      <td>
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: COLORS[idx % COLORS.length] }} />
                        {g.gender}
                      </td>
                      <td>{g.characters}</td>
                      <td>{g.lineCount}</td>
                      <td>{g.wordCount}</td>
                      <td>{g.dialoguePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* D. Scene Breakdown — 2×2 grid */}
        <div className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg p-4">
          <h3 className="text-[13px] font-semibold text-(--fd-text) m-0 mb-3 uppercase tracking-[0.3px]">Scene Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 max-[768px]:grid-cols-1">
            {/* INT vs EXT */}
            <div className="bg-black/15 rounded-md p-2.5">
              <div className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-1.5 text-center">Interior / Exterior</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'INT.', value: sceneBreakdown.intCount },
                      { name: 'EXT.', value: sceneBreakdown.extCount },
                      { name: 'INT./EXT.', value: sceneBreakdown.intExtCount },
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%" outerRadius={55}
                    label={({ name, value }: any) => `${name} ${value}`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* DAY vs NIGHT */}
            <div className="bg-black/15 rounded-md p-2.5">
              <div className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-1.5 text-center">Time of Day</div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Day', value: sceneBreakdown.dayCount },
                      { name: 'Night', value: sceneBreakdown.nightCount },
                      { name: 'Other', value: sceneBreakdown.otherTimeCount },
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%" outerRadius={55}
                    label={({ name, value }: any) => `${name} ${value}`}
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#6366f1" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Scene Length Distribution */}
            <div className="bg-black/15 rounded-md p-2.5">
              <div className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-1.5 text-center">Scene Length Distribution</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sceneBreakdown.sceneLengthBuckets} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Location Frequency */}
            <div className="bg-black/15 rounded-md p-2.5">
              <div className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-1.5 text-center">Top Locations</div>
              {sceneBreakdown.locationFrequency.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={sceneBreakdown.locationFrequency.slice(0, 8)} layout="vertical" margin={{ left: 80, right: 10, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="location" tick={{ fontSize: 9 }} width={75} />
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#14b8a6" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-(--fd-text-muted) text-xs text-center p-6 italic">No locations found</div>
              )}
            </div>
          </div>
        </div>

        {/* E. Pacing Chart */}
        {pacingData.length > 0 && (
          <div className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-(--fd-text) m-0 mb-3 uppercase tracking-[0.3px]">Pacing — Dialogue vs Action by Scene</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={pacingData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <XAxis
                  dataKey="sceneIndex"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: any) => `S${Number(v) + 1}`}
                />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'Words', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(v: any) => sceneHeadings[v as number] || `Scene ${(v as number) + 1}`}
                  formatter={((value: any, name: any) => [`${value} words`, name === 'dialogueWords' ? 'Dialogue' : 'Action']) as any}
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 4, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="dialogueWords" stackId="1" stroke="#3b82f6" fill="#3b82f680" name="dialogueWords" />
                <Area type="monotone" dataKey="actionWords" stackId="1" stroke="#f59e0b" fill="#f59e0b80" name="actionWords" />
                <Legend formatter={(value: any) => (value === 'dialogueWords' ? 'Dialogue' : 'Action')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* F. Character Presence Map */}
        {charPresence.length > 0 && (
          <div className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-(--fd-text) m-0 mb-3 uppercase tracking-[0.3px]">Character Presence by Scene</h3>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="border-collapse text-[11px] whitespace-nowrap [&_th]:p-[3px] [&_th]:text-center [&_td]:p-[3px] [&_td]:text-center">
                <thead>
                  <tr>
                    <th className="!text-left !pr-3 sticky left-0 bg-(--fd-dropdown-bg) z-1 min-w-[100px] text-(--fd-text) font-medium">Character</th>
                    {pacingData.map((_, i) => (
                      <th key={i} className="text-[9px] text-(--fd-text-muted) min-w-[18px] !font-normal" title={sceneHeadings[i]}>
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {charPresence.slice(0, 20).map((cp) => (
                    <tr key={cp.name}>
                      <td className="!text-left !pr-3 sticky left-0 bg-(--fd-dropdown-bg) z-1 min-w-[100px] text-(--fd-text) font-medium">
                        <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: cp.color || '#666' }} />
                        {cp.name}
                      </td>
                      {cp.scenes.map((present, i) => (
                        <td key={i} className="min-w-[18px] h-[18px]">
                          {present && (
                            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: cp.color || '#3b82f6' }} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* G. Timing Report */}
        {timingResult.scenes.length > 0 && (
          <div className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg p-4" id="stats-timing-report">
            <h3 className="text-[13px] font-semibold text-(--fd-text) m-0 mb-3 uppercase tracking-[0.3px]">Timing Report — Est. {formatRuntime(timingResult.totalSeconds)}</h3>
            <table className="w-full border-collapse text-xs [&_th]:text-left [&_th]:text-[10px] [&_th]:text-(--fd-text-muted) [&_th]:uppercase [&_th]:tracking-[0.3px] [&_th]:py-1.5 [&_th]:px-2 [&_th]:border-b [&_th]:border-(--fd-border) [&_th]:font-medium [&_td]:py-1.25 [&_td]:px-2 [&_td]:text-(--fd-text) [&_td]:border-b [&_td]:border-white/4 [&_tbody_tr:hover]:bg-white/3">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Scene</th>
                  <th>Dialogue</th>
                  <th>Action</th>
                  <th>Est.</th>
                  <th>Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {timingResult.scenes.map((st) => (
                  <tr key={st.sceneIndex}>
                    <td>{st.sceneIndex + 1}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {st.heading}
                    </td>
                    <td>{formatSceneDuration(st.breakdown.dialogueSeconds)}</td>
                    <td>{formatSceneDuration(st.breakdown.actionSeconds)}</td>
                    <td style={{ color: getTimingColor(st.finalSeconds), fontWeight: 600 }}>
                      {formatSceneDuration(st.finalSeconds)}
                      {st.overrideSeconds != null && <span title="Manual override"> *</span>}
                    </td>
                    <td>{formatRuntime(st.cumulativeSeconds)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--fd-border)' }}>
                  <td></td>
                  <td>TOTAL</td>
                  <td></td>
                  <td></td>
                  <td>{formatRuntime(timingResult.totalSeconds)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptStatistics;
