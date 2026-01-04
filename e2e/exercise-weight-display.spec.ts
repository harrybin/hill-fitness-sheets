import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe("IncompleteExerciseCard Weight Display", () => {
  test("should display previous weights in incomplete exercise cards", async ({
    page,
  }) => {
    await page.goto("/");

    // Close PWA install banner if present
    const closeButton = page
      .locator("button")
      .filter({ hasText: /×|close/i })
      .first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Import the Example-Sheet.xlsx file
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    // Click the import button to trigger file input
    await page.getByRole("button", { name: /XLSX importieren/i }).click();

    // Upload the file
    await fileInput.setInputFiles(exampleSheetPath);

    // Wait for import to complete
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });

    // Wait a bit for data to settle
    await page.waitForTimeout(1000);

    // Define expected exercises with their weights from Example-Sheet.xlsx
    const expectedExercises = [
      { name: "Beinstrecken / Maschine", weight: "190kg" },
      { name: "Bankdrücken / Langhantel", weight: "15kg" },
      { name: "T - Bar Rudern / Maschine", weight: "42.5kg" },
      { name: "Seitheben / Seilzug", weight: "15kg" },
      { name: "Bicepscurls / Kabelturm", weight: "45kg" },
      { name: "Trizepsmaschine", weight: "46kg" },
      { name: "Bauchpressenbank / Maschine", weight: "10kg" },
      { name: "Rückenstrecken / Hz.", weight: "17.5kg" },
      { name: "Waden/ Beinpresse", weight: "120kg" },
      { name: "Unterarm-Curls / Kabelturm", weight: "15kg" },
    ];

    // Check that each incomplete exercise displays its previous weight
    for (const exercise of expectedExercises) {
      const exerciseCard = page
        .locator(`[class*="cursor-pointer"]`)
        .filter({
          hasText: exercise.name,
        })
        .first();

      await expect(exerciseCard).toBeVisible();

      // Check that the weight is visible in the card
      const weightDisplay = exerciseCard.getByText(exercise.weight);
      await expect(weightDisplay).toBeVisible({
        timeout: 3000,
      });

      // Verify weight is positioned on the right (by checking it has absolute positioning)
      const weightElement = await weightDisplay.elementHandle();
      if (weightElement) {
        const box = await weightElement.boundingBox();
        const cardBox = await exerciseCard.boundingBox();

        // Weight should be positioned on the right side of the card
        if (box && cardBox) {
          expect(box.x).toBeGreaterThan(cardBox.x + cardBox.width / 2);
        }
      }
    }
  });

  test("completed exercises should not show weight in absolute position", async ({
    page,
  }) => {
    await page.goto("/");

    // Close PWA install banner if present
    const closeButton = page
      .locator("button")
      .filter({ hasText: /×|close/i })
      .first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Import the Example-Sheet.xlsx file
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Select and complete an exercise
    const firstExercise = page.locator('[class*="cursor-pointer"]').first();
    await firstExercise.click();

    // Complete the exercise with default values
    await page.getByRole("button", { name: /Übung abschließen/i }).click();

    // Wait for return to exercise list
    await page.waitForTimeout(500);

    // The completed exercise should now have a checkmark icon
    const completedExercise = page.locator('[class*="cursor-pointer"]').first();
    await expect(completedExercise.locator("svg")).toBeVisible();

    // The completed card should display weight differently (inline with sets info)
    const weightInSetsInfo = completedExercise.getByText(/kg.*\|/);
    await expect(weightInSetsInfo).toBeVisible();
  });

  test("weight display should persist after page reload", async ({
    page,
    context,
  }) => {
    await page.goto("/");

    // Close PWA install banner if present
    const closeButton = page
      .locator("button")
      .filter({ hasText: /×|close/i })
      .first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Import the file
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Verify a specific weight is visible
    const firstWeight = page.getByText("190kg").first();
    await expect(firstWeight).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForTimeout(1000);

    // Weight should still be visible after reload (due to localStorage)
    const weightAfterReload = page.getByText("190kg").first();
    await expect(weightAfterReload).toBeVisible();
  });
});
