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

  //to simplify, make everything upper case
  //NB this might cause issues for moving files on case sensitive file systems
  targetFiles = targetFiles.map(x => x.toUpperCase())

  //remove if in exclude
  if(exclude && Array.isArray(exclude) && exclude.length > 0){
    exclude = exclude.map(x => x.toUpperCase())
    let fileBarcodes = targetFiles.map(f => f.replace(/\.[^/.]+$/, "")) //remove file extensions, see https://stackoverflow.com/questions/4250364/how-to-trim-a-file-extension-from-a-string-in-javascript/34301737
    let barcodesToCapture = fileBarcodes.filter(fileBarcode => {
      return !exclude.some(ex => fileBarcode == ex || (fileBarcode.startsWith(ex) && isNaN(fileBarcode[ex.length])))
    })

    targetFiles = targetFiles.filter(targetFile => barcodesToCapture.includes(targetFile.replace(/\.[^/.]+$/, "")))

  }

  let transferFunc = moveFile
  if(copy){
    transferFunc = copyFile
  }

  if(byOccurrence){
    //make a dictionary of occurrences
    let barcodesArray = targetFiles.map(targetFile => targetFile.replace(path.extname(targetFile), ""))
    let occurrenceGroups = makeDictionary(barcodesArray)

    let keys = Object.keys(occurrenceGroups)
    
    //move all the files
    let firstKeyInd = 0
    let lastKeyInd = firstKeyInd + batchSize
    let counter = 0
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
        moveFilePromiseArray.push(transferFunc(oldPath, newPath))
      }

      counter++ 

      firstKeyInd = lastKeyInd
      lastKeyInd = firstKeyInd + batchSize

    }
  }
  else {
    let firstFileInd = 0
    let lastFileInd = firstFileInd + batchSize
    let counter = 0
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
  
  //once moved rename the folders
  try{
    await Promise.all(moveFilePromiseArray)
  }
  catch(err) {
    console.log('error moving files: ' + err)
  }

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
  }
  catch(err) {
    console.log('Error renaming subfolders: ' + err) 
    return
  }

  return

}