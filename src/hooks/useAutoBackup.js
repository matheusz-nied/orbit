import { useEffect } from 'react'
import useStore from '../store/useStore'
import {
  BACKUP_INTERVAL,
  backupPermission,
  loadBackupHandle,
  supportsFileBackup,
  writeBackup,
} from '../utils/backup'

// Uma vez por dia (com a aba visível) regrava o arquivo de backup escolhido.
// Se o navegador pedir a permissão de novo — Chrome esquece após reiniciar —
// só sinaliza: pedir permissão exige um clique do usuário.
export function useAutoBackup() {
  const markBackup = useStore((state) => state.markBackup)
  const setBackupFile = useStore((state) => state.setBackupFile)
  const setBackupNeedsPermission = useStore((state) => state.setBackupNeedsPermission)

  useEffect(() => {
    if (!supportsFileBackup()) return

    let cancelled = false

    const run = async () => {
      const handle = await loadBackupHandle()
      if (cancelled || !handle) return
      setBackupFile(handle.name)

      const { lastBackupAt } = useStore.getState()
      if (lastBackupAt && Date.now() - lastBackupAt < BACKUP_INTERVAL) return

      const permission = await backupPermission(handle)
      if (cancelled) return
      if (permission !== 'granted') {
        setBackupNeedsPermission(true)
        return
      }

      try {
        await writeBackup(handle)
        if (!cancelled) markBackup()
      } catch {
        // Arquivo movido/apagado: pede para o usuário escolher de novo.
        if (!cancelled) setBackupNeedsPermission(true)
      }
    }

    // Espera a página assentar — o boot já tem trabalho suficiente.
    const timeout = setTimeout(run, 4000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [markBackup, setBackupFile, setBackupNeedsPermission])
}
