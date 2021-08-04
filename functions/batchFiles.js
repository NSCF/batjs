const moveFile = require('move-file');
const copyFile = require('cp-file')
const fs = require('fs-extra');
const path = require('path');

const makeDictionary = require('./makeDictionary.js')

module.exports = async function(sourcePath, destPath, batchSize, targetFileTypes, exclude, byOccurrence, copy){

  var sourcePath = path.resolve(process.cwd(), sourcePath)
  
  let items
  try{
    items = await fs.readdir(sourcePath)
  }
  catch(err) {
    console.log('There was an error reading the directory: ' + err)
    return
  }

  var moveFilePromiseArray = []

  let targetFileTypesUpper = targetFileTypes.map(x => x.toUpperCase())
  var targetFiles = items.filter(item => {
    let itemExtUpper = path.extname(item).toUpperCase()
    return targetFileTypesUpper.includes(itemExtUpper)
  })

  console.log('found', targetFiles.length, 'image files')

  //to simplify, make everything upper case
  //NB this might cause issues for moving files on case sensitive file systems
  targetFiles = targetFiles.map(x => x.toUpperCase())

  //remove if in exclude
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
      const fileName = path.basename(targetFile)
      let match = fileName.match(/(\d)+/)
      if(match) { //this shouldn't happen!
        if(!excludeSet.has(match[0])){
          toInclude.push(targetFile)
        }
      }
    }
  
    targetFiles = toInclude //so it's now just the ones we want to move/copy
    console.log(targetFiles.length, 'will be batched after excluding', exclude.length, 'existing records')
  }

  let transferFunc = moveFile
  if(copy){
    transferFunc = copyFile
  }

  let counter = 0
  if(byOccurrence){
    //make a dictionary of occurrences
    let barcodesArray = targetFiles.map(targetFile => targetFile.replace(path.extname(targetFile), ""))
    let occurrenceGroups = makeDictionary(barcodesArray)

    let keys = Object.keys(occurrenceGroups)
    
    //move all the files
    let firstKeyInd = 0
    let lastKeyInd = firstKeyInd + batchSize
    while (firstKeyInd < keys.length) {
      
      let thisChunkKeys = keys.slice(firstKeyInd, lastKeyInd)
      let thisChunkFiles = []
      let keyBarcodes, tf
      thisChunkKeys.forEach(key => {
        keyBarcodes = occurrenceGroups[key]
        for (const keyBarcode of keyBarcodes){
          tf = targetFiles.find(t => t.replace(/\.[^/.]+$/, "") == keyBarcode)
          thisChunkFiles.push(tf)
        }
      })

      for (var fileName of thisChunkFiles) {
        var oldPath = path.join(sourcePath, fileName)
        var newPath = path.join(destPath, `tempsub${counter}`, fileName)
        try {
          moveFilePromiseArray.push(transferFunc(oldPath, newPath))
        }
        catch(err) {
          console.error("Error moving/copying file", fileName)
          console.error(err.message)
        }
      }

      counter++ 

      firstKeyInd = lastKeyInd
      lastKeyInd = firstKeyInd + batchSize

    }
  }
  else {
    let firstFileInd = 0
    let lastFileInd = firstFileInd + batchSize
    while (firstFileInd < targetFiles.length) {
      
      let thisChunkFiles = targetFiles.slice(firstFileInd, lastFileInd)
      for (var fileName of thisChunkFiles) {
        var oldPath = path.join(sourcePath, fileName)
        var newPath = path.join(destPath, `tempsub${counter}`, fileName)
        moveFilePromiseArray.push(transferFunc(oldPath, newPath))
      }

      counter++ 

      firstFileInd = lastFileInd
      lastFileInd = firstFileInd + batchSize

    }
  }
  
  
  try {
    console.log('batching files, this may take a few minutes')
    await Promise.all(moveFilePromiseArray)
  }
  catch(err) {
    console.error('error moving files: ' + err)
    return
  }

  if(counter) {
    console.log('successfully moved', counter, 'file/s')
  }
  else {
    console.log('no files were moved')
  }

  //once moved rename the folders
  console.log('renaming temp folders')
  if(counter) {
    var folderRenamePromises = []
    
    //get what's in the folder now
    var dirs = await fs.readdir(destPath)
    dirs = dirs.filter(f => fs.statSync(path.join(destPath, f)).isDirectory())
    dirs = dirs.filter(dir => dir.includes('tempsub')) //in case there are other folders
  
    for (var dir of dirs) {
      var dirPath = path.join(destPath, dir)
      try {
        var dirItems =  await fs.readdir(dirPath);
      }
      catch(err) {
        console.log('error reading subdirectory ' + dir + ': ' + err)
        return
      }
  
      dirItems.sort();
      
      var firstItem = dirItems[0]
      var lastItem = dirItems[dirItems.length - 1]
      var newFolderName = firstItem.replace(path.extname(firstItem), '') + ' - ' + lastItem.replace(path.extname(lastItem), '')
      var newFolderPath = path.join(sourcePath, newFolderName) 
      folderRenamePromises.push(fs.rename(dirPath, newFolderPath))
    }
  
    try{
      await Promise.all(folderRenamePromises)
      console.log('folder names updated')
    }
    catch(err) {
      console.log('Error renaming temp folders: ' + err) 
      return
    }
  }

  console.log('all done!')
  return

}