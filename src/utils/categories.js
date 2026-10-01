import { defaultCategories } from './storage'

// Todo espaço tem ao menos uma categoria — sem nenhuma, um site novo não
// teria onde cair.
export const DEFAULT_CATEGORY = 'geral'

const EMPTY = []

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const strings = (list) =>
  Array.isArray(list) ? list.filter((item) => typeof item === 'string') : []

// Formato antigo (global): categorias num array e subcategorias em
// { [categoria]: string[] }. Cada espaço herda só o que seus sites usam; o que
// ninguém usa fica no primeiro espaço, para nada se perder.
const splitLegacy = (list, legacySubs, ids, sites) => {
  const used = Object.fromEntries(ids.map((id) => [id, {}]))
  const usedAnywhere = {}

  for (const site of sites) {
    if (!used[site.workspace] || !site.category) continue
    const local = (used[site.workspace][site.category] ||= new Set())
    const global = (usedAnywhere[site.category] ||= new Set())
    if (site.subcategory) {
      local.add(site.subcategory)
      global.add(site.subcategory)
    }
  }

  const categories = {}
  const subcategories = {}

  ids.forEach((id, index) => {
    categories[id] = list.filter(
      (cat) => used[id][cat] || (index === 0 && !usedAnywhere[cat]),
    )
    subcategories[id] = {}
  })

  for (const cat of list) {
    const subs = strings(legacySubs[cat])
    if (subs.length === 0) continue
    const owner = ids.find((id) => categories[id].includes(cat))

    for (const id of ids) {
      if (!categories[id].includes(cat)) continue
      const kept = subs.filter(
        (sub) => used[id][cat]?.has(sub) || (id === owner && !usedAnywhere[cat]?.has(sub)),
      )
      if (kept.length > 0) subcategories[id][cat] = kept
    }
  }

  return { categories, subcategories }
}

// Lê o que estiver salvo (formato antigo ou novo) e devolve os mapas por
// espaço, já consistentes com os sites. `changed` diz se precisa regravar.
export const normalizeCategories = ({ categories: saved, subcategories: savedSubs, workspaces, sites }) => {
  const ids = workspaces.map((w) => w.id)
  const subsAreLegacy = isPlainObject(savedSubs) && Object.values(savedSubs).some(Array.isArray)

  let categories = {}
  let subcategories = {}

  if (!isPlainObject(saved)) {
    const list = Array.isArray(saved) ? strings(saved) : defaultCategories
    const split = splitLegacy(list, subsAreLegacy ? savedSubs : {}, ids, sites)
    categories = split.categories
    subcategories = split.subcategories
  } else {
    for (const id of ids) categories[id] = strings(saved[id])
  }

  // Import parcial pode trazer categorias antigas com subcategorias já no
  // formato novo (ou o contrário) — cada metade é lida no formato que tiver.
  if (!subsAreLegacy && isPlainObject(savedSubs)) {
    for (const id of ids) {
      const own = isPlainObject(savedSubs[id]) ? savedSubs[id] : {}
      subcategories[id] = Object.fromEntries(
        Object.entries(own).map(([cat, subs]) => [cat, strings(subs)]),
      )
    }
  }
  for (const id of ids) subcategories[id] ||= {}

  // Site apontando para categoria/subcategoria que não existe no seu espaço
  // ficaria inalcançável pelas abas.
  for (const site of sites) {
    const list = categories[site.workspace]
    if (!list || !site.category) continue
    if (!list.includes(site.category)) list.push(site.category)
    if (site.subcategory) {
      const subs = (subcategories[site.workspace][site.category] ||= [])
      if (!subs.includes(site.subcategory)) subs.push(site.subcategory)
    }
  }

  for (const id of ids) {
    if (categories[id].length === 0) categories[id] = [DEFAULT_CATEGORY]
    for (const cat of Object.keys(subcategories[id])) {
      if (!categories[id].includes(cat)) delete subcategories[id][cat]
    }
  }

  const changed =
    JSON.stringify(saved) !== JSON.stringify(categories) ||
    JSON.stringify(savedSubs) !== JSON.stringify(subcategories)

  return { categories, subcategories, changed }
}

// Une as categorias de um espaço às de outro, sem duplicar — usado ao
// transferir os sites de um espaço removido.
export const mergeCategories = (target, source) => {
  const categories = [...target.categories]
  for (const cat of source.categories) {
    if (!categories.includes(cat)) categories.push(cat)
  }

  const subcategories = { ...target.subcategories }
  for (const [cat, subs] of Object.entries(source.subcategories)) {
    const merged = [...(subcategories[cat] || [])]
    for (const sub of subs) {
      if (!merged.some((s) => s.toLowerCase() === sub.toLowerCase())) merged.push(sub)
    }
    subcategories[cat] = merged
  }

  return { categories, subcategories }
}

// Seletores do espaço ativo. `EMPTY` mantém a referência estável para o
// Zustand não re-renderizar à toa.
export const selectCategories = (state) =>
  state.categories[state.activeWorkspace] || EMPTY

export const selectSubcategories = (category) => (state) =>
  state.subcategories[state.activeWorkspace]?.[category] || EMPTY
