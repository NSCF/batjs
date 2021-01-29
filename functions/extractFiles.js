//read all files in subfolders and copy to a new folder, such as on another hard drive
//for unbatching images in subfolders

const copyFile = require('cp-file')
const moveFile = require('move-file');
const fs = require('fs-extra') //for reading contents on a dir only (not recursive)
const dir = require('node-dir') //for recursively reading directories
const path = require('path')

/**
 * sourcePath is a directory containing all the folders with family names - it must exist
 * targetPath is the directory to move everything to - default is sourcePath
 * moveFiles is whether to move the files - default is to copy the files
 * recursive is whether to look through the whole folder tree or just one level down, default is one level down
 * targetFileTypes is file types to filter on
 * endDir is for filtering on the name of the immediate parent directory of files
 * anydir is for filtering on any parent directory of files
 */
module.exports = async function(sourcePath, destPath, moveFiles, recursive, targetFileTypes, endDir, anyDir, filterFiles){

  var sourcePath = path.resolve(process.cwd(), sourcePath)

  var destPath = path.resolve(process.cwd(), destPath)

  let transferFunc = copyFile
  if (moveFiles){
    transferFunc = moveFile
  }

  //get the targetFiles
  let targetFilePaths = []
  
  try{
    if(recursive) {
      targetFilePaths = await dir.promiseFiles(sourcePath)
    }
    else {
      const isDirectory = itemPath => fs.lstatSync(itemPath).isDirectory()
      const isFile = itemPath => fs.lstatSync(itemPath).isFile()
      let srcPathItems = await fs.readdir(sourcePath)
      let srcPathDirectories = srcPathItems.map(item => path.join(sourcePath, item)).filter(isDirectory)
      
      let dirItems
      let dirFiles
      let dirFilePaths
      for (const dir of srcPathDirectories) {
        dirItems = await fs.readdir(dir)
        dirFilePaths = dirItems.map(item => path.join(dir, item)).filter(isFile)
        targetFilePaths = [...targetFilePaths, ...dirFilePaths]
        dirItems = null ; dirFiles = null ; dirFilePaths = null; //cleaning up just in cases
      }
      if(sourcePath != destPath) {
        srcPathFiles = srcPathItems.map(item => path.join(sourcePath, item)).filter(isFile)
        targetFilePaths = [...targetFilePaths, ...srcPathFiles]
      }
    }
  }
  catch(err){
    console.log('error reading directory: ', err.message)
    return 
  }
  
  targetFilePaths = targetFilePaths.filter(item => path.extname(item)) //shouldn't be necessary but just in case...

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  targetFileTypes = targetFileTypes.map(type => {
    if(type[0] != '.') {
      return '.' + type
    }
    else {
      return type
    }
  })

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  let targetFileTypesUpper = targetFileTypes.map(x => x.toUpperCase())
  targetFilePaths = targetFilePaths.filter(item => {
    let itemExtUpper = path.extname(item).toUpperCase()
    return targetFileTypesUpper.includes(itemExtUpper)
  })

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  if (anyDir){
    let parts
    targetFilePaths = targetFilePaths.filter(filePath => {
      parts = filePath.split(/[\\\/]/).map(part => part.toUpperCase())
      return parts.includes(anyDir.toUpperCase())
    })
  }

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  if(endDir) {
    let endPart
    targetFilePaths = targetFilePaths.filter(filePath => {
      endPart = filePath.split(/[\\\/]/).pop().toUpperCase()
      return endPart == endDir.toUpperCase()
    })
  }

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  if(filterFiles) {
    if(fs.lstatSync(filterFiles).isFile() && path.extname(filterFiles).toLowerCase() == '.txt') {  //must be a txt file
      let filesString = await fs.readFile(filterFiles)
      let filterFileNames = filesString.split(/[\s,;|]+/).filter(x => x).map(x => x.toUpperCase())
      targetFilePaths = targetFilePaths.filter(filePath => {
        let fname = path.basename(filePath).replace(path.extname(filePath), "").toUpperCase()
        return filterFileNames.includes(fname)
      })
    } 
  }

  if (targetFilePaths.length == 0) {
    console.log('no files match the criteria to transfer')
    return
  }

  //else
  let moveFilePromiseArray = [];
  for (const targetFilePath of targetFilePaths) {
    let fileName = path.basename(targetFilePath)
    let newFilePath = path.join(destPath, fileName)
    moveFilePromiseArray.push(transferFile(targetFilePath, newFilePath, transferFunc))
  }

  try {
    let transferResults = await Promise.all(moveFilePromiseArray)
    let summary = {}
    transferResults.forEach(res =>{
      if(!res) {
        if(summary[res.err.code]) {
          summary[res.err.code].push(res.file)
        }
        else {
          summary[res.err.code] = [res.file]
        }
      }
    })

    let keys = Object.keys(summary)
    if (keys.length > 0) {
      console.log('file transfer complete with the following errors :')
      keys.forEach(key => console.log(`${key}: ${summary[key].join(',')}`))
    }
    else {
      console.log('file transfer complete without errors')
    }
  }
  catch(err){
    console.log('error moving files: ', err.message)
    return
  }

  if (moveFile) {
    console.log(`${targetFilePaths.length} files successfully moved`)
  }
  else {
    console.log(`${targetFilePaths.length} files successfully copied`)
  }
  return
}

function transferFile(sourcePath, destPath, transferFunc) {
  return new Promise(resolve => {
    transferFunc(sourcePath, destPath)
    .then(_ => resolve(true))
    .catch(err => {
      resolve( { file: sourcePath,  err: err } )
    })
  })
}