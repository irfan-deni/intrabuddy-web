import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sourcePath = 'public/intra_buddy_icons/intra_buddy_icon.png'
const src = path.join(process.cwd(), sourcePath)
const outDir = path.join(process.cwd(), 'public', 'icons')

const sizes = [16, 32, 48, 72, 96, 128, 180, 192, 256, 512]

if (!fs.existsSync(src)) {
  console.error('Source logo not found at', src)
  console.error(`Place your source PNG at ${sourcePath} and re-run \`npm run generate:icons\``)
  process.exit(1)
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

async function gen() {
  try {
    for (const size of sizes) {
      const out = path.join(outDir, `icon-${size}.png`)
      await sharp(src).resize(size, size, { fit: 'contain' }).png({ quality: 90 }).toFile(out)
      console.log('Written', out)
    }

    // ICO files can contain PNG images for each supported size.
    const faviconSizes = [16, 32, 48]
    const faviconBuffers = await Promise.all(
      faviconSizes.map((s) => sharp(src).resize(s, s).ensureAlpha().png().toBuffer())
    )

    const faviconOut = path.join(process.cwd(), 'public', 'favicon.ico')
    const header = Buffer.alloc(6 + faviconSizes.length * 16)
    header.writeUInt16LE(1, 2) // ICO type
    header.writeUInt16LE(faviconSizes.length, 4)
    let offset = header.length
    faviconBuffers.forEach((buffer, index) => {
      const entry = 6 + index * 16
      header.writeUInt8(faviconSizes[index], entry)
      header.writeUInt8(faviconSizes[index], entry + 1)
      header.writeUInt16LE(1, entry + 4) // color planes
      header.writeUInt16LE(32, entry + 6) // bits per pixel
      header.writeUInt32LE(buffer.length, entry + 8)
      header.writeUInt32LE(offset, entry + 12)
      offset += buffer.length
    })
    fs.writeFileSync(faviconOut, Buffer.concat([header, ...faviconBuffers]))
    console.log('Written', faviconOut)

    console.log('Icon generation complete.')
  } catch (err) {
    console.error('Error generating icons:', err)
    process.exit(1)
  }
}

gen()
