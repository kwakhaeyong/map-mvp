import { test, expect } from "@playwright/test";

test("landing golden screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("MAP Decision")).toBeVisible();
  await expect(page.getByText("말하면, 생각이 보입니다.").first()).toBeVisible();
  await page.screenshot({ path: `test-results/visual/landing-${test.info().project.name}.png`, fullPage: true });
});

test("conversation golden screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /직접 입력하기|말로 바로 시작하기/ }).first().click();
  await expect(page.getByText(/브라우저에 임시 저장|말하거나 입력/).first()).toBeVisible();
  await page.screenshot({ path: `test-results/visual/conversation-${test.info().project.name}.png`, fullPage: true });
});

test("result golden screen route", async ({ page }) => {
  await page.goto("/result");
  await expect(page.locator("body")).toContainText(/MAP|정리|결과/);
  await page.screenshot({ path: `test-results/visual/result-${test.info().project.name}.png`, fullPage: true });
});
