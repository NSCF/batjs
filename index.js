#!/usr/bin/env node

const { program } = require('commander')

program
  .command('batch')
  .option('-s|--source <source>', 'the source/root directory to get files from')
  .option('-t|--target <target>', 'the target directory to copy/move files to')
  .option('-m|--move', 'just move the existing files instead of copying them')
  .action(options => {
    if (options.move) {
      console.log('we are moving!')
    }
    else {
      console.log('we\'re not moving :-(')
    }
  })

  program.parse(process.argv)

  console.log('all done')