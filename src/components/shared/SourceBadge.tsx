import React from 'react'
import type { SourceName } from '@/types'
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/constants'

interface Props {
  source: SourceName
}

export const SourceBadge = React.memo(function SourceBadge({ source }: Props) {
  const color = SOURCE_COLORS[source]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: `${color}15`, color }}
    >
      {SOURCE_LABELS[source]}
    </span>
  )
})
