import { useState, useEffect, useRef } from 'react'
import useStore from '../store/useStore'

export default function NotesPanel() {
  const notes = useStore((state) => state.notes)
  const setNotes = useStore((state) => state.setNotes)

  const [draft, setDraft] = useState(notes)
  const [saved, setSaved] = useState(true)
  const timerRef = useRef(0)

  // Grava com atraso para não bater no localStorage a cada tecla.
  const handleChange = (value) => {
    setDraft(value)
    setSaved(false)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setNotes(value)
      setSaved(true)
    }, 400)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Se o usuário fechar a aba dentro da janela do debounce, o texto pendente
  // seria perdido — este efeito garante a gravação na saída.
  useEffect(() => {
    const flush = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = 0
        setNotes(draft)
      }
    }

    window.addEventListener('pagehide', flush)
    return () => window.removeEventListener('pagehide', flush)
  }, [draft, setNotes])

  return (
    <div className="w-72 sm:w-80">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-text">Notas</h3>
        <span className="text-[11px] text-muted">{saved ? 'Salvo' : 'Salvando…'}</span>
      </div>

      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Anotações rápidas — ficam salvas neste navegador."
        rows={8}
        className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder-muted resize-none focus:border-accent transition-colors"
      />
    </div>
  )
}
