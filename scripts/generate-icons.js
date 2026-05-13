import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const src = path.join(process.cwd(), 'public', 'icons', 'logo.png')
const outDir = path.join(process.cwd(), 'public', 'icons')

const sizes = [16, 32, 48, 72, 96, 128, 180, 192, 256, 512]

if (!fs.existsSync(src)) {
  console.error('Source logo not found at', src)
  console.error('Place your source PNG at public/icons/logo.png and re-run `npm run generate:icons`')
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

    // create a multi-size favicon.ico (16,32,48)
    const faviconSizes = [16, 32, 48]
    const faviconBuffers = await Promise.all(
      faviconSizes.map((s) => sharp(src).resize(s, s).png().toBuffer())
    )

    // sharp can write ico via toFile with .ico in filename on some platforms; fallback: write first as png
    const faviconOut = path.join(process.cwd(), 'public', 'favicon.ico')
    // Use png buffers concatenated as a simple ico generator is non-trivial; instead write 32x32 as favicon
    await sharp(faviconBuffers[1]).toFile(faviconOut)
    console.log('Written', faviconOut)

    console.log('Icon generation complete. Place the source at public/icons/logo.png to regenerate.')
  } catch (err) {
    console.error('Error generating icons:', err)
    process.exit(1)
  }
}

gen()
