const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp']
const sidePx = 256
/** Cor de fundo para imagens com transparência, a mesma do cartão onde o avatar aparece. */
const backgroundColor = '#241612'

export const avatarAccept = acceptedTypes.join(',')

/**
 * Prepara a imagem escolhida para envio: recorta ao centro em um quadrado de 256 px e
 * devolve um JPEG como data URL, pequeno o bastante para o limite da API.
 */
export async function toAvatarDataUrl(file: File): Promise<string> {
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Envie uma imagem PNG, JPEG ou WebP.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Não foi possível ler a imagem. Tente outro arquivo.')
  }

  const canvas = document.createElement('canvas')
  canvas.width = sidePx
  canvas.height = sidePx
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Não foi possível preparar a imagem neste navegador.')
  }

  const scale = Math.max(sidePx / bitmap.width, sidePx / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.fillStyle = backgroundColor
  context.fillRect(0, 0, sidePx, sidePx)
  context.drawImage(bitmap, (sidePx - width) / 2, (sidePx - height) / 2, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', 0.85)
}
