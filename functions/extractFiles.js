//read all files in subfolders and copy to a new folder, such as on another hard drive
//for unbatching images in subfolders

import path from 'path'
import fs from 'fs-extra' //for reading contents on a dir only (not recursive)
import dir from 'node-dir' //for recursively reading directories
import { copyFile } from 'cp-file'
import { moveFile } from 'move-file'
import { Bar } from 'cli-progress'


import readCSV from '../utils/readCSV.js'
import writeCSV from '../utils/writeCSV.js'
import onlyUnique from '../utils/onlyUnique.js'

/**
 * sourcePath is a directory containing all the folders with family names - it must exist
 * targetPath is the directory to move everything to - default is sourcePath
 * moveFiles is whether to move the files - default is to copy the files
 * recursive is whether to look through the whole folder tree or just one level down, default is one level down
 * targetFileTypes is file types to filter on
 * endDir is for filtering on the name of the immediate parent directory of files
 * anydir is for filtering on any parent directory of files
 */
export default async function(sourcePath, destPath, moveFiles, recursive, targetFileTypes, endDir, anyDir, filterFiles, writeList) {

  var sourcePath = path.resolve(process.cwd(), sourcePath)

  var destPath = path.resolve(process.cwd(), destPath)

  let transferFunc = copyFile
  if (moveFiles){
    transferFunc = moveFile
  }

  //get the targetFiles
  let targetFilePaths = []
  
  console.log('reading directory...')
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
        const srcPathFiles = srcPathItems.map(item => path.join(sourcePath, item)).filter(isFile)
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

  let targetFileTypesUpper = targetFileTypes.map(x => x.toUpperCase())
  targetFilePaths = targetFilePaths.filter(item => {
    let itemExtUpper = path.extname(item).toUpperCase()
    return targetFileTypesUpper.includes(itemExtUpper)
  })

  if (targetFilePaths.length == 0) {
    console.log('no files with file types', targetFileTypes.join(' '))
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
    console.log('no files in folder/s', anyDir)
    return
  }

  if(endDir) {
    targetFilePaths = targetFilePaths.filter(filePath => {
      let endPart = filePath.split(/[\\\/]/).pop().toUpperCase()
      return endPart == endDir.toUpperCase()
    })
  }

  if (targetFilePaths.length == 0) {
    console.log('no files in folder/s', endDir)
    return
  }

  if(filterFiles) {
    
    let filterNames
    if(fs.lstatSync(filterFiles).isFile()) {
      if (path.extname(filterFiles).toLowerCase() == '.txt') {
        const filesString = await fs.readFile(filterFiles, "utf8")
        filterNames = filesString.split(/[\r\n,;|]+/).filter(x => x && x.trim()).map(x => x.trim().toUpperCase())
      } 
      //csv file
      else if (path.extname(filterFiles).toLowerCase() == '.csv') {
        const csvData = await readCSV(filterFiles)
        filterNames = csvData.map(x => x['barcode'].toUpperCase())
      }
    }
    else { //it might be a list
      filterNames = filterFiles.replace(/\s+/g, ' ').trim().split(/[\s,|]/).filter(x => x)
    }

    targetFilePaths = targetFilePaths.filter(filePath => {
      let fname = path.basename(filePath).replace(path.extname(filePath), "").toUpperCase()
      return filterNames.some(x => fname.startsWith(x))
    })

  }

  if (targetFilePaths.length == 0) {
    console.log('no files match those in the list provided')
    return
  }

  if (writeList) {
    const writeFileNames = targetFilePaths.map(x => path.basename(x))
    targetFilePaths.sort((a, b) => {
      const firstFileName = path.basename(a)
      const secondFileName = path.basename(b)
      if(firstFileName < secondFileName) {
        return -1
      }
      else if (secondFileName < firstFileName) {
        return 1
      }
      else {
        return 0
      }
    })
    const uniqueWriteFileNames = writeFileNames.filter(onlyUnique)
    const writeFileRecords = uniqueWriteFileNames.map(x => ({filename: x}))
  
    try {
      await writeCSV(writeFileRecords, path.resolve('./'), 'moveFileNames.csv')
    }
    catch(err) {
      console.error('error writing file:', err.message)
    }
  }

  //The actual transfer of files...
  const bar = new Bar()
  bar.start(targetFilePaths.length, 0)
  for (const targetFilePath of targetFilePaths) {
    let fileName = path.basename(targetFilePath)
    let newFilePath = path.join(destPath, fileName)
    try {
      await transferFunc(targetFilePath, newFilePath)
      bar.increment()
    }
    catch(err) {
      bar.stop()
      console.error(`Error copying file ${fileName}: ${err.message}`)
      process.exit()
    }
  }

  bar.stop()

  if (moveFiles) {
    console.log(`${targetFilePaths.length} files successfully moved`)
  }
  else {
    console.log(`${targetFilePaths.length} files successfully copied`)
  }

  return

}