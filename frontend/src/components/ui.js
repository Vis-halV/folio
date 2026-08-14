import React from 'react';

export function Panel({ plate, meta, actions, flush = false, children }) {
  return (
    <section className="panel">
      <header className="panel__header">
        <span className="panel__plate">{plate}</span>
        <div className="row">
          {meta ? <span className="panel__meta">{meta}</span> : null}
          {actions}
        </div>
      </header>
      <div className={flush ? 'panel__body panel__body--flush' : 'panel__body'}>{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function TextField({ label, hint, full = false, ...props }) {
  return (
    <div className={full ? 'fieldset__full' : undefined}>
      <Field label={label} hint={hint}>
        <input {...props} />
      </Field>
    </div>
  );
}

export function TextArea({ label, hint, full = true, ...props }) {
  return (
    <div className={full ? 'fieldset__full' : undefined}>
      <Field label={label} hint={hint}>
        <textarea {...props} />
      </Field>
    </div>
  );
}

export function Tag({ children, variant }) {
  const className = ['tag', variant ? `tag--${variant}` : ''].filter(Boolean).join(' ');
  return <span className={className}>[{children}]</span>;
}

export function StatusTags({ isApproved, isActive, isPublished }) {
  return (
    <div className="row">
      <Tag variant={isApproved ? 'ok' : 'warn'}>{isApproved ? 'APPROVED' : 'PENDING'}</Tag>
      <Tag variant={isActive ? undefined : 'danger'}>{isActive ? 'ACTIVE' : 'DISABLED'}</Tag>
      {isPublished === undefined ? null : (
        <Tag variant={isPublished ? 'ok' : undefined}>{isPublished ? 'PUBLISHED' : 'DRAFT'}</Tag>
      )}
    </div>
  );
}

export function Notice({ children, variant }) {
  if (!children) return null;
  const className = ['notice', variant ? `notice--${variant}` : ''].filter(Boolean).join(' ');
  return <div className={className}>{children}</div>;
}

export function SpecRow({ label, children }) {
  return (
    <div className="spec">
      <div className="spec__key">{label}</div>
      <div className="spec__value">{children || '—'}</div>
    </div>
  );
}
