const co = require('co')
const prompt = require('co-prompt')
const fs = require('fs-extra')
const path = require('path')
const csv = require('fast-csv')

const readCSV = require('../utils/readCSV')
const onlyUnique = require('../utils/onlyUnique')

module.exports = async function(options) {

  if(!options.fileTypes || !options.fileTypes.trim()) {
    options.fileTypes = '.cr2'
  }
  else {
    options.fileTypes = options.fileTypes.trim()
  }
  
  let promptMsg = ''
  if(!options.dir) {
    options.dir = process.cwd()
    promptMsg = 'Are you sure you want to rename images in the current directory'
  }
  else {
    options.dir = options.dir.trim()
    if(!fs.existsSync(options.dir)) {
      console.error('Provided directory does not exist')
      process.exit()
    }
    promptMsg = 'Are you sure you want to rename images in ' + options.dir
  }

  promptMsg += ' (Y/N)?'

  const proceed = await co(function* () { return yield prompt.confirm(promptMsg)})

  if (proceed) {

    const fileTypes = options.fileTypes.split(/\s,;/).map(x => {
      if (x.startsWith('.')) {
        return x
      }
      else {
        return '.' + x
      }
    })

    //get all the files in the dir
    const files = await fs.readdir(options.dir)
    const images = files.filter(file => fileTypes.some(ft => file.toLowerCase().endsWith(ft)))
    const csvs = files.filter(file => file.toLowerCase().endsWith('.csv'))

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

    if(csvs.length == 0) {
      console.error('No csv file found in the directory. Please make sure there is a csv file with barcodes for renaming files')
      process.exit()
    }

    if (csvs.length > 1) {
      console.error('More than one csv file is present in the directory. Please make sure there is only one csv file and that it contains the barcodes for renaming files')
      process.exit()
    }

    //confirm the number of images and barcodes are the same
    console.log('reading csv file')
    let records = []
    try {
      records = await readCSV(options.dir, csvs[0])
    }
    catch(err) {
      console.error('Error reading csv file:', err.message)
      process.exit()
    }

    if (records.length == 0) {
      console.error('There are no records in the CSV file. Please check and try again')
      process.exit()
    }

    //check for a barcode field
    const fields = Object.keys(records[0])
    let barcodeField = null
    if (options.field && options.field.trim) {
      if(fields.includes(options.field)) {
        field = options.field
      }
      else {
        console.error('csv file does not contain a field called', options.field)
        console.log('Please check the file and try again')
        process.exit()
      }
    }
    else {
      barcodeField = fields.find(x => {
        if(x.toLowerCase() == 'barcode') {
          return x
        }
      })

      if (barcodeField == null) {
        console.err('The csv file has no barcode field. Please check the file and try again')
        process.exit()
      }
    }

    //filter records with no barcode value
    records = records.filter(x => x[barcodeField] != null && x[barcodeField].trim() != '')
    
    //check the number of records in the csv equals the number of files
    if (records.length != images.length) {
      console.error('The number of records in the csv file and the number of image files does not match. Please correct and try again')
      process.exit()
    }

    //check that there are no blank barcodes...
    if (records.length != records.filter(x => x[barcodeField] && x[barcodeField].trim()).length) {
      console.error('The csv contains rows with blank barcodes. Please check the file and try again...')
      process.exit()
    }

    //check for duplicates in the csv file
    if (records.length != records.map(x => x[barcodeField]).filter(onlyUnique).length) {
      const promptMsg = 'There are duplicate barcodes in the csv file. Do you want to continue?'
      const proceed = await co(function* () {return yield prompt.confirm(promptMsg)})
      if(!proceed) {
        console.log('Bye now...')
        process.exit()
      }
    }

    console.log('Renaming files...')
    const updatedBarcodes = {} //we have to use this to track duplicates because they might not be sequential
    const originalnames = []
    for (const [index, imageName] of images.entries()) {
      const barcode = records[index][barcodeField].trim()
      let fileExt = imageName.split('.').pop()
      fileExt = '.' + fileExt
      let newName = barcode
      if(updatedBarcodes.hasOwnProperty(barcode)){
        updatedBarcodes[barcode]++
        newName += '_' + updatedBarcodes[barcode]
      }
      else {
        updatedBarcodes[barcode] = 0
      }

      newName += fileExt

      const fullOldName = path.join(options.dir, imageName)
      const fullNewName = path.join(options.dir, newName)

      try {
        await fs.rename(fullOldName, fullNewName)

        const update = {
          originalName: imageName,
          newName,
        }

        originalnames.push(update)
        lastBarcode = barcode
      }
      catch(err) {
        console.error('There was an error renaming files:', err.message)
        process.exit()
      }
    }

    console.log('writing record of name changes...')
    csv.writeToPath(path.join(options.dir, 'namechanges.csv'), originalnames, {headers: true})
    .on('error', err => {
      console.error('error writing name changes file:', err.message)
      process.exit()
    })
    .on('finish', _ => {
      console.log('all done...')
      process.exit(0)
    })
    
  }
  else {
    console.log('Have a great day...')
    process.exit(0)
  }
}
