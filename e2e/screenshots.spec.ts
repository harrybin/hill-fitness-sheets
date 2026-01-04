import { test, expect, devices, Page } from "@playwright/test";
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
   * Prepares the application state for screenshot generation by:
   * 1. Importing the Example-Sheet.xlsx file
   * 2. Completing the first exercise
   * 3. Navigating to the session from 29.12. via calendar
   * 4. Opening the second exercise and increasing weight by 1
   * 5. Completing the second exercise
   * 6. Returning to today's session
   *
   * This creates a realistic app state with completed exercises and history data.
   *
   * @param page - Playwright page object for browser automation
   */
  async function prepareAppState(page: Page) {
    // Import the Example-Sheet.xlsx
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    // Set up file chooser handler before clicking the button
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(exampleSheetPath);

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
      await page.waitForTimeout(1000);

      // Wait to return to exercise list
      await page.waitForTimeout(500);
    }

    // Step 2: Open calendar and go to session from 29.12.
    // Wait for the exercise list to be visible again
    await page.waitForTimeout(1000);

    // Try different selectors for the calendar button
    const calendarSelectors = [
      page.locator('button svg[class*="Calendar"]').locator(".."),
      page
        .locator("header button")
        .filter({ has: page.locator("svg") })
        .nth(0),
      page.locator('[data-testid*="calendar"]'),
      page
        .locator("button")
        .filter({ hasText: "" })
        .filter({ has: page.locator("svg") })
        .first(),
    ];

    let calendarButton = null;
    for (const selector of calendarSelectors) {
      if (await selector.isVisible({ timeout: 1000 }).catch(() => false)) {
        calendarButton = selector;
        break;
      }
    }

    if (!calendarButton) {
      // Just click the first button in the header that has an SVG
      calendarButton = page.locator("header button svg").locator("..").first();
    }

    if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await calendarButton.click();
      await page.waitForTimeout(1500);

      // Wait for the dialog/overlay to be visible
      const dialogHeading = page.getByText(/bisherige trainingseinheiten/i);

      if (await dialogHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Look for "Montag, 29.12.2025" specifically in the dialog
        const session2912 = page
          .getByText(/montag.*29\.12\.2025/i)
          .or(
            page
              .getByText(/29\.12\.2025/)
              .filter({ has: page.getByText(/montag/i) })
          )
          .or(page.locator("button").filter({ hasText: /29\.12\.2025/ }))
          .first();

        if (await session2912.isVisible({ timeout: 3000 }).catch(() => false)) {
          await session2912.click();
          await page.waitForTimeout(1500);

          // Wait for the dialog to close
          await expect(dialogHeading).not.toBeVisible({ timeout: 3000 });
          await page.waitForTimeout(500);
        } else {
          // Close dialog and continue
          const closeButton = page
            .locator('[role="dialog"] button')
            .filter({ hasText: /×|close/i })
            .first();
          if (
            await closeButton.isVisible({ timeout: 1000 }).catch(() => false)
          ) {
            await closeButton.click();
          }
        }
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
      await page.waitForTimeout(1000);

      // Wait for dialog to open again
      const dialogHeading = page.getByText(/bisherige trainingseinheiten/i);
      await expect(dialogHeading).toBeVisible({ timeout: 3000 });

      // Look for today's session (Sonntag, 04.01.2026)
      const todaySession = page
        .getByText(/sonntag.*04\.01\.2026/i)
        .or(
          page
            .getByText(/04\.01\.2026/)
            .filter({ has: page.getByText(/sonntag/i) })
        )
        .or(page.locator("button").filter({ hasText: /04\.01\.2026/ }))
        .first();

      if (await todaySession.isVisible({ timeout: 2000 }).catch(() => false)) {
        await todaySession.click();
        await page.waitForTimeout(1000);
      } else {
        // If today's session not found, just close the dialog
        const closeButton = page
          .locator('[role="dialog"] button')
          .filter({ hasText: /×/i })
          .first();
        if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);
        } else {
          // Press Escape to close dialog
          await page.keyboard.press("Escape");
          await page.waitForTimeout(500);
        }
      }

      // Make sure dialog is closed
      await expect(dialogHeading).not.toBeVisible({ timeout: 3000 });
      await page.waitForTimeout(500);
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
    const exampleSheetPath = path.resolve(__dirname, "../Example-Sheet.xlsx");

    // Set up file chooser handler
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /XLSX importieren/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(exampleSheetPath);

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
