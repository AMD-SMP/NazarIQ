import React from 'react'
import type { Status } from '@/types'
import { STATUS_COLORS } from '@/lib/constants'

interface Props {
  status: Status
}

export const StatusBadge = React.memo(function StatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status]
  const showBlink = status === 'IN_PROGRESS' || status === 'ALERTED'
  const label = status.replace('_', ' ')

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
      style={{
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {showBlink && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full animate-blink"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  )
})
