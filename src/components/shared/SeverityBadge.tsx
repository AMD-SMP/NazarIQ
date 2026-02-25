import React from 'react'
import type { Severity } from '@/types'
import { SEVERITY_COLORS } from '@/lib/constants'

interface Props {
  severity: Severity
}

export const SeverityBadge = React.memo(function SeverityBadge({ severity }: Props) {
  const color = SEVERITY_COLORS[severity]
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        color: color,
        border: `1px solid ${color}55`,
        boxShadow: `0 0 8px ${color}30`,
      }}
    >
      {severity}
    </span>
  )
})
