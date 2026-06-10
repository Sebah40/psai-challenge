'use client';
import { useEffect, useRef, useState } from 'react';

// Combobox con dropdown propio. A diferencia de <datalist>, no hace filtrado
// nativo del navegador (que es sensible a acentos): muestra las opciones tal
// cual vienen del server, así "tio" sigue mostrando "Tío Nacho".
export default function Combobox({
  label, placeholder, value, onChange, options, onPick,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (o: string) => { onPick(o); setOpen(false); };

  return (
    <div className="combo" ref={boxRef}>
      <span className="combo-label">{label}</span>
      <input
        className="combo-input"
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && options.length) pick(options[0]);
        }}
      />
      {value && (
        <button
          type="button"
          className="combo-clear"
          aria-label="Limpiar"
          onClick={() => { onPick(''); setOpen(false); }}
        >×</button>
      )}
      {open && options.length > 0 && (
        <ul className="combo-list">
          {options.map(o => (
            <li key={o} onMouseDown={() => pick(o)}>{o}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
