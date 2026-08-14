import React from 'react';

import { ExternalLinks, ProjectBody, yearRange } from './shared';
import { assetUrl } from '../api';
import { SpecRow } from '../components/ui';

/* TEMPLATE 01 - SPEC SHEET: side rail of hard facts, main column of records. */
export default function TemplateSpecSheet({ portfolio }) {
  return (
    <div className="pf">
      <div className="pf__inner">
        <header className="t1__masthead">
          <div>
            <div className="t1__id">RECORD / {portfolio.student_id}</div>
            <h1 className="t1__name">{portfolio.name || 'UNNAMED STUDENT'}</h1>
            <div className="pf-entry__meta">
              {[portfolio.degree, portfolio.college, portfolio.graduation_year]
                .filter(Boolean)
                .join(' · ') || 'NO PROGRAMME DATA'}
            </div>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <ExternalLinks portfolio={portfolio} />
            </div>
          </div>
          {portfolio.profile_photo ? (
            <img
              className="avatar"
              style={{ width: 140 }}
              src={assetUrl(portfolio.profile_photo)}
              alt={portfolio.name || 'Profile photo'}
            />
          ) : null}
        </header>

        <div className="t1__grid">
          <aside className="t1__col">
            <div className="t1__block">
              <div className="pf-section-title">DATA SHEET</div>
              <SpecRow label="STUDENT ID">{portfolio.student_id}</SpecRow>
              <SpecRow label="COLLEGE">{portfolio.college}</SpecRow>
              <SpecRow label="DEGREE">{portfolio.degree}</SpecRow>
              <SpecRow label="GRAD YEAR">{portfolio.graduation_year}</SpecRow>
              <SpecRow label="PROJECTS">{String(portfolio.projects.length)}</SpecRow>
              <SpecRow label="EXPERIENCE">{String(portfolio.experience.length)}</SpecRow>
            </div>

            {portfolio.skills.length ? (
              <div className="t1__block">
                <div className="pf-section-title">SKILLS</div>
                <div className="pf-chips">
                  {portfolio.skills.map((skill) => (
                    <span className="pf-chip" key={skill.id}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {portfolio.education.length ? (
              <div className="t1__block">
                <div className="pf-section-title">EDUCATION</div>
                {portfolio.education.map((entry) => (
                  <div className="pf-entry" key={entry.id}>
                    <div className="pf-entry__title">{entry.institution}</div>
                    <div className="pf-entry__meta">
                      {entry.degree || '—'} / {yearRange(entry.start_year, entry.end_year)}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </aside>

          <main className="t1__col">
            {portfolio.bio ? (
              <div className="t1__block">
                <div className="pf-section-title">SUMMARY</div>
                <p style={{ maxWidth: '70ch', margin: 0 }}>{portfolio.bio}</p>
              </div>
            ) : null}

            {portfolio.projects.length ? (
              <div className="t1__block">
                <div className="pf-section-title">PROJECTS</div>
                {portfolio.projects.map((project) => (
                  <div className="pf-entry" key={project.id}>
                    <div className="pf-entry__head">
                      <span className="pf-entry__title">{project.title}</span>
                    </div>
                    <ProjectBody project={project} />
                  </div>
                ))}
              </div>
            ) : null}

            {portfolio.experience.length ? (
              <div className="t1__block">
                <div className="pf-section-title">EXPERIENCE</div>
                {portfolio.experience.map((entry) => (
                  <div className="pf-entry" key={entry.id}>
                    <div className="pf-entry__head">
                      <span className="pf-entry__title">
                        {entry.role || 'ROLE'} / {entry.company}
                      </span>
                      <span className="pf-entry__meta">{entry.duration || '—'}</span>
                    </div>
                    {entry.description ? (
                      <div className="pf-entry__body">{entry.description}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
