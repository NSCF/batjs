import fs from 'fs-extra'
import path from 'path'
import co from 'co'
import prompt from 'co-prompt'

export default async function(options) {

  if(!options.source || !options.source.trim()) {
    options.source = process.cwd()
  }
  else {
    options.source = options.source.trim()
    if(!fs.existsSync(options.source) || !fs.lstatSync(options.source).isDirectory()) {
      console.log('Selected source directory does not exist')
      return 
    }
  }

  if(!options.dest || !options.dest.trim()) {
    console.log('A target directory is required')
    return
  }
  else {
    options.dest = options.dest.trim()
    if(!fs.existsSync(options.dest) || !fs.lstatSync(options.dest).isDirectory()) {
      console.log('Selected target directory does not exist')
      return 
    }
  }

  // copied from extract, these need to be moved to a utils module
  if(!options.fileTypes) {
    options.fileTypes = ['.jpg', '.jpeg']
  }
  else {
    options.fileTypes = options.fileTypes.split(/[\s,;|]+/)
    options.fileTypes = options.fileTypes.filter(x => x && x.trim()).map(x => x.toLowerCase())
  }

  options.fileTypes = options.fileTypes.map(type => {
    if (type[0] != '.'){
      return '.' + type
    }
    else {
      return type
    }
  })

  //set the default separator for existing duplicates
  if (!options.sep) {
    options.sep = '_'
  }


  //get everything in the directory
  const sourceContents = await fs.readdir(options.source)

  //filter for those we want
  const sourceFiles = sourceContents.filter(item => options.fileTypes.includes(path.extname(item).toLocaleLowerCase()))
  if (sourceFiles.length == 0) {
    console.log('No files found in', options.source, 'with type/s', options.fileTypes.join(','))
    return
  }

  const destContents = await fs.readdir(options.dest)
  const destFiles = destContents.filter(item => options.fileTypes.includes(path.extname(item).toLocaleLowerCase()))
  if (destFiles.length == 0) {
    console.log('No files found in', options.dest, 'with type/s', options.fileTypes.join(','))
    return
  }

  // else we can do a comparison
  const duplicates = sourceFiles.filter(file => destFiles.includes(file))
  if (duplicates.length == 0) {
    console.log('There are no duplicate file names')
    console.log('have a nice day!')
    return
  }

  console.log(`There are ${duplicates.length} duplicate file names.`)
  co(function* () {
    let proceed = yield prompt.confirm('Are you sure you want to proceed with renaming these files? Y/N:')
    return proceed
  }).then(proceed => {
    if (proceed) {
      
      console.log('renaming files...')
      // turn arrays into something easily searchable
      const sourceFileIndex = {}
      for (const file of sourceFiles) {
        sourceFileIndex[file] = 0
      }
    
      const destFileIndex = {}
      for (const file of destFiles) {
        destFileIndex[file] = 0
      }
    
      // get new names
      for (const duplicate of duplicates) {
        let newName = duplicate
        let newNum = 1
        while ((newName in sourceFileIndex) || (newName in destFileIndex)){
          const newNameParts = newName.split('.')
          const ext = '.' + newNameParts.pop()
          const nameSansExt = newNameParts.join()
          let nameSansExtParts = nameSansExt.split(options.sep)
          if (nameSansExtParts.length > 1) { //there was a separator
            nameSansExtParts.reverse()
            for (const [index, item] of nameSansExtParts.entries()){
              if (!isNaN(item)){
                newNum = Number(item) + 1
                nameSansExtParts[index] = newNum.toString().padStart(item.length, '0')
                nameSansExtParts.reverse()
                newName = nameSansExtParts.join(options.sep) + ext
                break
              }
            }
          }
          else { //there was no separator
            newName = nameSansExt + options.sep + newNum + ext
          }
        }
    
        // now newname should be new

        //for testing
        //console.log(duplicate, newName)
        
        fs.renameSync(path.join(options.source, duplicate), path.join(options.source, newName))
        destFileIndex[newName] = 0
      }

      console.log('all done!')
      process.exit()
    }
    else {
      console.log('Have a great day...')
      process.exit(0)
    }
  })




}