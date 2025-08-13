export function normalizeText(s: string, form: 'NFC'|'NFD'|'NFKC'|'NFKD') {
  try { return s.normalize(form) } catch { return 'Normalization not supported' }
}
