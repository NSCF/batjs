export default function makeDictionary(barcodeArray){
  barcodeArray = barcodeArray.map(b => b.toUpperCase())
  let occurrenceGroups = {}
  for (let [index, barcode] of barcodeArray.entries()) {
    
    if (!barcode || !barcode.trim()) { //just in case for blanks
      continue
    }

    barcode = barcode.trim()

    let base = ''
    if (barcode.includes('-')) {//-1, -2, etc
      base = barcode.slice(0, barcode.lastIndexOf('-'))
    }
    else if (barcode.includes('(')) {//-1, -2, etc
      base = barcode.slice(0, barcode.lastIndexOf('(')).trim()
    }
    else if (/[A-Z]/.test(barcode[barcode.length - 1])){ //A, B, etc
      //get the index of the last number before the letters
      let lastnumIndex = barcode.length -1
      while((isNaN(barcode[lastnumIndex])  || /[\s]/.test(barcode[lastnumIndex])) && lastnumIndex >= 0){
        --lastnumIndex
      }
      if (lastnumIndex < 0){
        continue //its text string barcode, ie no numbers
      }
      else {
        base = barcode.substring(0, lastnumIndex + 1)
      }
    }
    else {
      base = barcode
    }

    if(occurrenceGroups[base]){
      occurrenceGroups[base].push(barcode)
    }
    else {
      occurrenceGroups[base] = [barcode]
    }

  }

  return occurrenceGroups
}
