#!/usr/bin/env node

import { program } from 'commander'

import batch from './functions/commanderBatchAction.js'
import extract from './functions/commanderExtractAction.js'
import diff from './functions/commanderDiffAction.js'
import rename from './functions/commanderRenameAction.js'
import unrename from './functions/commanderUnrenameAction.js'
import copyNames from './functions/commanderCopyFileNameAction.js'
import uniquify from './functions/commanderUniquifyCSVField.js'


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
  .option('-d|--dest <dest>', 'the destination directory to copy/move files to')
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
  .option('-f|--file-names <file-names>', 'a list of files to extract or a file containing such list')
  .option('-t|--file-types <file-types>', 'file type extensions to include in the extraction - default is .jpg, .jpeg')
  .option('-m|--move', 'move the files instead of copying them, default is copy')
  .option('-w|--write', 'write out the list of files copied/moved as a CSV')
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

program
  .command('rename')
  .description('rename images in a folder using a list of barcodes')
  .option('-d|--dir <directory>', 'the directory of the files and barcode list (default is current directory)')
  .option ('-f|--field <barcodeField>', 'the the barcode field in the csv file, default is `barcode`')
  .option('-t|--file-types <filetypes>', 'file type extensions to include in the count - default is .cr2')
  .action(options => {
    rename(options)
  })

program
  .command('unrename')
  .description('undo changes made by rename (default is current directory)')
  .option('-d|--dir <directory>', 'the directory of the that were renamed')
  .action(options => {
    unrename(options)
  })

program
  .command('copynames')
  .description('copy file names of a particular file type to the clipboard')
  .option('-d|--dir <directory>', 'the directory to copy file names from')
  .option('-t|--file-types <filetypes>', 'file type extensions to include in the count - default is .cr2')
  .action(options => {
    copyNames(options)
  })

program
  .command('uniquify')
  .description('make the values in one column of a csv file unique')
  .option('-d|--dir <directory>', 'the directory for the file')
  .option('-f|--file-name <file-name>', 'the name of the csv file to update, defaults to one file if only one file in the directory')
  .option ('-c|--column <column>', 'the the column in the csv file, default is `barcode`')
  .action(options => {
    uniquify(options)
  })

program.parse(process.argv)