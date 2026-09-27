import { useState } from 'react'
import { FileCheck2, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react'
import useStore from '../store/useStore'
import {
  backupPermission,
  chooseBackupFile,
  clearBackupHandle,
  loadBackupHandle,
  supportsFileBackup,
  writeBackup,
} from '../utils/backup'

const formatWhen = (ts) => {
  if (!ts) return 'nunca'
  return new Date(ts).toLocaleString('pt-BR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AutoBackupSettings() {
  const backupFileName = useStore((state) => state.backupFileName)
  const lastBackupAt = useStore((state) => state.lastBackupAt)
  const needsPermission = useStore((state) => state.backupNeedsPermission)
  const setBackupFile = useStore((state) => state.setBackupFile)
  const markBackup = useStore((state) => state.markBackup)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const supported = supportsFileBackup()

  const guard = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      // Cancelar o seletor de arquivo não é erro.
      if (e?.name !== 'AbortError') setError('Não foi possível gravar o arquivo de backup.')
    } finally {
      setBusy(false)
    }
  }

  const handleChoose = () => guard(async () => {
    const handle = await chooseBackupFile()
    setBackupFile(handle.name)
    markBackup()
  })

  const handleNow = () => guard(async () => {
    const handle = await loadBackupHandle()
    if (!handle) throw new Error('sem arquivo')
    if ((await backupPermission(handle, { request: true })) !== 'granted') {
      throw new Error('sem permissão')
    }
    await writeBackup(handle)
    markBackup()
  })

  const handleDisable = async () => {
    await clearBackupHandle()
    setBackupFile(null)
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-muted mb-1">Backup automático</h4>
      <p className="text-sm text-muted mb-3">
        Escolha um arquivo — de preferência numa pasta sincronizada (Drive, Dropbox, OneDrive) — e o
        Orbit regrava uma cópia uma vez por dia. Chaves de API nunca entram nesse arquivo.
      </p>

      {!supported ? (
        <p className="flex items-start gap-2 text-xs text-muted p-3 bg-bg border border-border rounded-lg">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          Este navegador não permite gravar arquivos automaticamente (funciona no Chrome, Edge e Opera).
          Use o botão Exportar abaixo — o Orbit avisa quando o último backup ficar antigo.
        </p>
      ) : backupFileName ? (
        <div className="p-3 bg-bg border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <FileCheck2 size={16} className="text-accent shrink-0" />
            <span className="flex-1 min-w-0 truncate text-sm text-text">{backupFileName}</span>
          </div>
          <p className="text-xs text-muted mt-1">
            Último backup: {formatWhen(lastBackupAt)}
            {needsPermission && ' · aguardando sua autorização'}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={handleNow}
              disabled={busy}
              className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg text-bg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw size={14} />
              {needsPermission ? 'Autorizar e salvar' : 'Salvar agora'}
            </button>
            <button
              onClick={handleChoose}
              disabled={busy}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-muted hover:text-text transition-colors"
            >
              Trocar arquivo
            </button>
            <button
              onClick={handleDisable}
              className="px-3 py-2 text-sm text-muted hover:text-red-500 transition-colors"
            >
              Desativar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleChoose}
          disabled={busy}
          className="flex items-center gap-2 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <FolderOpen size={18} />
          Escolher arquivo de backup
        </button>
      )}

      {error && (
        <p className="flex items-center gap-2 mt-3 text-sm text-red-500">
          <AlertCircle size={16} /> {error}
        </p>
      )}
    </div>
  )
}
