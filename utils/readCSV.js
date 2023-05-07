const csv = require('fast-csv')
const path = require('path')

module.exports = function readCSV(filePath, fileName) {
  return new Promise((resolve, reject) =>{
    const records = []

    let file = null
    if(fileName) {
      file = path.join(filePath, fileName)
    }
    else {
      file = filePath
    }
    
    csv.parseFile(file, {headers: true})
    .on('error', error => reject(error))
    .on('data', row => records.push(row))
    .on('end', rowCount => {
      console.log(`Parsed ${rowCount} records from ${fileName}`)
      resolve(records)
    });
  })
}