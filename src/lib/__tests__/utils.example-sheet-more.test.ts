import { describe, it, expect } from "vitest";
import { parseXLSX } from "../utils";
import * as fs from "fs";
import * as path from "path";

// Regression test for Example-Sheet-more.xlsx where continuation sheets omit the
// "Übungen" header and contain undated sessions. We still expect all sessions
// across sheets to be imported.
describe("Example-Sheet-more.xlsx", () => {
  it("should import all sessions across continuation sheets", async () => {
    const filePath = path.resolve(
      __dirname,
      "fixtures",
      "Example-Sheet-more.xlsx"
    );
    const fileBuffer = fs.readFileSync(filePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parsed = await parseXLSX(arrayBuffer);

    // Debug file write removed

    console.log("Session dates:", parsed.sessions.map((s) => s.date).sort());

    // Check session count
    expect(parsed.sessions.length).toBe(9);

    // The sessions should NOT have "2046" dates which are bogus interpolations
    const hasBogusDate = parsed.sessions.some((s) => s.date.startsWith("2046"));
    expect(hasBogusDate).toBe(false);

    // The undated continuation sessions should be placed after the last dated
    // session of the previous sheet (should not default to "today").
    const lastDated = parsed.sessions
      .map((s) => s.date)
      .sort()
      .slice(-1)[0];
    expect(lastDated).not.toBe(new Date().toISOString().split("T")[0]);
    // With correct date handling, last date should be after the last Sheet 1 dated session
    // (which is 2025-11-21). Sheet 2 sessions are interpolated after that.
    expect(new Date(lastDated) > new Date("2025-11-21")).toBe(true);
  });
});
