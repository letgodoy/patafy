import React from 'react'
import type { CSSProperties } from 'react'
import { colors, radius, spacing } from '../tokens.js'

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
  expandedRow?: (row: T) => React.ReactNode
}

export function DataTable<T>({ columns, data, rowKey, loading, error, emptyText = 'Nenhum item encontrado.', rowStyle, expandedRow }: Props<T>) {
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
                <span style={{ color: colors.textMuted }}>Carregando...</span>
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
              <td colSpan={columns.length} style={{ ...centeredTdStyle, color: colors.textMuted }}>
                {emptyText}
              </td>
            </tr>
          )}
          {!loading && !error && data.map((row) => (
            <React.Fragment key={rowKey(row)}>
              <tr style={{ ...rowBaseStyle, ...rowStyle?.(row) }}>
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
              {expandedRow && (
                <tr>
                  <td colSpan={columns.length} style={{ padding: 0 }}>
                    {expandedRow(row)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const tableWrapStyle: CSSProperties = {
  background: colors.white,
  borderRadius: radius.md,
  overflow: 'hidden',
  border: `1px solid ${colors.border}`,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' }

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: `${spacing.sm}px ${spacing.md}px`,
  background: colors.tableHeader,
  fontSize: 12,
  fontWeight: 600,
  color: colors.textSecondary,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${colors.border}`,
}

const rowBaseStyle: CSSProperties = {
  transition: 'background 0.1s',
}

const tdStyle: CSSProperties = {
  padding: `${spacing.sm + 2}px ${spacing.md}px`,
  borderBottom: `1px solid ${colors.borderLight}`,
  fontSize: 14,
  color: colors.textPrimary,
  verticalAlign: 'middle',
}

const centeredTdStyle: CSSProperties = {
  ...tdStyle,
  textAlign: 'center',
  padding: `${spacing.xl}px ${spacing.md}px`,
}
