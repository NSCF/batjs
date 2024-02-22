import fs from 'fs-extra'
import clipboard from 'clipboardy';

const fileTypes = options.fileTypes.split(/\s,;/).map(x => {
  if (x.startsWith('.')) {
    return x
  }
  else {
    return '.' + x
  }
})

//get all the files in the dir
console.log('reading directory...')
const files = await fs.readdir(options.dir)
const images = files.filter(file => fileTypes.some(ft => file.toLowerCase().endsWith(ft)))

if(images.length == 0) {
  if(fileTypes.length > 1) {
    console.error('Could not find any files with extensions', fileTypes.join(' '))
  }
  else {
    console.error('Could not find any files with extension', fileTypes[0])
  }
  console.log('please double check the directory and try again')
  process.exit()
}

console.log('copying files...')
let copyString = images.join('\n')
clipboard.writeSync(copyString)

console.log('copied', images.length, 'file names to the clipboard')
console.log('have a nice day...')


