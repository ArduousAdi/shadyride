import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';

/**
 * Autocomplete input component that queries Nominatim for address suggestions.
 * Displays a dropdown of matching places, and returns the selected item via onSelect.
 *
 * @param {string} label Label for the input
 * @param {function} onSelect Callback when a suggestion is selected; receives the selected result object or null
 * @param {string} placeholder Placeholder text for the input
 */
const AutoCompleteInput = ({ label, onSelect, placeholder, onQueryChange }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef(null);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&addressdetails=1&limit=5`;
          const resp = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'shade-app-autocomplete' } });
          if (!resp.ok) return;
          const data = await resp.json();
          setSuggestions(data);
        } catch (e) {
          // ignore errors
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setShowSuggestions(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className="flex flex-col relative">
      {label && <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect(null);
          setShowSuggestions(true);
          if (onQueryChange) onQueryChange(e.target.value);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 left-0 right-0 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto text-sm">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoCompleteInput;