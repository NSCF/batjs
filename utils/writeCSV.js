import csv from 'fast-csv'
import path from 'path'

export default function writeCSV(data, filePath, fileName) {
  return new Promise((resolve, reject) => {


    let file = null
    if(fileName) {
      file = path.join(filePath, fileName)
    }
    else {
      file = filePath
    }
    
    csv.writeToPath(file, data, {headers: true})
    .on('error', error => reject(error))
    .on('finish', _ => {      
      console.log(`Done writing data to file`)
      resolve()
    });
  })
}