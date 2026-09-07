import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Check } from 'lucide-react';
import { KARNATAKA_DISTRICTS } from '../../data/districts';
import { useLanguage } from '../../context/LanguageContext';

interface DistrictSelectProps {
  value: string;
  onChange: (district: string) => void;
  error?: string;
}

export const DistrictSelect: React.FC<DistrictSelectProps> = ({ value, onChange, error }) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredDistricts = KARNATAKA_DISTRICTS.filter((d) => {
    const s = search.toLowerCase();
    return d.name.toLowerCase().includes(s) || d.name_kn.includes(s);
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = KARNATAKA_DISTRICTS.find((d) => d.name === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-semibold text-brand-text-dark mb-1.5">
        {t.districtHeading}
      </label>
      <p className="text-xs text-brand-text-muted mb-2.5">
        {t.districtSubheading}
      </p>

      {/* Select trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border text-left transition-all ${
          error
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-brand-deep-teal ring-2 ring-brand-soft-mint'
            : 'border-brand-border hover:border-brand-teal-mist'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-brand-deep-teal flex-shrink-0" />
          <span className={`text-sm truncate ${value ? 'text-brand-text-dark font-medium' : 'text-brand-text-muted'}`}>
            {selectedItem
              ? language === 'kn'
                ? `${selectedItem.name_kn} (${selectedItem.name})`
                : selectedItem.name
              : t.districtSelectPlaceholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-brand-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-brand-border shadow-lifted overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="p-3 border-b border-brand-border bg-brand-surface/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-text-muted flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={t.searchDistrict}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-transparent border-none focus:outline-none text-brand-text-dark placeholder:text-brand-text-muted"
            />
          </div>

          {/* District list */}
          <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-stone-50">
            {filteredDistricts.length === 0 ? (
              <div className="p-4 text-center text-xs text-brand-text-muted">
                No district found matching "{search}"
              </div>
            ) : (
              filteredDistricts.map((district) => {
                const isSelected = district.name === value;
                return (
                  <button
                    key={district.name}
                    type="button"
                    onClick={() => {
                      onChange(district.name);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-brand-soft-mint text-brand-dark-teal font-semibold'
                        : 'hover:bg-brand-surface text-brand-text-dark'
                    }`}
                  >
                    <span>
                      {district.name}{' '}
                      <span className="text-xs text-brand-text-muted ml-1">
                        ({district.name_kn})
                      </span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-brand-deep-teal" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
