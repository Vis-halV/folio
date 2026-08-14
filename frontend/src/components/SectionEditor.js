import React, { useState } from 'react';

import { Panel, TextArea, TextField } from './ui';

/* Generic add/edit/delete editor for the repeating portfolio sections. */
export default function SectionEditor({
  plate,
  section,
  fields,
  items,
  onCreate,
  onUpdate,
  onDelete,
  renderSummary,
  allowUpdate = true,
}) {
  const blank = Object.fromEntries(fields.map((field) => [field.name, '']));
  const [draft, setDraft] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const setValue = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        await onUpdate(editingId, draft);
      } else {
        await onCreate(draft);
      }
      setDraft(blank);
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft(
      Object.fromEntries(fields.map((field) => [field.name, item[field.name] ?? '']))
    );
  };

  return (
    <Panel plate={plate} meta={`${items.length} ENTR${items.length === 1 ? 'Y' : 'IES'}`} flush>
      <div className="item-list">
        {items.length === 0 ? <div className="empty">NO ENTRIES RECORDED</div> : null}
        {items.map((item) => (
          <div className="item" key={item.id}>
            <div>{renderSummary(item)}</div>
            <div className="row">
              {allowUpdate ? (
                <button type="button" className="btn btn--sm" onClick={() => startEdit(item)}>
                  EDIT
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={() => onDelete(item.id)}
              >
                DELETE
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="divider" />
      <form className="panel__body" onSubmit={submit}>
        <div className="fieldset">
          {fields.map((field) =>
            field.type === 'textarea' ? (
              <TextArea
                key={field.name}
                label={field.label}
                value={draft[field.name]}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            ) : (
              <TextField
                key={field.name}
                label={field.label}
                type={field.type || 'text'}
                full={field.full}
                value={draft[field.name]}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            )
          )}
        </div>
        <div className="row" style={{ marginTop: 'var(--space-3)' }}>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {editingId ? 'SAVE CHANGES' : `ADD ${section}`}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setEditingId(null);
                setDraft(blank);
              }}
            >
              CANCEL
            </button>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
