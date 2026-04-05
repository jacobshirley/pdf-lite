import fs from 'fs';

const bytes = fs.readFileSync('test/unit/fixtures/multi-child-field.pdf');

const { PdfDocument } = await import('./dist/index.js');
const doc = await PdfDocument.fromBytes([new Uint8Array(bytes)]);

for (const obj of doc.objects) {
  if (obj.content?.removeAllFilters) obj.content.removeAllFilters();
}

const page = doc.pages.toArray()[0];
const streams = page.contentStreams;
const data = streams.map(s => s.dataAsString).join('\n---STREAM---\n');

const lines = data.split('\n');
let inBT = false;
let block = [];
let blockNum = 0;

for (const line of lines) {
  if (line.trim() === 'BT') {
    inBT = true;
    block = [line];
    continue;
  }
  if (line.trim() === 'ET') {
    block.push(line);
    blockNum++;
    if (blockNum >= 2 && blockNum <= 5) {
      console.log(`=== Block ${blockNum} ===`);
      console.log(block.join('\n'));
      console.log();
    }
    inBT = false;
    block = [];
    continue;
  }
  if (inBT) block.push(line);
}

console.log('Total BT/ET blocks:', blockNum);

// Also print font map
const fontMap = page.fontMap;
console.log('\nFont map:');
for (const [name, font] of fontMap) {
  console.log(`  ${name} -> ${font.resourceName} (${font.subtype})`);
}
