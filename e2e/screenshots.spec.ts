import { test, expect, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Screenshot generation script for Hill Fitness Sheets
 * Recreates all screenshots in the screenshots/ folder for Pixel 7
 */

test.use({
  ...devices['Pixel 7'],
});

test.describe('Screenshots Generation', () => {
  const screenshotsDir = 'screenshots';
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Close PWA install banner if present
    const closeButton = page.locator('button').filter({ hasText: /×|close/i }).first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('1. uebungen-übersicht.png - Exercise list overview', async ({ page }) => {
    // Import the Example-Sheet.xlsx to populate exercises
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, '../Example-Sheet.xlsx');
    
    await page.getByRole('button', { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    
    // Wait for import to complete
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Take screenshot of the exercise list
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'uebungen-übersicht.png'),
      fullPage: true 
    });
  });

  test('2. uebung-edit.png - Exercise training entry view', async ({ page }) => {
    // Import the Example-Sheet.xlsx
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, '../Example-Sheet.xlsx');
    
    await page.getByRole('button', { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Click on the first exercise to open the training entry view
    const firstExercise = page.locator('[class*="cursor-pointer"]').first();
    await firstExercise.click();
    
    // Wait for the training entry view to load
    await page.waitForTimeout(500);
    
    // Optionally modify some values to show a realistic training session
    // For example, change weight or reps
    const weightInput = page.locator('input[type="number"]').first();
    if (await weightInput.isVisible()) {
      await weightInput.fill('195');
    }
    
    await page.waitForTimeout(300);
    
    // Take screenshot of the training entry view
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'uebung-edit.png'),
      fullPage: true 
    });
  });

  test('3. historie-uebersicht.png - History overview', async ({ page }) => {
    // Import data first
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, '../Example-Sheet.xlsx');
    
    await page.getByRole('button', { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Open settings dialog to access history
    const settingsButton = page.getByRole('button', { name: /Einstellungen/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).last()
    );
    await settingsButton.click();
    await page.waitForTimeout(500);
    
    // Look for history/sessions tab or section
    const historyTab = page.getByRole('tab', { name: /Historie|Sessions/i }).or(
      page.getByText(/Historie|Sessions/i).first()
    );
    
    if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'historie-uebersicht.png'),
      fullPage: true 
    });
  });

  test('4. historie-geladen.png - Loaded history data', async ({ page }) => {
    // Import data
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, '../Example-Sheet.xlsx');
    
    await page.getByRole('button', { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Complete at least one exercise to create history
    const firstExercise = page.locator('[class*="cursor-pointer"]').first();
    await firstExercise.click();
    await page.waitForTimeout(500);
    
    // Complete the exercise
    const completeButton = page.getByRole('button', { name: /Übung abschließen/i });
    if (await completeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await completeButton.click();
      await page.waitForTimeout(500);
    }
    
    // Open settings to view history
    const settingsButton = page.getByRole('button', { name: /Einstellungen/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).last()
    );
    await settingsButton.click();
    await page.waitForTimeout(500);
    
    // Navigate to history section if available
    const historyTab = page.getByRole('tab', { name: /Historie|Sessions/i }).or(
      page.getByText(/Historie|Sessions/i).first()
    );
    
    if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot showing loaded history
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'historie-geladen.png'),
      fullPage: true 
    });
  });

  test('5. einstellungen-ueber.png - Settings/About dialog', async ({ page }) => {
    // Import data to have a populated state
    const fileInput = page.locator('input[type="file"]');
    const exampleSheetPath = path.resolve(__dirname, '../Example-Sheet.xlsx');
    
    await page.getByRole('button', { name: /XLSX importieren/i }).click();
    await fileInput.setInputFiles(exampleSheetPath);
    await expect(page.getByText(/Importiert/i)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Open settings dialog
    const settingsButton = page.getByRole('button', { name: /Einstellungen/i }).or(
      page.locator('button').filter({ has: page.locator('svg') }).last()
    );
    await settingsButton.click();
    await page.waitForTimeout(500);
    
    // Navigate to About/Info tab if exists
    const aboutTab = page.getByRole('tab', { name: /Über|About|Info/i }).or(
      page.getByText(/Über|About|Info/i).first()
    );
    
    if (await aboutTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await aboutTab.click();
      await page.waitForTimeout(500);
    }
    
    // Take screenshot of settings/about view
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'einstellungen-ueber.png'),
      fullPage: true 
    });
  });
});
