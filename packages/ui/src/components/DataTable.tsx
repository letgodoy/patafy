import type { CSSProperties } from 'react'
import { colors } from '../tokens.js'

export type Column<T> = {
  key: string
  header: string
  width?: string | number
  render: (row: T) => React.ReactNode
}

type Props<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  loading?: boolean
  error?: string
  emptyText?: string
  rowStyle?: (row: T) => CSSProperties
}

export function DataTable<T>({ columns, data, rowKey, loading, error, emptyText = 'Nenhum item encontrado.', rowStyle }: Props<T>) {
  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} style={centeredTdStyle}>
                Carregando...
              </td>
            </tr>
          )}
          {!loading && error && (
            <tr>
              <td colSpan={columns.length} style={{ ...centeredTdStyle, color: colors.danger }}>
                {error}
              </td>
            </tr>
          )}
          {!loading && !error && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ ...centeredTdStyle, color: colors.textSecondary }}>
                {emptyText}
              </td>
            </tr>
          )}
          {!loading && !error && data.map((row) => (
            <tr key={rowKey(row)} style={rowStyle?.(row)}>
              {columns.map((col) => (
                <td key={col.key} style={tdStyle}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tableWrapStyle: CSSProperties = { background: colors.white, borderRadius: 8, overflow: 'hidden', border: `1px solid ${colors.border}` }
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: CSSProperties = { textAlign: 'left', padding: '10px 16px', background: colors.tableHeader, fontSize: 13, fontWeight: 600 }
const tdStyle: CSSProperties = { padding: '10px 16px', borderTop: `1px solid ${colors.borderLight}`, fontSize: 14, verticalAlign: 'middle' }
const centeredTdStyle: CSSProperties = { ...tdStyle, textAlign: 'center', padding: '24px 16px' }
