import { useState } from 'react'

interface IterationEntry {
  instruction: string
  changedFiles: string[]
  timestamp: string
}

export function useIterationHistory() {
  const [history, setHistory] = useState<IterationEntry[]>([])

  function addIteration(entry: Omit<IterationEntry, 'timestamp'>) {
    setHistory((prev) => [
      ...prev,
      { ...entry, timestamp: new Date().toISOString() },
    ])
  }

  function clearHistory() {
    setHistory([])
  }

  return { history, addIteration, clearHistory }
}
