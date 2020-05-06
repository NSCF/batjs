#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const { program } = require('commander')

const batch = require('./functions/commanderBatchAction')
const extract = require('./functions/commanderExtractAction')


program
  .name("batjs")
  .usage("command [options]")
  .description('A utility for extracting and/or batching files like images for museum and herbarium specimens')

program.on('--help', () => {
  console.log('')
  console.log('***Remember to double quote any input strings for commands***')
})

program
  .command('batch')
  .description('batch the images into set of folders with a specific number of images or occurrences each')
  .option('-s|--source <source>', 'the source/root directory to get files from')
  .option('-d|--dest <dest>', 'the destrination directory to copy/move files to')
  .option('-n|--number <number>', 'the number of images or specimen occurrences to include in a batch -- see --by-occurrence')
  .option('-t|--type <fileTypes>', 'file type extensions to include in the batch - default is .jpg, .jpeg')
  .option('-ex|--exclude <exclude>', 'the file with barcodes to exclude')
  .option('-bo|--by-occurrence', 'flag to batch by occurrences, grouping on base barcode/catalog numbers')
  .option('-c|--copy', 'copy the existing files instead of just moving them')
  .action(options => {
    batch(options)
  })

  program
    .command('extract')
    .description('extract images from subfolders, optionally filtering by file type or folder names, into one folder')
    .option('-s|--source <source>', 'the source/root directory to get files from')
    .option('-d|--dest <target>', 'the target directory to copy/move files to')
    .option('-i|--include-subdirs', 'include all subdirectories and their subdirectories in finding files to extract')
    .option('-e|--end-dir', 'filter files only with immediate parent directories with this name')
    .option('-a|--any-dir', 'filter files with this directory name anywhere in their file path')
    .option('-fn|--file-names', 'a txt file with file names to filter on - only returns files listed in this file, excluding extensions')
    .option('-t|--type <fileTypes>', 'file type extensions to include in the extraction')
    .option('-m|--move', 'move the files instead of copying them')
    .action(options => {
      extract(options)
    })

  program.parse(process.argv)