const csv = require('fast-csv')
const path = require('path')

module.exports = function readCSV(filePath, fileName) {
  return new Promise((resolve, reject) =>{
    const records = []
    csv.parseFile(path.join(filePath, fileName), {headers: true})
    .on('error', error => reject(error))
    .on('data', row => records.push(row))
    .on('end', rowCount => {
      console.log(`Parsed ${rowCount} records from ${fileName}`)
      resolve(records)
    });
  })
}