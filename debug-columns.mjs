import XLSX from "xlsx";

const wb = XLSX.readFile("src/lib/__tests__/fixtures/Example-Sheet.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Show row 11 (headers) to see the column structure
console.log("Row 11 (Datum row):");
data[11]
  .slice(0, 20)
  .forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

console.log("\n---\nRow 12 (might have Einheit headers):");
data[12]
  .slice(0, 20)
  .forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

console.log("\n---\nRow 13 (Beinstrecken Satz 1):");
data[13]
  .slice(0, 20)
  .forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

console.log("\n---\nRow 14 (Beinstrecken Satz 2):");
data[14]
  .slice(0, 20)
  .forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

// Check what the "Einheit" header structure looks like
console.log('\n---\nLooking for "Einheit" headers:');
for (let rowIdx = 0; rowIdx < 13; rowIdx++) {
  const row = data[rowIdx];
  for (let colIdx = 0; colIdx < row.length; colIdx++) {
    if (
      String(row[colIdx] || "")
        .toLowerCase()
        .includes("einheit")
    ) {
      console.log(
        `Found "Einheit" at Row ${rowIdx}, Col ${colIdx}: ${row[colIdx]}`
      );
      console.log(`  Next col (${colIdx + 1}): ${row[colIdx + 1]}`);
    }
  }
}
