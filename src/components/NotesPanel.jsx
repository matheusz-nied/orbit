import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import useStore from '../store/useStore'

export default function NotesPanel() {
  const notes = useStore((state) => state.notes)
  const setNotes = useStore((state) => state.setNotes)

  const [draft, setDraft] = useState(notes)
  const [saved, setSaved] = useState(true)
  const timerRef = useRef(0)
  const textareaRef = useRef(null)

  // Cresce com o texto; o teto fica no CSS (max-h relativo à viewport),
  // a partir dele a textarea passa a rolar.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [draft])

  // Grava com atraso para não bater no localStorage a cada tecla.
  const handleChange = (value) => {
    setDraft(value)
    setSaved(false)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = 0
      setNotes(value)
      setSaved(true)
    }, 400)
  }

  // Notas adicionadas por fora (paleta de comandos) com o painel aberto.
  // Só sincroniza sem edição pendente, para não atropelar o que está sendo digitado.
  useEffect(() => {
    if (!timerRef.current) setDraft(notes)
  }, [notes])

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

  const chars = draft.length

  return (
    <div className="w-72 sm:w-80">
      {/* pr-6 reserva o canto do botão de fechar do dock */}
      <h3 className="text-sm font-medium text-text mb-3 pr-6">Notas</h3>

      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Anotações rápidas — ficam salvas neste navegador."
        ref={textareaRef}
        rows={8}
        className="block w-full min-h-[10rem] max-h-[min(55vh,32rem)] overflow-y-auto px-3 py-2.5 bg-bg border border-border rounded-lg text-sm leading-relaxed text-text placeholder-muted resize-none focus:border-accent transition-colors"
      />

      <div className="flex items-center justify-between mt-2 text-[11px] text-muted">
        <span className="flex items-center gap-1.5" aria-live="polite">
          <span
            className={`w-1.5 h-1.5 rounded-full ${saved ? 'bg-accent' : 'bg-muted animate-pulse'}`}
            aria-hidden="true"
          />
          {saved ? 'Salvo' : 'Salvando…'}
        </span>
        <span>{chars} {chars === 1 ? 'caractere' : 'caracteres'}</span>
      </div>
    </div>
  )
}
