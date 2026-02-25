import React, { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

export function GlassCard({ children, className }: Props) {
  return (
    <div className={cn('glass-card rounded-lg p-4', className)}>
      {children}
    </div>
  )
}
