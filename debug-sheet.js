import XLSX from "xlsx";

const wb = XLSX.readFile("Example-Sheet.xlsx");
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const row11 = data[11];
console.log("Row 11 (Datum row) all values:");
row11.forEach((v, i) => {
  if (i >= 5 && i <= 22) {
    console.log(`Col ${i}: ${v ?? "empty"} (type: ${typeof v})`);
  }
});
