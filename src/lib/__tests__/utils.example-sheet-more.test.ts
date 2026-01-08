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

    // 8 sessions on the first sheet + 1 on the second = 9 total
    expect(parsed.sessions.length).toBe(9);

    // The undated continuation session should be placed after the last dated
    // session of the previous sheet (should not default to "today").
    const lastDated = parsed.sessions
      .map((s) => s.date)
      .sort()
      .slice(-1)[0];
    expect(lastDated).not.toBe(new Date().toISOString().split("T")[0]);
    expect(lastDated).toBe("2026-01-01");
  });
});
