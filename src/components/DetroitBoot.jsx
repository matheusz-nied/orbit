import { useEffect, useRef, useState } from 'react'
import useStore from '../store/useStore'

// Tempo total da sequência — precisa bater com o fade-out do .dbh-boot no CSS.
const BOOT_MS = 2800

const LINES = [
  ['Inicializando sistema', 'OK'],
  ['Biocomponentes', 'OK'],
  ['Nível de Thirium', '100%'],
  ['Memória', 'OK'],
]

// Tela de boot de android que toca uma vez quando o usuário *ativa* o tema
// Detroit — não a cada nova aba, que é quando ela viraria só espera.
export default function DetroitBoot() {
  const theme = useStore((state) => state.theme)
  const prevTheme = useRef(theme)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (theme === 'detroit' && prevTheme.current !== 'detroit') {
      setRunId((id) => id + 1)
    }
    prevTheme.current = theme
  }, [theme])

  useEffect(() => {
    if (!runId) return
    const timer = setTimeout(() => setRunId(0), BOOT_MS)
    return () => clearTimeout(timer)
  }, [runId])

  if (!runId || theme !== 'detroit') return null

  return (
    <div key={runId} className="dbh-boot" aria-hidden>
      <div className="dbh-boot-core">
        <span className="dbh-boot-led" />
        <p className="dbh-boot-brand">CyberLife</p>
        <p className="dbh-boot-model">RK800 · #313 248 317 — 51</p>
        <ul className="dbh-boot-lines">
          {LINES.map(([label, value], i) => (
            <li key={label} style={{ '--i': i }}>
              <span>{label}</span>
              <b>{value}</b>
            </li>
          ))}
        </ul>
        <p className="dbh-boot-status">Status: online</p>
      </div>
    </div>
  )
}
