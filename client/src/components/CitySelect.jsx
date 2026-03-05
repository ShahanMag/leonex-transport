import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import cities from '../constants/cities.json';

const SORTED_CITIES = [...cities].sort((a, b) => a.name_en.localeCompare(b.name_en));

export default function CitySelect({ value, onChange, placeholder = 'Select city', disabled = false, error = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync input text with external value when closed
  useEffect(() => {
    if (!isOpen) setQuery(value || '');
  }, [value, isOpen]);

  // Recalculate dropdown position whenever it opens
  useEffect(() => {
    if (!isOpen || !inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        !e.target.closest('[data-city-dropdown]')
      ) {
        setIsOpen(false);
        setQuery(value || '');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const filtered = query.trim()
    ? SORTED_CITIES.filter(
        (c) =>
          c.name_en.toLowerCase().includes(query.toLowerCase()) ||
          c.name_ar.includes(query)
      ).slice(0, 80)
    : SORTED_CITIES.slice(0, 80);

  const handleSelect = (city) => {
    onChange(city.name_en);
    setQuery(city.name_en);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
    if (!e.target.value) onChange('');
  };

  const handleFocus = () => {
    setIsOpen(true);
    setQuery('');
  };

  const dropdown = isOpen && !disabled && (
    <ul
      data-city-dropdown
      style={dropdownStyle}
      className="max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl text-xs"
    >
      {filtered.length === 0 ? (
        <li className="px-3 py-2 text-gray-400">No cities found</li>
      ) : (
        filtered.map((city) => (
          <li
            key={city.city_id}
            onMouseDown={() => handleSelect(city)}
            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center gap-3 ${
              value === city.name_en ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            <span>{city.name_en}</span>
            <span className="text-gray-400" dir="rtl">{city.name_ar}</span>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? query : (value || '')}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:cursor-not-allowed ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
      />
      {createPortal(dropdown, document.body)}
    </div>
  );
}
