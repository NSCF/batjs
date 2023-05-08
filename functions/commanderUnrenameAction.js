import co from 'co'
import prompt from 'co-prompt'
import fs from 'fs-extra'
import path from 'path'


import readCSV from '../utils/readCSV.js'

export default async function(options) {

  if(!options.dir) {
    options.dir = process.cwd()
  }
  else {
    options.dir = options.dir.trim()
  }

  const recordsFile = path.join(options.dir, 'namechanges.csv')

  if(!fs.existsSync(recordsFile)){
    console.error('There is no namechanges.csv file in this folder. This file is needed to revert file name changes.')
    process.exit()
  }

  const records =  await readCSV(options.dir, 'namechanges.csv')

  const missingFiles = []
  for (const record of records) {
    const currentFileName = path.join(options.dir, record.newName)
    const originalFileName = path.join(options.dir, record.originalName)
    
    if(fs.existsSync(currentFileName)) {
      fs.renameSync(currentFileName, originalFileName)
    }
    else {
      missingFiles.push(record.newName)
    }
  }

  //NB not deleting namechanges.csv here
  if (missingFiles.length){
    console.log('The following files no longer exist in this directory:')
    console.log(missingFiles.join('|'))
  }

  console.log('All done...')

  process.exit()

}