#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

const { program } = require('commander')

const batch = require('./functions/commanderBatchAction')
const extract = require('./functions/commanderExtractAction')
const diff = require('./functions/commanderDiffAction')


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
  .description('batch images into folders with a specific number of images or occurrences each')
  .option('-s|--source <source>', 'the source/root directory to get files from')
  .option('-d|--dest <dest>', 'the destrination directory to copy/move files to')
  .requiredOption('-n|--number <number>', 'the number of images or specimen occurrences to include in a batch -- see --by-occurrence')
  .option('-t|--file-types <filetypes>', 'file type extensions to include in the batch - default is .jpg, .jpeg')
  .option('-x|--exclude <exclude>', 'the file with barcodes to exclude (NB needs a single column csv/txt, not a dataset')
  .option('-o|--by-occurrence', 'flag to batch by occurrences, grouping on base barcode/catalog numbers')
  .option('-c|--copy', 'copy the existing files instead of just moving them, default is copy')
  .action(options => {
    batch(options)
})

program
  .command('extract')
  .description('extract images from subfolders, optionally filtering by file type or folder names, into one folder')
  .option('-s|--source <source>', 'the source/root directory to get files from')
  .option('-d|--dest <target>', 'the target directory to copy/move files to')
  .option('-i|--include-subdirs', 'include all subdirectories and their subdirectories in finding files to extract')
  .option('-e|--end-dir <end-dir>', 'filter files only with immediate parent directories with this name')
  .option('-a|--any-dir <any-dir>', 'filter files with this directory name anywhere in their file path')
  .option('-f|--file-names <file-names>', 'a txt file with file names to filter on - only returns files listed in this file, excluding extensions')
  .option('-t|--file-types <file-types>', 'file type extensions to include in the extraction - default is .jpg, .jpeg')
  .option('-m|--move', 'move the files instead of copying them, default is copy')
  .action(options => {
    extract(options)
})

program
  .command('diff')
  .description('count images that are not listed in a file')
  .option('-s|--source <source>', 'the source/root directory to get files from')
  .requiredOption('-x|--exclude <exclude>', 'the file with barcodes to exclude (NB needs a single column csv/txt, not a dataset')
  .option('-t|--file-types <filetypes>', 'file type extensions to include in the count - default is .jpg, .jpeg')
  .action(options => {
    diff(options)
  })
program.parse(process.argv)