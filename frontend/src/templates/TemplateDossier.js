import React from 'react';

import { ExternalLinks, ProjectBody, yearRange } from './shared';
import { assetUrl } from '../api';

/* TEMPLATE 02 - DOSSIER: single column, numbered section plates. */
export default function TemplateDossier({ portfolio }) {
  const sections = [];

  if (portfolio.bio) {
    sections.push({
      title: 'SUMMARY',
      content: <p style={{ margin: 0, maxWidth: '70ch' }}>{portfolio.bio}</p>,
    });
  }

  if (portfolio.skills.length) {
    sections.push({
      title: 'SKILLS',
      content: (
        <div className="pf-chips">
          {portfolio.skills.map((skill) => (
            <span className="pf-chip" key={skill.id}>
              {skill.name}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (portfolio.education.length) {
    sections.push({
      title: 'EDUCATION',
      content: portfolio.education.map((entry) => (
        <div className="pf-entry" key={entry.id}>
          <div className="pf-entry__head">
            <span className="pf-entry__title">{entry.institution}</span>
            <span className="pf-entry__meta">{yearRange(entry.start_year, entry.end_year)}</span>
          </div>
          <div className="pf-entry__meta">{entry.degree || '—'}</div>
        </div>
      )),
    });
  }

  if (portfolio.experience.length) {
    sections.push({
      title: 'EXPERIENCE',
      content: portfolio.experience.map((entry) => (
        <div className="pf-entry" key={entry.id}>
          <div className="pf-entry__head">
            <span className="pf-entry__title">
              {entry.role || 'ROLE'} — {entry.company}
            </span>
            <span className="pf-entry__meta">{entry.duration || '—'}</span>
          </div>
          {entry.description ? <div className="pf-entry__body">{entry.description}</div> : null}
        </div>
      )),
    });
  }

  if (portfolio.projects.length) {
    sections.push({
      title: 'PROJECTS',
      content: portfolio.projects.map((project) => (
        <div className="pf-entry" key={project.id}>
          <div className="pf-entry__head">
            <span className="pf-entry__title">{project.title}</span>
          </div>
          <ProjectBody project={project} />
        </div>
      )),
    });
  }

  return (
    <div className="pf t2">
      <header className="t2__header">
        <div className="t2__header-inner">
          {portfolio.profile_photo ? (
            <img className="avatar" src={assetUrl(portfolio.profile_photo)} alt={portfolio.name || 'Profile'} />
          ) : (
            <div className="avatar" aria-hidden="true" />
          )}
          <div>
            <div className="pf-entry__meta">DOSSIER / {portfolio.student_id}</div>
            <h1 className="t2__name">{portfolio.name || 'UNNAMED STUDENT'}</h1>
            <div className="pf-entry__meta">
              {[portfolio.degree, portfolio.college, portfolio.graduation_year]
                .filter(Boolean)
                .join(' · ') || 'NO PROGRAMME DATA'}
            </div>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <ExternalLinks portfolio={portfolio} />
            </div>
          </div>
        </div>
      </header>

      <div className="t2__inner">
        {sections.map((section, index) => (
          <section className="t2__section" key={section.title}>
            <div className="t2__number">{String(index + 1).padStart(2, '0')}</div>
            <div className="t2__content">
              <div className="pf-section-title">{section.title}</div>
              {section.content}
            </div>
          </section>
        ))}
        {sections.length === 0 ? <div className="empty">THIS PORTFOLIO HAS NO CONTENT YET</div> : null}
      </div>
    </div>
  );
}
