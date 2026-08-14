import React, { useCallback, useEffect, useState } from 'react';

import { api } from '../api';
import NavBar from '../components/NavBar';
import { Notice, Panel, StatusTags, TextField } from '../components/ui';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState({ email: '', student_id: '', name: '', password: '' });
  const [templateDraft, setTemplateDraft] = useState({ key: '', label: '', description: '' });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    const [studentList, profileList, templateList] = await Promise.all([
      api.adminStudents(),
      api.adminProfiles(),
      api.adminTemplates(),
    ]);
    setStudents(studentList);
    setProfiles(profileList);
    setTemplates(templateList);
  }, []);

  useEffect(() => {
    load().catch((apiError) => setError(apiError.message));
  }, [load]);

  const run = async (action, message) => {
    setError('');
    setStatus('');
    try {
      const result = await action();
      await load();
      if (message) setStatus(typeof message === 'function' ? message(result) : message);
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  return (
    <div className="app-shell">
      <NavBar />
      <div className="page stack">
        <div className="row row--between">
          <h1>Administration</h1>
          <span className="label-inline">
            {students.length} STUDENTS / {profiles.filter((p) => p.is_published).length} PUBLISHED
          </span>
        </div>

        <Notice variant="error">{error}</Notice>
        <Notice variant="accent">{status}</Notice>

        <Panel plate="WHITELIST / ADD STUDENT" meta="ACCOUNTS ARE ADMIN-ISSUED">
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              const payload = { ...draft };
              if (!payload.password) delete payload.password;
              run(
                () => api.adminCreateStudent(payload),
                (created) =>
                  created.initial_password
                    ? `CREATED ${created.email} — INITIAL PASSWORD: ${created.initial_password}`
                    : `CREATED ${created.email}`
              ).then(() => setDraft({ email: '', student_id: '', name: '', password: '' }));
            }}
          >
            <div className="fieldset">
              <TextField
                label="Student ID"
                required
                value={draft.student_id}
                onChange={(event) => setDraft({ ...draft, student_id: event.target.value })}
              />
              <TextField
                label="Institutional email"
                type="email"
                required
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
              <TextField
                label="Name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
              <TextField
                label="Initial password"
                hint="LEAVE BLANK TO GENERATE ONE"
                value={draft.password}
                onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              />
            </div>
            <button className="btn btn--primary" type="submit">
              ADD TO WHITELIST
            </button>
          </form>
        </Panel>

        <Panel plate="STUDENT REGISTER" meta="APPROVE / DISABLE / REMOVE" flush>
          <div className="table--scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>STUDENT ID</th>
                  <th>EMAIL</th>
                  <th>NAME</th>
                  <th>STATUS</th>
                  <th>PORTFOLIO</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      NO STUDENTS REGISTERED
                    </td>
                  </tr>
                ) : null}
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.student_id}</td>
                    <td>{student.email}</td>
                    <td>{student.profile?.name || '—'}</td>
                    <td>
                      <StatusTags
                        isApproved={student.is_approved}
                        isActive={student.is_active}
                        isPublished={student.profile?.is_published}
                      />
                    </td>
                    <td>
                      {student.profile?.is_published ? (
                        <a href={`/${student.student_id}`} target="_blank" rel="noreferrer">
                          VIEW
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() =>
                            run(
                              () => api.adminUpdateStudent(student.id, { is_approved: !student.is_approved }),
                              student.is_approved ? 'APPROVAL REVOKED' : 'STUDENT APPROVED'
                            )
                          }
                        >
                          {student.is_approved ? 'REVOKE' : 'APPROVE'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() =>
                            run(
                              () => api.adminUpdateStudent(student.id, { is_active: !student.is_active }),
                              student.is_active ? 'ACCOUNT DISABLED' : 'ACCOUNT ENABLED'
                            )
                          }
                        >
                          {student.is_active ? 'DISABLE' : 'ENABLE'}
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger"
                          onClick={() =>
                            window.confirm(`Remove ${student.email}?`) &&
                            run(() => api.adminDeleteStudent(student.id), 'STUDENT REMOVED')
                          }
                        >
                          REMOVE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel plate="ALL PROFILES" meta="CONTENT AUDIT" flush>
          <div className="table--scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>STUDENT ID</th>
                  <th>NAME</th>
                  <th>COLLEGE</th>
                  <th>TEMPLATE</th>
                  <th>EDU</th>
                  <th>SKL</th>
                  <th>PRJ</th>
                  <th>EXP</th>
                  <th>STATE</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>{profile.student_id}</td>
                    <td>{profile.name || '—'}</td>
                    <td>{profile.college || '—'}</td>
                    <td>{profile.template}</td>
                    <td>{profile.education.length}</td>
                    <td>{profile.skills.length}</td>
                    <td>{profile.projects.length}</td>
                    <td>{profile.experience.length}</td>
                    <td>
                      <span className={profile.is_published ? 'tag tag--ok' : 'tag'}>
                        [{profile.is_published ? 'PUBLISHED' : 'DRAFT'}]
                      </span>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty">
                      NO PROFILES YET
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel plate="TEMPLATE CATALOGUE" meta="AVAILABILITY CONTROL">
          <div className="stack">
            <div className="table--scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>KEY</th>
                    <th>LABEL</th>
                    <th>DESCRIPTION</th>
                    <th>STATE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.key}</td>
                      <td>{template.label}</td>
                      <td>{template.description || '—'}</td>
                      <td>
                        <span className={template.is_enabled ? 'tag tag--ok' : 'tag'}>
                          [{template.is_enabled ? 'ENABLED' : 'DISABLED'}]
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--sm"
                          onClick={() =>
                            run(
                              () => api.adminUpdateTemplate(template.id, { is_enabled: !template.is_enabled }),
                              'TEMPLATE UPDATED'
                            )
                          }
                        >
                          {template.is_enabled ? 'DISABLE' : 'ENABLE'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => api.adminCreateTemplate(templateDraft), 'TEMPLATE REGISTERED').then(() =>
                  setTemplateDraft({ key: '', label: '', description: '' })
                );
              }}
            >
              <div className="fieldset">
                <TextField
                  label="Template key"
                  hint="MUST MATCH A FRONT-END TEMPLATE ID"
                  required
                  value={templateDraft.key}
                  onChange={(event) => setTemplateDraft({ ...templateDraft, key: event.target.value })}
                />
                <TextField
                  label="Label"
                  required
                  value={templateDraft.label}
                  onChange={(event) => setTemplateDraft({ ...templateDraft, label: event.target.value })}
                />
                <TextField
                  label="Description"
                  full
                  value={templateDraft.description}
                  onChange={(event) =>
                    setTemplateDraft({ ...templateDraft, description: event.target.value })
                  }
                />
              </div>
              <button className="btn" type="submit">
                REGISTER TEMPLATE
              </button>
            </form>
          </div>
        </Panel>
      </div>
    </div>
  );
}
