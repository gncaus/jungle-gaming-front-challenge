import { mkdir, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Gera as variantes WebP servidas pela aplicação a partir dos originais do Figma (1000×1000).
 * As vistas e larguras precisam bater com src/mocks/fixtures/images.ts.
 *
 * `full` é a arte inteira; as demais são recortes usados na galeria do detalhe.
 * Cada recorte é [esquerda, topo, lado] em fração da imagem original.
 */
const views = {
  full: { crop: [0, 0, 1], widths: [320, 480, 640, 1000] },
  face: { crop: [0.15, 0.05, 0.7], widths: [320, 640] },
  outfit: { crop: [0.15, 0.3, 0.7], widths: [320, 640] },
  profile: { crop: [0, 0.15, 0.7], widths: [320, 640] },
}

const sourceDir = fileURLToPath(new URL('../src/assets/nfts/', import.meta.url))
const outputDir = fileURLToPath(new URL('../public/images/nfts/', import.meta.url))

await mkdir(outputDir, { recursive: true })

for (const file of await readdir(sourceDir)) {
  if (extname(file) !== '.png') continue
  const name = basename(file, '.png')
  const source = join(sourceDir, file)
  const { width: size } = await sharp(source).metadata()

  for (const [view, { crop, widths }] of Object.entries(views)) {
    const [left, top, side] = crop.map((fraction) => Math.round(fraction * size))
    for (const width of widths) {
      const output = `${name}-${view}-${width}.webp`
      const info = await sharp(source)
        .extract({ left, top, width: side, height: side })
        .resize({ width, height: width })
        .webp({ quality: 78 })
        .toFile(join(outputDir, output))
      process.stdout.write(`${output}  ${Math.round(info.size / 1024)} KB\n`)
    }
  }
}
