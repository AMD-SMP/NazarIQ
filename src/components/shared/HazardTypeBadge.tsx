import React from 'react'
import type { HazardType } from '@/types'
import { HAZARD_COLORS, HAZARD_LABELS } from '@/lib/constants'

interface Props {
  type: HazardType
}

export const HazardTypeBadge = React.memo(function HazardTypeBadge({ type }: Props) {
  const color = HAZARD_COLORS[type]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
      style={{
        background: `${color}18`,
        color: color,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {HAZARD_LABELS[type]}
    </span>
  )
})
