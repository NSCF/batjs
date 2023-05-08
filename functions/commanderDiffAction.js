//This is a simple operation so no separate function module is used
import path from 'path'
import fs from 'fs-extra'

export default async function(options) {

  if(!options.source) {
    options.source = process.cwd()
  }
  else {
    options.source = options.source.trim()
    if(!fs.existsSync(options.source)) {
      console.error('Provided source directory does not exist')
      return 
    }
  }

  let exclude
  if (fs.existsSync(options.exclude.trim())){
    let excludeString = fs.readFileSync(options.exclude.trim(), 'utf8')
    exclude = excludeString.split(/[\s,;|]+/)
    if(!exclude.length) {
      console.error('Provided exclude file is empty. Bye!')
      return
    }
  }
  else {
    //it might be in the source dir
    options.exclude = path.resolve(options.source, options.exclude.trim())
    if (fs.existsSync(options.exclude)){
      let excludeString = fs.readFileSync(options.exclude.trim(), 'utf8')
      exclude = excludeString.split(/[\s,;|]+/)
      if(!exclude.length) {
        console.error('Provided exclude file is empty. Bye!')
        return
      }
    }
    else {
      console.error('Provided exclude file does not exist')
      return
    }
  }

  if(!options.fileTypes) {
    options.fileTypes = ['.jpg', '.jpeg']
  }
  else {
    options.fileTypes = options.fileTypes.trim().split(/[\s,;|]+/)
  }

  //file extensions start with a .
  options.fileTypes.forEach((type, index, arr) => {
    if (type[0] != '.'){
      arr[index] = `.${type}`
    }
  })

  let allFilePaths
  try{
    allFilePaths = await fs.readdir(options.source)
  }
  catch(err) {
    console.log('There was an error reading the source directory: ' + err)
    return
  }

  //filter out files not of the correct type
  let targetFiles = []
  const fileTypesUpper = options.fileTypes.map(x => x.toUpperCase())
  for (const filePath of allFilePaths) {
    const fileExtUpper = path.extname(filePath).toUpperCase()
    if(fileTypesUpper.includes(fileExtUpper)) {
      targetFiles.push(filePath)
    }
  }

  if(!targetFiles.length) {
    console.error('There are no files with extensions', options.fileTypes.join('|'), 'in this folder')
    return
  }

  console.log('there are', targetFiles.length, 'total files and', exclude.length, 'barcodes to exclude')

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

  console.log(targetFiles.length, 'files are not in the barcode list')

}

