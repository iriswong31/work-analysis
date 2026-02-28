import React from 'react';
import { motion } from 'framer-motion';

interface TableColumn {
  key: string;
  title: string;
  width?: string;
}

interface CompareTableProps {
  columns: TableColumn[];
  data: Record<string, string | React.ReactNode>[];
  highlightColumn?: string;
}

export const CompareTable: React.FC<CompareTableProps> = ({ 
  columns, 
  data, 
  highlightColumn 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-xl"
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700/50">
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-left text-sm font-semibold
                  ${column.key === highlightColumn 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-slate-300'}
                `}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <motion.tr
              key={rowIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: rowIndex * 0.05 }}
              className={`
                border-b border-slate-700/30 last:border-0
                hover:bg-slate-700/20 transition-colors
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm
                    ${column.key === highlightColumn 
                      ? 'text-blue-300 bg-blue-500/5 font-medium' 
                      : 'text-slate-400'}
                  `}
                >
                  {row[column.key]}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default CompareTable;
