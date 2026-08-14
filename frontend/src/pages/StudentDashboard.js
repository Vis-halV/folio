import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { api, assetUrl } from '../api';
import NavBar from '../components/NavBar';
import SectionEditor from '../components/SectionEditor';
import { Notice, Panel, SpecRow, StatusTags, TextArea, TextField } from '../components/ui';
import { renderTemplate } from '../templates';

const SECTION_SPECS = [
  {
    key: 'education',
    plate: 'EDUCATION',
    label: 'EDUCATION',
    fields: [
      { name: 'institution', label: 'Institution' },
      { name: 'degree', label: 'Degree / programme' },
      { name: 'start_year', label: 'Start year', type: 'number' },
      { name: 'end_year', label: 'End year', type: 'number' },
    ],
    summary: (item) => (
      <>
        <div className="item__title">{item.institution}</div>
        <div className="item__meta">
          {item.degree || '—'} · {item.start_year || '????'}–{item.end_year || 'PRESENT'}
        </div>
      </>
    ),
  },
  {
    key: 'skills',
    plate: 'SKILLS',
    label: 'SKILL',
    allowUpdate: false,
    fields: [{ name: 'name', label: 'Skill' }],
    summary: (item) => <div className="item__title">{item.name}</div>,
  },
  {
    key: 'projects',
    plate: 'PROJECTS',
    label: 'PROJECT',
    fields: [
      { name: 'title', label: 'Title' },
      { name: 'technologies', label: 'Technologies (comma separated)' },
      { name: 'github_url', label: 'GitHub URL' },
      { name: 'demo_url', label: 'Demo URL' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    summary: (item) => (
      <>
        <div className="item__title">{item.title}</div>
        <div className="item__meta">{item.technologies || 'NO STACK LISTED'}</div>
        {item.description ? <div className="item__body">{item.description}</div> : null}
      </>
    ),
  },
  {
    key: 'experience',
    plate: 'EXPERIENCE',
    label: 'EXPERIENCE',
    fields: [
      { name: 'company', label: 'Company / organisation' },
      { name: 'role', label: 'Role' },
      { name: 'duration', label: 'Duration' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
    summary: (item) => (
      <>
        <div className="item__title">
          {item.role || 'ROLE'} @ {item.company}
        </div>
        <div className="item__meta">{item.duration || '—'}</div>
        {item.description ? <div className="item__body">{item.description}</div> : null}
      </>
    ),
  },
];

const PROFILE_FIELDS = ['name', 'bio', 'college', 'degree', 'graduation_year', 'github_url', 'linkedin_url'];

export default function StudentDashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    const data = await api.getProfile();
    setPortfolio(data);
    setForm(
      Object.fromEntries(PROFILE_FIELDS.map((field) => [field, data[field] ?? '']))
    );
  }, []);

  useEffect(() => {
    load().catch((apiError) => setError(apiError.message));
    api.publicTemplates().then(setTemplates).catch(() => setTemplates([]));
  }, [load]);

  const run = async (action, message) => {
    setError('');
    setStatus('');
    try {
      await action();
      await load();
      if (message) setStatus(message);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const shareUrl = useMemo(() => {
    if (!portfolio?.student_id) return '';
    return `${window.location.origin}/${portfolio.student_id}`;
  }, [portfolio]);

  if (!portfolio) {
    return (
      <div className="app-shell">
        <NavBar />
        <div className="page">
          <Notice variant="error">{error}</Notice>
          {!error ? <p className="label-inline">LOADING RECORD…</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <NavBar />
      <div className="page stack">
        <div className="row row--between">
          <h1>Student record / {portfolio.student_id}</h1>
          <StatusTags isApproved isActive isPublished={portfolio.is_published} />
        </div>

        <Notice variant="error">{error}</Notice>
        <Notice variant="accent">{status}</Notice>

        <Panel
          plate="PUBLICATION"
          meta={portfolio.is_published ? 'LIVE' : 'NOT LIVE'}
          actions={
            <>
              <button type="button" className="btn btn--sm" onClick={() => setPreview((v) => !v)}>
                {preview ? 'CLOSE PREVIEW' : 'PREVIEW'}
              </button>
              <button
                type="button"
                className={portfolio.is_published ? 'btn btn--sm btn--danger' : 'btn btn--sm btn--primary'}
                onClick={() =>
                  run(
                    () => api.setPublished(!portfolio.is_published),
                    portfolio.is_published ? 'PORTFOLIO UNPUBLISHED' : 'PORTFOLIO PUBLISHED'
                  )
                }
              >
                {portfolio.is_published ? 'UNPUBLISH' : 'PUBLISH'}
              </button>
            </>
          }
        >
          <div className="share-url">
            <span className="label-inline">SHAREABLE URL</span>
            <code>{shareUrl}</code>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
            >
              COPY
            </button>
            <a className="btn btn--sm" href={shareUrl} target="_blank" rel="noreferrer">
              OPEN
            </a>
          </div>
        </Panel>

        {preview ? (
          <Panel plate="PREVIEW" meta={portfolio.template} flush>
            {renderTemplate(portfolio.template, portfolio)}
          </Panel>
        ) : null}

        <div className="grid grid--2">
          <Panel plate="PROFILE" meta="IDENTITY + SUMMARY">
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => api.updateProfile(form), 'PROFILE SAVED');
              }}
            >
              <div className="fieldset">
                <TextField
                  label="Full name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                <TextField
                  label="College"
                  value={form.college}
                  onChange={(event) => setForm({ ...form, college: event.target.value })}
                />
                <TextField
                  label="Degree"
                  value={form.degree}
                  onChange={(event) => setForm({ ...form, degree: event.target.value })}
                />
                <TextField
                  label="Graduation year"
                  type="number"
                  value={form.graduation_year}
                  onChange={(event) => setForm({ ...form, graduation_year: event.target.value })}
                />
                <TextField
                  label="GitHub URL"
                  value={form.github_url}
                  onChange={(event) => setForm({ ...form, github_url: event.target.value })}
                />
                <TextField
                  label="LinkedIn URL"
                  value={form.linkedin_url}
                  onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
                />
                <TextArea
                  label="Bio"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                />
              </div>
              <button className="btn btn--primary" type="submit">
                SAVE PROFILE
              </button>
            </form>
          </Panel>

          <div className="stack">
            <Panel plate="ASSETS" meta="PHOTO + RESUME">
              <div className="stack">
                {portfolio.profile_photo ? (
                  <img className="avatar" src={assetUrl(portfolio.profile_photo)} alt="Profile" style={{ maxWidth: 160 }} />
                ) : null}
                <TextField
                  label="Profile photo (png/jpg/webp)"
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    event.target.files[0] &&
                    run(() => api.uploadPhoto(event.target.files[0]), 'PHOTO UPLOADED')
                  }
                />
                <TextField
                  label="Resume (pdf/doc/docx)"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) =>
                    event.target.files[0] &&
                    run(() => api.uploadResume(event.target.files[0]), 'RESUME UPLOADED')
                  }
                />
                <div>
                  <SpecRow label="RESUME ON FILE">
                    {portfolio.resume_url ? (
                      <a href={assetUrl(portfolio.resume_url)} target="_blank" rel="noreferrer">
                        DOWNLOAD
                      </a>
                    ) : null}
                  </SpecRow>
                </div>
              </div>
            </Panel>

            <Panel plate="TEMPLATE" meta={portfolio.template}>
              <div className="grid grid--3">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    className="template-choice"
                    aria-pressed={portfolio.template === template.key}
                    onClick={() =>
                      run(() => api.updateProfile({ template: template.key }), `TEMPLATE SET: ${template.label}`)
                    }
                  >
                    <TemplateSwatch templateKey={template.key} />
                    <span className="item__title">{template.label}</span>
                    <span className="item__meta">{template.description}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {SECTION_SPECS.map((spec) => (
          <SectionEditor
            key={spec.key}
            plate={spec.plate}
            section={spec.label}
            fields={spec.fields}
            items={portfolio[spec.key] || []}
            allowUpdate={spec.allowUpdate !== false}
            renderSummary={spec.summary}
            onCreate={(draft) => run(() => api.create(spec.key, draft), `${spec.label} ADDED`)}
            onUpdate={(id, draft) => run(() => api.update(spec.key, id, draft), `${spec.label} UPDATED`)}
            onDelete={(id) => run(() => api.remove(spec.key, id), `${spec.label} DELETED`)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateSwatch({ templateKey }) {
  const layouts = {
    'template-01': ['1fr 2fr', ['12px', '12px', '30px']],
    'template-02': ['1fr', ['16px', '10px', '10px', '10px']],
    'template-03': ['1fr', ['8px', '8px', '8px', '8px', '8px']],
  };
  const [columns, rows] = layouts[templateKey] || layouts['template-01'];
  return (
    <span
      className="template-choice__swatch"
      style={{ gridTemplateColumns: columns, gridAutoRows: 'min-content' }}
    >
      {rows.map((height, index) => (
        <span key={index} style={{ height }} />
      ))}
    </span>
  );
}
