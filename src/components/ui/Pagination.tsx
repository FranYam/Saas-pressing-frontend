import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-slate-100 px-5 py-3" aria-label="Pagination">
      <p className="text-xs text-slate-500">
        Page <span className="font-semibold text-charcoal">{page}</span> sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn-ghost disabled:pointer-events-none disabled:opacity-40"
          aria-label="Page précédente"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Précédent
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-ghost disabled:pointer-events-none disabled:opacity-40"
          aria-label="Page suivante"
        >
          Suivant
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
