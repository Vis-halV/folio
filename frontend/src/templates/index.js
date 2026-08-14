import React from 'react';

import TemplateDossier from './TemplateDossier';
import TemplateSpecSheet from './TemplateSpecSheet';
import TemplateTerminal from './TemplateTerminal';
import './templates.css';

export const TEMPLATES = {
  'template-01': TemplateSpecSheet,
  'template-02': TemplateDossier,
  'template-03': TemplateTerminal,
};

export const DEFAULT_TEMPLATE = 'template-01';

export function renderTemplate(templateKey, portfolio) {
  const Template = TEMPLATES[templateKey] || TEMPLATES[DEFAULT_TEMPLATE];
  return <Template portfolio={portfolio} />;
}
