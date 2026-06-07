import React from 'react';
import { cn } from '../../lib/utils';

export default function Table({
  headers = [],
  data = [],
  renderRow,
  emptyMessage = "No records found.",
  className
}) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm", className)}>
      <table className="w-full border-collapse text-left text-sm text-slate-600 font-sans">
        <thead className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-700 tracking-wide text-xs uppercase select-none">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-4.5 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row, idx) => renderRow(row, idx))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400 font-medium">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
