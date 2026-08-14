import React from 'react';

import { assetUrl } from '../api';

export function yearRange(start, end) {
  if (!start && !end) return '—';
  return `${start || '????'}–${end || 'PRESENT'}`;
}

export function techList(technologies) {
  return (technologies || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ExternalLinks({ portfolio, className = 'pf__links', buttonClass = 'btn btn--sm' }) {
  const { github_url: github, linkedin_url: linkedin } = portfolio;
  const resume = assetUrl(portfolio.resume_url);
  if (!github && !linkedin && !resume) return null;
  return (
    <div className={className}>
      {github ? (
        <a className={buttonClass} href={github} target="_blank" rel="noreferrer">
          GITHUB
        </a>
      ) : null}
      {linkedin ? (
        <a className={buttonClass} href={linkedin} target="_blank" rel="noreferrer">
          LINKEDIN
        </a>
      ) : null}
      {resume ? (
        <a className={buttonClass} href={resume} target="_blank" rel="noreferrer" download>
          DOWNLOAD RESUME
        </a>
      ) : null}
    </div>
  );
}

export function ProjectBody({ project }) {
  const tech = techList(project.technologies);
  return (
    <>
      {project.description ? <div className="pf-entry__body">{project.description}</div> : null}
      {tech.length ? (
        <div className="pf-chips" style={{ marginTop: 'var(--space-2)' }}>
          {tech.map((item) => (
            <span className="pf-chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      ) : null}
      <div className="pf__links" style={{ marginTop: 'var(--space-2)' }}>
        {project.github_url ? (
          <a className="btn btn--sm" href={project.github_url} target="_blank" rel="noreferrer">
            SOURCE
          </a>
        ) : null}
        {project.demo_url ? (
          <a className="btn btn--sm" href={project.demo_url} target="_blank" rel="noreferrer">
            LIVE DEMO
          </a>
        ) : null}
      </div>
    </>
  );
}
