import XLSX from "xlsx";
import { parseXLSX } from "./src/lib/utils.ts";

const result = parseXLSX("src/lib/__tests__/fixtures/Example-Sheet.xlsx");

// Find Beinstrecken session
const beinstrecken = result.sessions.find((s) =>
  s.entries.some((e) =>
    result.exercises
      .find((ex) => ex.id === e.exerciseId)
      ?.name.includes("Beinstrecken")
  )
);

console.log("Beinstrecken from 2025-11-18:");
if (beinstrecken) {
  const entry = beinstrecken.entries.find((e) => {
    const ex = result.exercises.find((ex) => ex.id === e.exerciseId);
    return ex?.name.includes("Beinstrecken");
  });
  console.log(JSON.stringify(entry, null, 2));
}
