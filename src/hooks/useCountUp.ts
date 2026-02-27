import { useState, useEffect, useRef } from 'react'

export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(target)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    const start = prevTarget.current !== target ? 0 : valueRef.current
    prevTarget.current = target
    const startTime = performance.now()

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)

    let raf: number
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutQuart(progress)
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
