import { Search, X } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({ placeholder = 'Rechercher…', onClear, className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        className="input-base pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
        placeholder={placeholder}
        aria-label={placeholder}
        {...props}
      />
      {(props.value ?? '') !== '' && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Effacer la recherche"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
