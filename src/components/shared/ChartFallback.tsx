import React from 'react'

interface ChartFallbackProps {
  message?: string
}

export function ChartFallback({ message = 'No data available' }: ChartFallbackProps) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30">
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}
