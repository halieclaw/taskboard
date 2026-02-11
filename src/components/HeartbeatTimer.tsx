'use client'

import { useState, useEffect } from 'react'

export function HeartbeatTimer() {
  const [minutesLeft, setMinutesLeft] = useState<number>(0)

  useEffect(() => {
    function calc() {
      const now = new Date()
      const min = now.getMinutes()
      const sec = now.getSeconds()
      // Heartbeat fires at :15 and :45 past each hour
      let nextMin: number
      if (min < 15) nextMin = 15
      else if (min < 45) nextMin = 45
      else nextMin = 75 // :15 of next hour
      const diff = (nextMin - min) * 60 - sec
      setMinutesLeft(Math.ceil(diff / 60))
    }
    calc()
    const id = setInterval(calc, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      <span>Next check in {minutesLeft}m</span>
    </div>
  )
}
