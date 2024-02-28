import fs from 'fs-extra'
import path from 'path'

import readCSV from '../utils/readCSV.js'
import writeCSV from '../utils/writeCSV.js'

export default async function(options) {

  if(!options.dir) {
    options.dir = process.cwd()
  }
  else {
    options.dir = options.dir.trim()
  }

  if (!options.fileName) {
    const files = await fs.readdir(options.dir)
    const csvs = files.filter(file => file.toLowerCase().endsWith('.csv'))

    if (csvs.length == 1) {
      options.fileName = csvs[0]
    }
    else if (csvs.length == 0) {
      console.log('There are no csv files to update in this directory...')
      process.exit()
    }
    else {
      console.log('There are multiple csv files in this directory, please specify the filename to update...')
      process.exit()
    }
  }

  if (!options.column){
    options.column = 'barcode'
  }
 
  const recordsFile = path.join(options.dir, options.fileName)

  if(!fs.existsSync(recordsFile)){
    console.error(`There is no file named ${options.fileName} in this folder. Please try again...`)
    process.exit()
  }

  const records =  await readCSV(recordsFile)

  if (records.length ==0) {
    console.log(`There are no records in the file ${options.fileName}`)
    process.exit()
  }

  if (!options.column in records[0]) {
    console.log(`The column ${options.column} was not found in file ${options.fileName}. Please check and try again...`)
    process.exit()
  }

  // now we can make the values unique
  const valueDict = { }

  for (const record of records) {
    let value = record[options.column]
    if (typeof value == 'string') {
      value = value.trim()
    }

    if (value) {
      if (value in valueDict) {
        record[options.column] = value.toString() + '_' + valueDict[value].toString()
        valueDict[value]++
      }
      else {
        valueDict[value] = 1
      }
    }
  }

  const newFileName = options.fileName.replace(/\.csv$/i, '_uniquified.csv')

  try {
    await writeCSV(records, options.dir, newFileName)
    console.log('All done...')
  }
  catch(err) {
    console.log('Oops! Something went wrong writing the new file:', err.message)
  }

  process.exit()

}