import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MultiSelect({ options = [], value = [], onChange, placeholder = 'Select...', disabled = false }) {
  const [query, setQuery]     = useState('');
  const [isOpen, setIsOpen]   = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef    = useRef(null);
  const containerRef = useRef(null);

  // Recalculate dropdown position on open
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top:  rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
    });
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !e.target.closest('[data-multiselect-dropdown]')
      ) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const allSelected = options.length > 0 && value.length === options.length;

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map(o => o.value));
  };

  const triggerLabel = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return options.find(o => o.value === value[0])?.label || '1 selected';
    return `${value.length} selected`;
  };

  const dropdown = isOpen && !disabled && (
    <div
      data-multiselect-dropdown
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-xl text-sm overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          autoFocus
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {/* Select All */}
      {options.length > 1 && (
        <div
          onMouseDown={(e) => { e.preventDefault(); toggleAll(); }}
          className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
        >
          <input type="checkbox" readOnly checked={allSelected}
            ref={el => { if (el) el.indeterminate = value.length > 0 && !allSelected; }}
            className="accent-blue-600"
          />
          <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Select All</span>
        </div>
      )}
      {/* Options */}
      <ul className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-3 py-2 text-gray-400 text-sm">No results</li>
        ) : (
          filtered.map(o => (
            <li
              key={o.value}
              onMouseDown={(e) => { e.preventDefault(); toggle(o.value); }}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 ${value.includes(o.value) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
            >
              <input type="checkbox" readOnly checked={value.includes(o.value)} className="accent-blue-600" />
              <span>{o.label}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={inputRef}
        type="button"
        disabled={disabled}
        onClick={() => { setIsOpen(o => !o); setQuery(''); }}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between gap-2 min-w-[160px] disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className={value.length === 0 ? 'text-gray-400' : 'text-gray-800'}>{triggerLabel()}</span>
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {value.length > 0 && (
        <button
          type="button"
          onMouseDown={e => { e.stopPropagation(); onChange([]); }}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          title="Clear"
        >✕</button>
      )}
      {createPortal(dropdown, document.body)}
    </div>
  );
}
