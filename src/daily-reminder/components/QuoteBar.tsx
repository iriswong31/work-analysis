import { useState, useEffect } from 'react';
import { reminderDb } from '../utils/db';

export default function QuoteBar() {
  const [quote, setQuote] = useState('');

  const loadMotto = () => {
    reminderDb.userSettings.get('yearlyMotto').then((item) => {
      setQuote(item?.value || '');
    });
  };

  useEffect(() => {
    loadMotto();
    window.addEventListener('motto-updated', loadMotto);
    return () => window.removeEventListener('motto-updated', loadMotto);
  }, []);

  if (!quote) return null;

  return (
    <div className="py-4 px-4">
      <p className="cb-quote">
        "{quote}"
      </p>
    </div>
  );
}
