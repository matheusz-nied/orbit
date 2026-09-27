import { useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import useStore from '../store/useStore'
import { BACKUP_STALE_AFTER, backupNow, supportsFileBackup } from '../utils/backup'

const DAY = 24 * 60 * 60 * 1000
// Quem acabou de chegar ainda não tem nada a perder — não cobra backup.
const GRACE_PERIOD = 7 * DAY

// Aviso discreto no canto: tudo vive no localStorage, e limpar o navegador
// apaga sites, agenda e notas sem volta.
export default function BackupReminder() {
  const lastBackupAt = useStore((state) => state.lastBackupAt)
  const firstSeenAt = useStore((state) => state.firstSeenAt)
  const snoozeUntil = useStore((state) => state.backupSnoozeUntil)
  const needsPermission = useStore((state) => state.backupNeedsPermission)
  const backupFileName = useStore((state) => state.backupFileName)
  const markBackup = useStore((state) => state.markBackup)
  const snoozeBackup = useStore((state) => state.snoozeBackup)
  const openSettings = useStore((state) => state.openSettings)
  const setToast = useStore((state) => state.setToast)
  const [busy, setBusy] = useState(false)

  const now = Date.now()
  const stale = lastBackupAt
    ? now - lastBackupAt > BACKUP_STALE_AFTER
    : now - firstSeenAt > GRACE_PERIOD

  // Backup automático configurado, só esperando um clique para reautorizar.
  const permissionPrompt = needsPermission && backupFileName

  if (now < snoozeUntil) return null
  if (!stale && !permissionPrompt) return null

  const days = lastBackupAt ? Math.floor((now - lastBackupAt) / DAY) : null
  const message = permissionPrompt
    ? 'O backup automático precisa da sua autorização de novo.'
    : days != null
      ? `Seu último backup foi há ${days} dias.`
      : 'Você ainda não tem backup — seus dados vivem só neste navegador.'

  const handleBackup = async () => {
    setBusy(true)
    try {
      const result = await backupNow()
      markBackup()
      setToast({ message: result === 'file' ? `Backup salvo em ${backupFileName}` : 'Backup baixado' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed left-4 right-4 top-20 sm:top-auto sm:right-auto sm:bottom-4 z-40 sm:max-w-xs print:hidden">
      {/* Animação e bg-card no mesmo elemento: com a animação num ancestral,
          o backdrop-filter dos temas de vidro não enxerga o fundo. */}
      <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl shadow-lg animate-slideIn">
        <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs text-text">{message}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            <button
              onClick={handleBackup}
              disabled={busy}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              {permissionPrompt ? 'Autorizar e salvar' : 'Fazer backup'}
            </button>
            {!backupFileName && supportsFileBackup() && (
              <button
                onClick={() => openSettings('data')}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                Automatizar
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => snoozeBackup(7)}
          className="shrink-0 text-muted hover:text-text transition-colors"
          aria-label="Lembrar daqui a uma semana"
          title="Lembrar daqui a uma semana"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
