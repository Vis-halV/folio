import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { api } from '../api';
import NotFound from './NotFound';
import { renderTemplate } from '../templates';

export default function PublicPortfolio() {
  const { studentId } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api
      .portfolio(studentId)
      .then((data) => {
        if (cancelled) return;
        setPortfolio(data);
        setState('ready');
      })
      .catch(() => !cancelled && setState('missing'));
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (state === 'loading') {
    return (
      <div className="page">
        <p className="label-inline">FETCHING PORTFOLIO {studentId}…</p>
      </div>
    );
  }
  if (state === 'missing') return <NotFound />;
  return renderTemplate(portfolio.template, portfolio);
}
