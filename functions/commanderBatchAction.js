import co from 'co'
import prompt from 'co-prompt'
import fs from 'fs-extra'

import batch from './batchFiles.js'

export default function(options) {
    
  if(!options.number || isNaN(options.number)){
    console.log("Please specify the number of images/occurrences to include in a batch with the -n|--number flag")
    return
  }
  else {
    options.number = parseInt(options.number)
  }

  if(!options.source) {
    options.source = process.cwd()
  }
  else {
    options.source = options.source.trim()
    if(!fs.existsSync(options.source)) {
      console.error('Provided source directory does not exist')
      return 
    }
  }

  if(!options.dest) {
    options.dest = options.source
  }
  else {
    options.dest = options.dest.trim()
  }
  
  let showfileTypesMessage = false
  if(!options.fileTypes) {
    options.fileTypes = ['.jpg', '.jpeg']
  }
  else {
    showfileTypesMessage = true
    options.fileTypes = options.fileTypes.trim().split(/[\s,;|]+/)
  }

  //file extensions start with a .
  options.fileTypes.forEach((type, index, arr) => {
    if (type[0] != '.'){
      arr[index] = `.${type}`
    }
  })

  let promptMsg = '\nAre you sure you want to '
  if(options.copy){
    promptMsg += 'copy '
  }
  else {
    promptMsg += 'move '
  }

  if(showfileTypesMessage) {
    let fileTypesString
    if(options.fileTypes.length > 1) {
      let last = options.fileTypes.pop()
      fileTypesString = options.fileTypes.join(', ')
      fileTypesString += ' and ' + last
    }
    else {
      fileTypesString = options.fileTypes[0]
    }
    
    promptMsg += fileTypesString + ' '
  
  }

  promptMsg += `files from ${options.source} to batches in ${options.dest} `

  if(!options.exclude) {
    promptMsg += 'with no exclude file'
  }
  else {
    promptMsg += 'excluding any items listed in ' + options.exclude
  }

  promptMsg += '\n\nY/N: '

  co(function* () {
    let proceed = yield prompt.confirm(promptMsg)
    return proceed
  }).then(async proceed => {
    if (proceed) {
      let exclude = null
      if (options.exclude && fs.existsSync(options.exclude.trim())){
        let excludeString = fs.readFileSync(options.exclude.trim(), 'utf8')
        exclude = excludeString.split(/[\s,;|]+/)
      }

      try {
        await batch(options.source, options.dest, options.number, options.fileTypes, 
        exclude, options.byOccurrence, options.copy)
      }
      catch(err) {
        console.log('error batching files: ', err.message)
      }
      
      process.exit(0)
    }
    else {
      console.log('Have a great day...')
      process.exit(0)
    }
    
  }).catch(err => {
    console.log('error getting user input: ', err.message)
  })
}
