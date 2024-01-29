// testing out ordering images by timestamp...
import fs from 'fs-extra'
import path from 'path'
import writeCSV from './utils/writeCSV.js'

const filedir = String.raw`C:\Herbarium imaging\Moss\processing\Hallie\20240129`
const files = fs.readdirSync(filedir)
const images = files.filter(x => x.toLowerCase().endsWith('.cr3'))

const imageStats = []
for (const image of images) {
  const stats = fs.statSync(path.join(filedir, image))
  stats.image = image
  imageStats.push(stats)
}

imageStats.sort((a, b) => {
  return a.ctimeMs - b.ctimeMs
})
const sortedImages = imageStats.map(x => ({barcode: x.image}))

await writeCSV(sortedImages, filedir, 'sorted.csv')
console.log('all done')

