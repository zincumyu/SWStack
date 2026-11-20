export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  try {
    area.select()
    if (!document.execCommand('copy')) {
      throw new Error('复制失败')
    }
  } finally {
    area.remove()
  }
}

export function copyCurrentUrl(): Promise<void> {
  return copyText(window.location.href)
}
