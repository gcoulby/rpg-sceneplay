import React, { useState } from 'react';
import type { ProjectInfo, ProjectProperties, SubmissionEntry } from '../services/api';
import { api } from '../services/api';
import { showToast } from './Toast';

const EMPTY_PROPS: ProjectProperties = {
  genre: '', logline: '', synopsis: '', author: '', contact: '',
  copyright: '', draft: '', language: '', format: '',
  production_company: '', director: '', producer: '',
  status: '', target_length: '', notes: '',
  wga_registration: '', wga_registration_date: '',
  copyright_registration: '', copyright_year: '',
  agent_name: '', agent_contact: '',
  manager_name: '', manager_contact: '',
  submissions: [],
};

type FieldDef = { key: keyof ProjectProperties; label: string; type: 'text' | 'textarea' | 'select'; options?: string[] };

const FIELDS: FieldDef[] = [
  { key: 'format', label: 'Type', type: 'select', options: ['', 'Feature Film', 'TV Pilot', 'TV Episode', 'Short Film', 'Web Series', 'Documentary', 'Animation', 'Stage Play', 'Other'] },
  { key: 'genre', label: 'Genre', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['', 'Concept', 'Outline', 'First Draft', 'Revision', 'Final Draft', 'In Development', 'Pre-Production', 'Production', 'Post-Production', 'Completed'] },
  { key: 'logline', label: 'Logline', type: 'textarea' },
  { key: 'synopsis', label: 'Synopsis', type: 'textarea' },
  { key: 'author', label: 'Written By', type: 'text' },
  { key: 'director', label: 'Director', type: 'text' },
  { key: 'producer', label: 'Producer', type: 'text' },
  { key: 'production_company', label: 'Production Company', type: 'text' },
  { key: 'draft', label: 'Draft', type: 'text' },
  { key: 'language', label: 'Language', type: 'text' },
  { key: 'target_length', label: 'Target Length', type: 'text' },
  { key: 'contact', label: 'Contact Info', type: 'text' },
  { key: 'copyright', label: 'Copyright', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' },
];

const REGISTRATION_FIELDS: FieldDef[] = [
  { key: 'wga_registration', label: 'WGA Registration #', type: 'text' },
  { key: 'wga_registration_date', label: 'WGA Registration Date', type: 'text' },
  { key: 'copyright_registration', label: 'Copyright Registration #', type: 'text' },
  { key: 'copyright_year', label: 'Copyright Year', type: 'text' },
  { key: 'agent_name', label: 'Agent', type: 'text' },
  { key: 'agent_contact', label: 'Agent Contact', type: 'text' },
  { key: 'manager_name', label: 'Manager', type: 'text' },
  { key: 'manager_contact', label: 'Manager Contact', type: 'text' },
];

interface Props {
  project: ProjectInfo;
  onClose: () => void;
  onSaved: (updated: ProjectInfo) => void;
}

const EMPTY_SUBMISSION: SubmissionEntry = {
  id: '', date: '', submitted_to: '', type: '', status: '', notes: '',
};

const renderField = (
  f: FieldDef,
  value: string,
  onChange: (key: keyof ProjectProperties, val: string) => void,
) => (
  <div
    key={f.key}
    className={`flex flex-col gap-0.75 ${f.type === 'textarea' ? 'col-span-full' : ''}`}
  >
    <label className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.4px]">{f.label}</label>
    {f.type === 'textarea' ? (
      <textarea
        className="bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] py-1.5 px-2 text-[13px] outline-none resize-y font-[inherit] focus:border-(--fd-accent)"
        value={value}
        onChange={(e) => onChange(f.key, e.target.value)}
        rows={3}
      />
    ) : f.type === 'select' ? (
      <select
        className="h-7.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
        value={value}
        onChange={(e) => onChange(f.key, e.target.value)}
      >
        {f.options!.map((opt) => (
          <option key={opt} value={opt}>{opt || '— Select —'}</option>
        ))}
      </select>
    ) : (
      <input
        className="h-7.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
        value={value}
        onChange={(e) => onChange(f.key, e.target.value)}
      />
    )}
  </div>
);

const ProjectPropertiesDialog: React.FC<Props> = ({ project, onClose, onSaved }) => {
  const [name, setName] = useState(project.name);
  const [props, setProps] = useState<ProjectProperties>({ ...EMPTY_PROPS, ...project.properties });
  const [saving, setSaving] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  const setField = (key: keyof ProjectProperties, value: string) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const addSubmission = () => {
    const entry: SubmissionEntry = { ...EMPTY_SUBMISSION, id: crypto.randomUUID() };
    setProps((prev) => ({ ...prev, submissions: [...(prev.submissions || []), entry] }));
  };

  const updateSubmission = (id: string, field: keyof SubmissionEntry, value: string) => {
    setProps((prev) => ({
      ...prev,
      submissions: (prev.submissions || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const removeSubmission = (id: string) => {
    setProps((prev) => ({
      ...prev,
      submissions: (prev.submissions || []).filter((s) => s.id !== id),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProject(project.id, { name, properties: props });
      onSaved(updated);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-[var(--vv-height,100dvh)] pt-[5vh] px-4 pb-4 overflow-y-auto bg-black/50 max-[480px]:pt-[env(safe-area-inset-top,0px)] max-[480px]:px-0 max-[480px]:pb-0" onClick={onClose}>
      <div className="props-dialog bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-145 max-h-[85vh] flex flex-col max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[768px]:max-w-145 max-[480px]:w-[calc(100vw-16px)]!" onClick={(e) => e.stopPropagation()}>
        <div className="py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0 text-(--fd-text)">Project Properties</div>
        <div className="p-4 overflow-y-auto flex-1">
          {/* Project name */}
          <div className="flex flex-col gap-0.75">
            <label className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.4px]">Project Name</label>
            <input
              className="h-7.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="h-px bg-(--fd-border) my-3" />

          {/* Two-column grid for fields */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 max-[768px]:grid-cols-1">
            {FIELDS.map((f) => renderField(f, props[f.key] as string, setField))}
          </div>

          {/* Registration & Legal — collapsible */}
          <div className="h-px bg-(--fd-border) my-3" />
          <button
            className="flex items-center gap-2 bg-none border-none text-(--fd-text) text-xs font-semibold uppercase tracking-[0.5px] cursor-pointer py-1 mb-2.5 w-full text-left hover:text-(--fd-accent)"
            onClick={() => setLegalOpen(!legalOpen)}
            type="button"
          >
            <span className={`inline-block text-[9px] transition-transform duration-150 ${legalOpen ? 'rotate-90' : ''}`}>&#9654;</span>
            Registration &amp; Legal
          </button>
          {legalOpen && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 max-[768px]:grid-cols-1">
                {REGISTRATION_FIELDS.map((f) => renderField(f, props[f.key] as string, setField))}
              </div>

              {/* Submission Log */}
              <div className="col-span-full flex flex-col gap-0.75" style={{ marginTop: 12 }}>
                <label className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.4px]">Submission Log</label>
                {(props.submissions || []).length > 0 && (
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="grid grid-cols-[110px_1fr_100px_100px_1fr_28px] gap-1.5 text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] pb-0.5">
                      <span>Date</span>
                      <span>Submitted To</span>
                      <span>Type</span>
                      <span>Status</span>
                      <span>Notes</span>
                      <span></span>
                    </div>
                    {(props.submissions || []).map((sub) => (
                      <div key={sub.id} className="grid grid-cols-[110px_1fr_100px_100px_1fr_28px] gap-1.5 items-center">
                        <input
                          className="h-6.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
                          type="date"
                          value={sub.date}
                          onChange={(e) => updateSubmission(sub.id, 'date', e.target.value)}
                        />
                        <input
                          className="h-6.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
                          value={sub.submitted_to}
                          placeholder="Company/Person"
                          onChange={(e) => updateSubmission(sub.id, 'submitted_to', e.target.value)}
                        />
                        <input
                          className="h-6.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
                          value={sub.type}
                          placeholder="e.g. Query"
                          onChange={(e) => updateSubmission(sub.id, 'type', e.target.value)}
                        />
                        <input
                          className="h-6.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
                          value={sub.status}
                          placeholder="e.g. Pending"
                          onChange={(e) => updateSubmission(sub.id, 'status', e.target.value)}
                        />
                        <input
                          className="h-6.5 bg-(--fd-input-bg,#222) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-xs outline-none focus:border-(--fd-accent)"
                          value={sub.notes}
                          placeholder="Notes"
                          onChange={(e) => updateSubmission(sub.id, 'notes', e.target.value)}
                        />
                        <button
                          className="w-6 h-6 border-none bg-none text-(--fd-text-muted) text-base cursor-pointer rounded-[3px] flex items-center justify-center p-0 hover:bg-[rgba(255,80,80,0.15)] hover:text-[#f55]"
                          onClick={() => removeSubmission(sub.id)}
                          title="Remove entry"
                          type="button"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  className="bg-none border border-dashed border-(--fd-border) text-(--fd-text-muted) rounded-[3px] py-1.25 px-3 text-xs cursor-pointer w-full hover:border-(--fd-accent) hover:text-(--fd-accent)"
                  onClick={addSubmission}
                  type="button"
                >
                  + Add Submission
                </button>
              </div>
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button]:hover:bg-(--fd-menu-hover) max-[768px]:[&_button]:h-10">
          <button onClick={onClose}>Cancel</button>
          <button className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPropertiesDialog;
