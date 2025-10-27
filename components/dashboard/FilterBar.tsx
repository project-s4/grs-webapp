import React from 'react';
import { Filter, RefreshCw, Search } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  name: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  title?: string;
  filters: FilterConfig[];
  onReset?: () => void;
  searchConfig?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
}

export default function FilterBar({ 
  title = "Filters & Search", 
  filters, 
  onReset,
  searchConfig 
}: FilterBarProps) {
  return (
    <div className="card-glass mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            {title}
          </h2>
          {onReset && (
            <button 
              onClick={onReset}
              className="btn-ghost btn-sm inline-flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
        <div className={`grid grid-cols-1 ${searchConfig ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
          {filters.map((filter) => (
            <div key={filter.name}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {filter.label}
              </label>
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="form-select w-full"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {searchConfig && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchConfig.placeholder || "Search..."}
                  value={searchConfig.value}
                  onChange={(e) => searchConfig.onChange(e.target.value)}
                  className="form-input w-full pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
