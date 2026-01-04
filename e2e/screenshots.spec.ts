import { test, expect, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Screenshot generation script for Hill Fitness Sheets
 * Recreates all screenshots in the screenshots/ folder for Pixel 9 Pro
 */

test.use({
  viewport: {
    width: 428,
    height: 952,
  },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

test.describe("Screenshots Generation", () => {
  const screenshotsDir = "screenshots";

  /**
   * Helper function to prepare the app state for screenshots:
   * 1. Import data
   * 2. Complete first exercise
   * 3. Go to last session via calendar
   * 4. Open second exercise and increase weight by 1
   * 5. Return to today
   */
  async function prepareAppState(page: any) {
    // Import the Example-Sheet.xlsx
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);

    // Wait for import to complete and toast to disappear
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Importiert/i)).not.toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(500);

    // Step 1: Complete first exercise
    const firstExercise = page.locator('[class*="cursor-pointer"]').first();
    await firstExercise.click();
    await page.waitForTimeout(500);

    const completeButton = page.getByRole("button", {
      name: /Übung abschließen/i,
    });
    if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Open calendar and go to session from 29.12.
    const calendarButton = page
      .locator("button")
      .filter({
        has: page.locator('svg[class*="CalendarBlank"]'),
      })
      .or(page.getByRole("button", { name: /kalender|calendar/i }))
      .first();

    if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calendarButton.click();
      await page.waitForTimeout(500);

      // Find and click the 29.12. session
      const session2912 = page
        .locator('[role="button"]')
        .filter({
          hasText: /2024-12-29|29\.12\.2024/,
        })
        .first();

      if (await session2912.isVisible({ timeout: 2000 }).catch(() => false)) {
        await session2912.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 3: Open second exercise and increase weight by 1
    const exercises = page.locator('[class*="cursor-pointer"]');
    const secondExercise = exercises.nth(1);

    if (await secondExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondExercise.click();
      await page.waitForTimeout(500);

      // Get current weight and increase by 1
      const weightInput = page.locator('input[type="number"]').first();
      if (await weightInput.isVisible()) {
        const currentWeight = await weightInput.inputValue();
        const newWeight = parseFloat(currentWeight) + 1;
        await weightInput.fill(newWeight.toString());
        await page.waitForTimeout(300);
      }

      // Complete the exercise
      const completeBtn = page.getByRole("button", {
        name: /Übung abschließen/i,
      });
      if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await completeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Step 4: Return to today
    if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calendarButton.click();
      await page.waitForTimeout(500);

      // Click on today's date or "Heute" button
      const todayButton = page
        .getByRole("button", { name: /heute|today/i })
        .or(
          page
            .locator("button")
            .filter({
              hasText: new RegExp(new Date().toISOString().split("T")[0]),
            })
        );

      if (await todayButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await todayButton.click();
        await page.waitForTimeout(500);
      }
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Close PWA install banner if present
    const closeButton = page
      .locator("button")
      .filter({ hasText: /×|close/i })
      .first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("1. uebungen-übersicht.png - Exercise list overview", async ({
    page,
  }) => {
    await prepareAppState(page);

    // Take screenshot of the exercise list
    await page.screenshot({
      path: path.join(screenshotsDir, "uebungen-übersicht.png"),
      fullPage: false,
    });
  });

  test("2. uebung-edit.png - Exercise training entry view", async ({
    page,
  }) => {
    await prepareAppState(page);

    // Click on the first incomplete exercise to open the training entry view
    const firstIncompleteExercise = page
      .locator('[class*="cursor-pointer"]')
      .first();
    await firstIncompleteExercise.click();
    await page.waitForTimeout(500);

    // Take screenshot of the training entry view (viewport only, not fullPage)
    await page.screenshot({
      path: path.join(screenshotsDir, "uebung-edit.png"),
      fullPage: false,
    });
  });

  test("3. historie-uebersicht.png - History overview", async ({ page }) => {
    // Import data first
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Importiert/i)).not.toBeVisible({
      timeout: 5000,
    });
    await page.waitForTimeout(500);

    // Open calendar to show history overview
    const calendarButton = page
      .locator("button")
      .filter({
        has: page.locator('svg[class*="CalendarBlank"]'),
      })
      .or(page.getByRole("button", { name: /kalender|calendar/i }))
      .first();

    if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calendarButton.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot of calendar view
    await page.screenshot({
      path: path.join(screenshotsDir, "historie-uebersicht.png"),
      fullPage: false,
    });
  });

  test("4. historie-geladen.png - Loaded history data", async ({ page }) => {
    await prepareAppState(page);

    // Take screenshot showing loaded history from 29.12. after modifications
    await page.screenshot({
      path: path.join(screenshotsDir, "historie-geladen.png"),
      fullPage: false,
    });
  });

  test("5. einstellungen-ueber.png - Settings/About dialog", async ({
    page,
  }) => {
    await prepareAppState(page);

    // Open settings dialog
    const settingsButton = page
      .getByRole("button", { name: /Einstellungen/i })
      .or(
        page
          .locator("button")
          .filter({ has: page.locator("svg") })
          .last()
      );
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Navigate to About/Info tab if exists
    const aboutTab = page
      .getByRole("tab", { name: /Über|About|Info/i })
      .or(page.getByText(/Über|About|Info/i).first());

    if (await aboutTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await aboutTab.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot of settings/about view
    await page.screenshot({
      path: path.join(screenshotsDir, "einstellungen-ueber.png"),
      fullPage: false,
    });
  });
});
