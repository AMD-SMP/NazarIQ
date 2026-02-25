import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  title?: string
  description?: string
}

export function EmptyState({ title = 'No data found', description = 'Try adjusting your filters' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-muted-foreground opacity-40 mb-3" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  )
}
