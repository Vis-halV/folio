import React from 'react';

import { assetUrl } from '../api';
import { techList, yearRange } from './shared';

/* TEMPLATE 03 - TERMINAL: inverted ledger, tabular monospace rows. */
export default function TemplateTerminal({ portfolio }) {
  const links = [
    portfolio.github_url ? ['GITHUB', portfolio.github_url] : null,
    portfolio.linkedin_url ? ['LINKEDIN', portfolio.linkedin_url] : null,
    portfolio.resume_url ? ['RESUME.PDF', assetUrl(portfolio.resume_url)] : null,
  ].filter(Boolean);

  return (
    <div className="t3">
      <div className="t3__inner">
        <div className="t3__bar">
          <span>./PORTFOLIO --ID {portfolio.student_id}</span>
          <span className="t3__accent">
            STATUS: {portfolio.is_published ? 'PUBLISHED' : 'DRAFT'}
          </span>
        </div>

        <h1 className="t3__name">{portfolio.name || 'UNNAMED STUDENT'}</h1>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {[portfolio.degree, portfolio.college, portfolio.graduation_year]
            .filter(Boolean)
            .join(' / ') || 'NO PROGRAMME DATA'}
        </div>

        {links.length ? (
          <div className="pf__links" style={{ marginTop: 'var(--space-3)' }}>
            {links.map(([label, href]) => (
              <a className="t3__chip" key={label} href={href} target="_blank" rel="noreferrer">
                {label}
              </a>
            ))}
          </div>
        ) : null}

        {portfolio.bio ? (
          <Panel title="README">
            <div style={{ maxWidth: '72ch' }}>{portfolio.bio}</div>
          </Panel>
        ) : null}

        {portfolio.skills.length ? (
          <Panel title="SKILLS">
            <div className="pf__links">
              {portfolio.skills.map((skill) => (
                <span className="t3__chip" key={skill.id}>
                  {skill.name}
                </span>
              ))}
            </div>
          </Panel>
        ) : null}

        {portfolio.education.length ? (
          <Panel title="EDUCATION">
            {portfolio.education.map((entry, index) => (
              <div className="t3__row" key={entry.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  {entry.institution}
                  {entry.degree ? ` — ${entry.degree}` : ''}
                </span>
                <span>{yearRange(entry.start_year, entry.end_year)}</span>
              </div>
            ))}
          </Panel>
        ) : null}

        {portfolio.experience.length ? (
          <Panel title="EXPERIENCE">
            {portfolio.experience.map((entry, index) => (
              <div className="t3__row" key={entry.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>
                    {entry.role || 'ROLE'} @ {entry.company}
                  </strong>
                  {entry.description ? <div style={{ marginTop: 4 }}>{entry.description}</div> : null}
                </span>
                <span>{entry.duration || '—'}</span>
              </div>
            ))}
          </Panel>
        ) : null}

        {portfolio.projects.length ? (
          <Panel title="PROJECTS">
            {portfolio.projects.map((project, index) => (
              <div className="t3__row" key={project.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{project.title}</strong>
                  {project.description ? <div style={{ marginTop: 4 }}>{project.description}</div> : null}
                  <div className="pf__links" style={{ marginTop: 6 }}>
                    {techList(project.technologies).map((tech) => (
                      <span className="t3__chip" key={tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </span>
                <span className="pf__links">
                  {project.github_url ? (
                    <a className="t3__chip" href={project.github_url} target="_blank" rel="noreferrer">
                      SRC
                    </a>
                  ) : null}
                  {project.demo_url ? (
                    <a className="t3__chip" href={project.demo_url} target="_blank" rel="noreferrer">
                      DEMO
                    </a>
                  ) : null}
                </span>
              </div>
            ))}
          </Panel>
        ) : null}
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="t3__panel">
      <header className="t3__panel-head">{title}</header>
      <div className="t3__panel-body">{children}</div>
    </section>
  );
}
