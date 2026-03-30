export function withOpacity(color: string, opacity: number): string {
  if (opacity >= 1) {
    return color
  }

  if (color.startsWith('rgba(') || color.startsWith('hsla(')) {
    return color
  }

  if (color.startsWith('#') && color.length === 7) {
    const r = Number.parseInt(color.slice(1, 3), 16)
    const g = Number.parseInt(color.slice(3, 5), 16)
    const b = Number.parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  return color
}
