import type { CSSProperties } from 'react'

type Props = {
  title: string
  action?: React.ReactNode
}

export function PageHeader({ title, action }: Props) {
  return (
    <div style={headerStyle}>
      <h1 style={titleStyle}>{title}</h1>
      {action && <div>{action}</div>}
    </div>
  )
}

const headerStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }
const titleStyle: CSSProperties = { margin: 0, fontSize: 22, fontWeight: 700 }
