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
    const exampleSheetPath = path.resolve(__dirname, "../src/lib/__tests__/fixtures/Example-Sheet.xlsx");

    // Set up file chooser handler before clicking the button
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("import-xlsx-button").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(exampleSheetPath);

    // Wait for import toast and continue (no strict disappearance requirement)
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Defensive: close any open overlays/dialogs before proceeding
    const overlay = page.locator('[data-slot="dialog-overlay"]');
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Try to close with Escape
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    // Step 1: Complete first exercise
    // Always close overlays before clicking exercise card
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    const firstExercise = page.locator('[class*="cursor-pointer"]').first();
    if (await firstExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstExercise.click();
      await page.waitForTimeout(500);
    }

    const completeButton = page.getByTestId("complete-exercise-button");
    if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(1000);
      await page.waitForTimeout(500);
    }

    // Defensive: close any open overlays/dialogs before next step
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Step 2: Open calendar and go to session from 29.12.
    await page.waitForTimeout(1000);
    const calendarButton = page.getByTestId("calendar-dialog-button");
    let dialogHeading;
    if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Always close overlays before clicking calendar
      for (let i = 0; i < 5; i++) {
        const overlayLocal = page.locator('[data-slot="dialog-overlay"]');
        const dialogLocal = page.locator('[role="dialog"]');
        if (await dialogLocal.isVisible({ timeout: 300 }).catch(() => false) ||
            await overlayLocal.isVisible({ timeout: 300 }).catch(() => false)) {
          // Try close button
          const closeBtn = page.locator('[role="dialog"] button').filter({ hasText: /×|close|schließen/i }).first();
          if (await closeBtn.isVisible({ timeout: 300 }).catch(() => false)) {
            await closeBtn.click();
            await page.waitForTimeout(300);
          }
          // Try clicking overlay
          if (await overlayLocal.isVisible({ timeout: 300 }).catch(() => false)) {
            await overlayLocal.click({ force: true });
            await page.waitForTimeout(300);
          }
          // Try Escape
          await page.keyboard.press("Escape");
          await page.waitForTimeout(300);
        }
        await calendarButton.click();
        dialogHeading = page.getByText(/bisherige trainingseinheiten/i);
        if (await dialogHeading.isVisible({ timeout: 1500 }).catch(() => false)) {
          break;
        }
        await page.waitForTimeout(500);
      }
      if (await dialogHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
        const session2912 = page
          .getByText(/montag.*29\.12\.2025/i)
          .or(page.getByText(/29\.12\.2025/).filter({ has: page.getByText(/montag/i) }))
          .or(page.locator("button").filter({ hasText: /29\.12\.2025/ }))
          .first();
        if (await session2912.isVisible({ timeout: 3000 }).catch(() => false)) {
          await session2912.click();
          await page.waitForTimeout(1500);
          await expect(dialogHeading).not.toBeVisible({ timeout: 3000 });
          await page.waitForTimeout(500);
        } else {
          // Close dialog and continue
          const closeButton = page.locator('[role="dialog"] button').filter({ hasText: /×|close/i }).first();
          if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeButton.click();
          }
        }
      }
    }

    // Defensive: close any open overlays/dialogs before next step
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Step 3: Open second exercise and increase weight by 1
    // Always close overlays before clicking exercise card
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    const exercises = page.locator('[class*="cursor-pointer"]');
    const secondExercise = exercises.nth(1);
    if (await secondExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondExercise.click();
      await page.waitForTimeout(500);
      const weightInput = page.locator('input[type="number"]').first();
      if (await weightInput.isVisible()) {
        const currentWeight = await weightInput.inputValue();
        const newWeight = parseFloat(currentWeight) + 1;
        await weightInput.fill(newWeight.toString());
        await page.waitForTimeout(300);
      }
      const completeBtn = page.getByTestId("complete-exercise-button");
      if (await completeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await completeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Defensive: close any open overlays/dialogs before next step
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Step 4 removed: returning to today's session is optional for screenshots
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Close PWA install banner if present
    const closeButton = page.getByTestId("pwa-dismiss-button");
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("1. uebungen-übersicht.png - Exercise list overview", async ({
    page,
  }) => {
    await prepareAppState(page);
    // Ensure we're on exercise list: close any dialog and verify cards visible
    const overlay = page.locator('[data-slot="dialog-overlay"]');
    const anyDialog = page.locator('[role="dialog"]');
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false) ||
        await anyDialog.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    // Assert at least one exercise card is visible
    const anExerciseCard = page.locator('[class*="cursor-pointer"]').first();
    await expect(anExerciseCard).toBeVisible({ timeout: 3000 });

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

    // Always close overlays before clicking exercise card
    const overlayEdit = page.locator('[data-slot="dialog-overlay"]');
    if (await overlayEdit.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    // Click on the first incomplete exercise to open the training entry view
    const firstIncompleteExercise = page
      .locator('[class*="cursor-pointer"]')
      .first();
    if (await firstIncompleteExercise.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstIncompleteExercise.click();
      await page.waitForTimeout(500);
    }

    // Take screenshot of the training entry view (viewport only, not fullPage)
    await page.screenshot({
      path: path.join(screenshotsDir, "uebung-edit.png"),
      fullPage: false,
    });
  });

  test("3. historie-uebersicht.png - History overview", async ({ page }) => {
    // Import data first
    const exampleSheetPath = path.resolve(__dirname, "../src/lib/__tests__/fixtures/Example-Sheet.xlsx");

    // Set up file chooser handler
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByTestId("import-xlsx-button").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(exampleSheetPath);

    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Importiert/i)).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Defensive: close overlays before opening calendar
    const overlay = page.locator('[data-slot="dialog-overlay"]');
    if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // Robust open calendar dialog with retries
    const calendarButton = page.getByTestId("calendar-dialog-button");
    let dialog;
    for (let i = 0; i < 5; i++) {
      if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
      await calendarButton.click();
      dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        break;
      }
      await page.waitForTimeout(500);
    }
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Take screenshot of calendar view
    await page.screenshot({
      path: path.join(screenshotsDir, "historie-uebersicht.png"),
      fullPage: false,
    });
  });

  test("4. historie-geladen.png - Loaded history data", async ({ page }) => {
    await prepareAppState(page);

    // Open calendar and click the first session entry to load details
    const calendarButton = page.getByTestId("calendar-dialog-button");
    await calendarButton.click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    // Try clicking a non-today session: iterate tiles until 'Heute' appears
    const tiles = dialog.locator('.space-y-2 > div');
    let loadedOldSession = false;
    for (let i = 0; i < 5; i++) {
      const tile = tiles.nth(i);
      if (!(await tile.isVisible({ timeout: 1000 }).catch(() => false))) {
        break;
      }
      await tile.click();
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
      // Check if 'Heute' button is shown => we loaded an old session
      const todayBtn = page.getByTestId("today-button");
      if (await todayBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        loadedOldSession = true;
        break;
      }
      // Not an old session; reopen dialog and try next
      await calendarButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }
    // Best-effort: if still not old session, continue with current view

    // Take screenshot showing loaded history session detail
    await page.screenshot({
      path: path.join(screenshotsDir, "historie-geladen.png"),
      fullPage: false,
    });
  });

  test("5. einstellungen-ueber.png - Settings/About dialog", async ({
    page,
  }) => {
    await prepareAppState(page);

    // Always close overlays before clicking settings button
    const overlaySettings = page.locator('[data-slot="dialog-overlay"]');
    if (await overlaySettings.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    // Open settings dialog
    const settingsButton = page.getByTestId("settings-button");
    if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsButton.click();
      await page.waitForTimeout(500);
    }

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
