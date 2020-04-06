const co = require('co')
const prompt = require('co-prompt')
const fs = require('fs-extra')

const batch = require('./batchFiles')

module.exports = function(options) {
    
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
      console.log('Please add a source directory which exists')
      return 
    }
  }

  if(!options.dest) {
    options.dest = options.source
  }
  else {
    options.dest = options.dest.trim()
  }
  
  if(!options.fileTypes) {
    options.fileTypes = ['.jpg', '.jpeg']
  }
  else {
    options.fileTypes = options.fileTypes.split(/[\s,;|]+/)
  }

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

  promptMsg += `files from ${options.source} to batches in ${options.dest} `

  if(!options.exclude) {
    promptMsg += 'with no exclude file'
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

      try{
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
