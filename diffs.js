//a basic diff for barcodes in two files, this should probably be its own command TODO
import fs from 'fs-extra'

const existingBarcodesFile = `Fabaceae_BrahmsExtract.CSV`
const imageFileNames = `image filenames.txt`

let excludeString = fs.readFileSync(existingBarcodesFile, 'utf8')
let exclude = excludeString.split(/[\s,;|]+/)

const imageFileNamesString = fs.readFileSync(imageFileNames, 'utf8')
let targetFiles = imageFileNamesString.split(/[\s,;|]+/)

console.log('there are', targetFiles.length, 'image file names')
console.log('we have', exclude.length, 'barcodes to exclude')

if(exclude && Array.isArray(exclude) && exclude.length > 0){
  //make a dictionary first, to be faster
  const excludeSet = new Set()
  for (let val of exclude) {
    const match = val.match(/(\d)+/)
    if(match && match.length) {
      excludeSet.add(match[0])
    }
  }

  //we have to compare the number in the image barcode to what we have from the exclude file
  const toInclude = [] //a temporary array
  for (const targetFile of targetFiles) {
    let match = targetFile.match(/(\d)+/)
    if(match) { //this shouldn't happen!
      if(!excludeSet.has(match[0])){
        toInclude.push(targetFile)
      }
    }
  }

  targetFiles = toInclude //so it's now just the ones we want to move/copy

}

console.log('there are', targetFiles.length, 'files that need to be moved')