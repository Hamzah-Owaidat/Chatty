import AxeBuilder from "@axe-core/playwright";
import { test, expect, signInViaUi } from "../e2e/support/fixtures";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: import("@playwright/test").Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s): ${v.nodes[0]?.target.join(" ")} ${v.nodes[0]?.html.slice(0, 160)}`,
  );
  expect(summary, `axe violations on ${label}`).toEqual([]);
}

test.describe("accessibility of public pages", () => {
  test("sign in", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome back" })).toBeVisible();
    await expectNoViolations(page, "/auth/signin");
  });

  test("sign up", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
    await expectNoViolations(page, "/auth/signup");
  });

  test("reset password request", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await expect(page.getByRole("heading", { level: 1, name: "Reset your password" })).toBeVisible();
    await expectNoViolations(page, "/auth/reset-password");
  });

  test("invalid invite", async ({ page }) => {
    await page.goto("/invite/not-a-real-token-a11y");
    await expect(page.getByText("This invite link isn't valid")).toBeVisible();
    await expectNoViolations(page, "/invite/[invalid]");
  });
});

test.describe("accessibility of signed-in pages", () => {
  test("chat workspace", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await expect(page.getByPlaceholder("Search conversations...")).toBeVisible();
    await expectNoViolations(page, "/chat");
  });

  test("new chat dialog", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await page.getByRole("button", { name: "New chat options" }).click();
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    await expect(page.getByPlaceholder("Search by name or email")).toBeVisible();
    await expectNoViolations(page, "New chat dialog");
  });
});

test.describe("keyboard access", () => {
  test("the sign-in form can be completed with the keyboard alone", async ({ page, alice }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/^username/i).focus();
    await page.keyboard.type(alice.userName);
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(/^password/i)).toBeFocused();
    await page.keyboard.type(alice.password);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/chat/);
  });

  test("the password visibility toggle is a named button reachable by keyboard", async ({ page }) => {
    await page.goto("/auth/signin");
    const toggle = page.getByRole("button", { name: /show password|hide password/i });
    await expect(toggle).toBeVisible();
    await toggle.focus();
    await expect(toggle).toBeFocused();
  });
});
