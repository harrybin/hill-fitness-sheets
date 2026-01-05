import XLSX from "xlsx";

const wb = XLSX.readFile("src/lib/__tests__/fixtures/Example-Sheet.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

// Show rows 8 and 9 to see the structure around "Einheit:"
console.log("Row 8 (Einheit header):");
data[8].slice(0, 20).forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

console.log("\n---\nRow 9 (should have WH/KG headers):");
data[9].slice(0, 20).forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));

console.log("\n---\nRow 10 (should have WH/KG headers):");
data[10]
  .slice(0, 20)
  .forEach((cell, idx) => console.log(`Col ${idx}: ${cell}`));
