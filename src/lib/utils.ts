export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Práve teraz'
  if (minutes < 60) return `${minutes} min`
  if (hours < 24) return `${hours} hod`
  if (days < 7) return `${days} dní`

  return date.toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('sk-SK', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    invoice: 'Faktúra',
    contract: 'Zmluva',
    receipt: 'Doklad',
    ticket: 'Bloček',
    other: 'Iné',
  }
  return labels[category] || category
}

export function sanitizeFileName(name: string): string {
  const diacritics: Record<string, string> = {
    'á':'a','ä':'a','č':'c','ď':'d','é':'e','í':'i','ĺ':'l','ľ':'l',
    'ň':'n','ó':'o','ô':'o','ŕ':'r','š':'s','ť':'t','ú':'u','ý':'y',
    'ž':'z','Á':'A','Ä':'A','Č':'C','Ď':'D','É':'E','Í':'I','Ĺ':'L',
    'Ľ':'L','Ň':'N','Ó':'O','Ô':'O','Ŕ':'R','Š':'S','Ť':'T','Ú':'U',
    'Ý':'Y','Ž':'Z',
  }
  return name
    .split('').map(c => diacritics[c] || c).join('')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
}

const monthNames = [
  'Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún',
  'Júl', 'August', 'September', 'Október', 'November', 'December',
]

export function getMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  const idx = parseInt(m, 10) - 1
  return `${monthNames[idx]} ${year}`
}

export function getMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    options.push({ value, label: getMonthLabel(value) })
  }
  return options
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    invoice: 'bg-blue-100 text-blue-700',
    contract: 'bg-purple-100 text-purple-700',
    receipt: 'bg-green-100 text-green-700',
    ticket: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-700',
  }
  return colors[category] || colors.other
}
