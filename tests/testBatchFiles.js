import batch from '../functions/batchFiles.js'

async function testbatch() {
  let source = String.raw`H:\Herbarium Specimen Images\Wits Moss\test`
  let dest = source
  let n = 3
  let ftypes = ['.jpg', '.jpeg']
  //exclude, byOccurrence, copy

  await batch(source, dest, n, ftypes, null, true, true)
  return
}

testbatch().then(_ => console.log('it worked')).catch(err => console.log(err.message))