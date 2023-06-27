import csv from 'fast-csv'
import path from 'path'

export default function readCSV(filePath, fileName) {
  return new Promise((resolve, reject) => {
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
      console.log(`Parsed ${rowCount} records from ${fileName || path.basename(filePath)}`)
      resolve(records)
    });
  })
}