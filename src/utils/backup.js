import { storage } from './storage'

// Backup automático num arquivo escolhido pelo usuário (File System Access API
// — Chrome/Edge/Opera). O handle do arquivo não cabe em localStorage, então vai
// para o IndexedDB, que aceita objetos estruturados.
const DB_NAME = 'orbit'
const STORE = 'handles'
const HANDLE_KEY = 'backup'

export const BACKUP_INTERVAL = 24 * 60 * 60 * 1000
export const BACKUP_STALE_AFTER = 14 * 24 * 60 * 60 * 1000

export const supportsFileBackup = () =>
  typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'indexedDB' in window

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const withStore = async (mode, fn) => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => { db.close(); resolve(req?.result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export const loadBackupHandle = async () => {
  if (!supportsFileBackup()) return null
  try {
    return (await withStore('readonly', (s) => s.get(HANDLE_KEY))) || null
  } catch {
    return null
  }
}

const saveHandle = (handle) => withStore('readwrite', (s) => s.put(handle, HANDLE_KEY))
export const clearBackupHandle = () => withStore('readwrite', (s) => s.delete(HANDLE_KEY)).catch(() => {})

/** 'granted' | 'prompt' | 'denied' — sem gesto do usuário só dá para consultar. */
export const backupPermission = async (handle, { request = false } = {}) => {
  try {
    const opts = { mode: 'readwrite' }
    if ((await handle.queryPermission(opts)) === 'granted') return 'granted'
    return request ? await handle.requestPermission(opts) : 'prompt'
  } catch {
    return 'denied'
  }
}

// API keys nunca vão para o arquivo automático — ele pode acabar numa pasta
// sincronizada (Drive, Dropbox) sem o usuário lembrar disso.
export const backupPayload = () =>
  JSON.stringify(storage.exportAll({ includeSecrets: false }), null, 2)

export const writeBackup = async (handle) => {
  const writable = await handle.createWritable()
  await writable.write(backupPayload())
  await writable.close()
}

/** Abre o seletor de arquivo (precisa de gesto do usuário) e já grava o primeiro backup. */
export const chooseBackupFile = async () => {
  const handle = await window.showSaveFilePicker({
    suggestedName: 'orbit-backup.json',
    types: [{ description: 'Backup do Orbit', accept: { 'application/json': ['.json'] } }],
  })
  await writeBackup(handle)
  await saveHandle(handle)
  return handle
}

/** Fallback universal: baixa o JSON. */
export const downloadBackup = () => {
  const blob = new Blob([backupPayload()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Backup imediato: grava no arquivo automático se houver (pedindo permissão —
 * precisa rodar dentro de um clique) ou cai para o download do JSON.
 * Devolve 'file' ou 'download'.
 */
export const backupNow = async () => {
  const handle = await loadBackupHandle()
  if (handle && (await backupPermission(handle, { request: true })) === 'granted') {
    try {
      await writeBackup(handle)
      return 'file'
    } catch {
      // Arquivo inacessível — o download ao menos garante uma cópia.
    }
  }
  downloadBackup()
  return 'download'
}
