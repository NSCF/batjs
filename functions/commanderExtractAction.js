const co = require('co')
const prompt = require('co-prompt')
const fs = require('fs-extra')
const path = require('path')

const extract = require('./extractFiles.js')

module.exports = function(options){

  if(!options.source || !options.source.trim()) {
    options.source = process.cwd()
  }
  else {
    options.source = options.source.trim()
    if(!fs.existsSync(options.source)) {
      console.log('Please add a source directory which exists')
      return 
    }
  }

  if(!options.dest || !options.dest.trim()) {
    options.dest = options.source
  }
  else {
    options.dest = options.dest.trim()
  }

  if (options.dest == options.source) { //we can't extract to the same dir
    options.dest = path.join(options.dest, 'extract')
  }

  if(!options.fileTypes) {
    options.fileTypes = ['.jpg', '.jpeg']
  }
  else {
    options.fileTypes = options.fileTypes.split(/[\s,;|]+/)
    options.fileTypes = options.fileTypes.filter(x => x && x.trim())
  }

  options.fileTypes.map(type => {
    if (type[0] != '.'){
      return `.${type}`
    }
    else {
      return type
    }
  })

  let promptMsg = '\nAre you sure you want to '
  if(options.move){
    promptMsg += 'move (and not copy) '
  }
  else {
    promptMsg += 'copy '
  }

  promptMsg += `files from ${options.source} `
  
  if(options.includeSubdirs) {
    promptMsg += 'and its subdirectories '
  }

  if(options.endDir){
    promptMsg += `in directories called \'${options.endDir}\'' `
  }

  if(options.anyDir){
    promptMsg += `and with any directory in their file path called \'${options.anyDir}\'' `
  }

  if (options.fileNames){
    promptMsg += `and listed in '${path.basename(options.fileNames)}' `
  }
  
  promptMsg += `to  ${options.dest} `

  promptMsg += '\n\nY/N: '

  co(function* () {
    let proceed = yield prompt.confirm(promptMsg)
    return proceed
  }).then(async proceed => {
    if (proceed) {
      try {
        await extract(options.source, options.dest, options.move, options.includeSubdirs, options.fileTypes, options.endDir, options.anyDir, options.fileNames)
      }
      catch(err) {
        console.log('error extracting files: ', err.message)
      }

      process.exit(0)

    }
    else {
      console.log('Have a great day...')
      process.exit(0)
    }
  })
}