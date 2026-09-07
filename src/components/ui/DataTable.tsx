import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: string;
  /** Rendu de la cellule ; par défaut : row[key] */
  render?: (row: T) => ReactNode;
  /** Clé de tri optionnelle */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  /** Affichage mobile : si fourni, les lignes deviennent des cartes < md */
  mobileCard?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  ariaLabel: string;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({ columns, data, rowKey, pageSize = 8, onRowClick, mobileCard, emptyState, ariaLabel }: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  if (data.length === 0 && emptyState) return <>{emptyState}</>;

  return (
    <div className="overflow-hidden">
      {/* Mode cartes (mobile) */}
      {mobileCard && (
        <ul className="divide-y divide-slate-50 md:hidden" aria-label={`${ariaLabel} (vue mobile)`}>
          {rows.map((row) => (
            <li
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter') onRowClick(row);
                    }
                  : undefined
              }
              tabIndex={onRowClick ? 0 : undefined}
              className={onRowClick ? 'cursor-pointer active:bg-primary-50/40' : undefined}
            >
              {mobileCard(row)}
            </li>
          ))}
        </ul>
      )}

      {/* Mode tableau (desktop — ou toujours si pas de mobileCard) */}
      <div className={mobileCard ? 'hidden md:overflow-x-auto scrollbar-thin' : 'overflow-x-auto scrollbar-thin'}>
        <table className="w-full min-w-[640px] text-left text-sm" aria-label={ariaLabel}>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {columns.map((col) => {
                const sortable = !!col.sortValue;
                const active = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase ${col.headerClassName ?? ''}`}
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-charcoal"
                      >
                        {col.header}
                        {active ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={13} aria-hidden="true" />
                          ) : (
                            <ChevronDown size={13} aria-hidden="true" />
                          )
                        ) : (
                          <ChevronsUpDown size={13} className="opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter') onRowClick(row);
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={onRowClick ? 'cursor-pointer transition-colors hover:bg-primary-50/40' : 'hover:bg-slate-50/50'}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 text-charcoal ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
