export function generateSlug(title: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0]
  if (!title.trim()) {
    return dateStr
  }
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
  return titleSlug ? `${dateStr}-${titleSlug}` : dateStr
}
