import { test, expect, type Page } from "@playwright/test";
import { makeTestUser, registerUser, type TestUser } from "../e2e/support/users";
import { signInViaUi } from "../e2e/support/fixtures";

const DESKTOP = { width: 1280, height: 800 };
const PHONE = { width: 390, height: 844 };

/** Applies the theme before the app reads localStorage, so the first paint is already correct. */
async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    window.localStorage.setItem("theme", value);
  }, theme);
}

/**
 * Freezes transitions and animations so a screenshot never catches a half-finished frame, and hides
 * toast notifications, which are transient and would otherwise leak into the baseline.
 */
async function settle(page: Page) {
  await page.addStyleTag({
    content:
      "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}" +
      "[data-rht-toaster]{display:none!important}",
  });
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ page }) => {
  // Remote font CSS (imported by the UI library) is blocked so every run renders with the same local fallback fonts.
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
});

test.describe("public pages", () => {
  test.describe("desktop", () => {
    test.use({ viewport: DESKTOP });

    test("sign in, light", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/signin");
      await settle(page);
      await expect(page).toHaveScreenshot("signin-desktop-light.png", { fullPage: true });
    });

    test("sign in, dark", async ({ page }) => {
      await setTheme(page, "dark");
      await page.goto("/auth/signin");
      await settle(page);
      await expect(page).toHaveScreenshot("signin-desktop-dark.png", { fullPage: true });
    });

    test("sign in, validation errors", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/signin");
      await page.getByRole("button", { name: "Sign In" }).click();
      await expect(page.getByText("Username is required")).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot("signin-desktop-errors.png", { fullPage: true });
    });

    test("sign up, light", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/signup");
      await settle(page);
      await expect(page).toHaveScreenshot("signup-desktop-light.png", { fullPage: true });
    });

    test("reset password request, light", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/reset-password");
      await settle(page);
      await expect(page).toHaveScreenshot("reset-desktop-light.png", { fullPage: true });
    });
  });

  test.describe("phone", () => {
    test.use({ viewport: PHONE });

    test("sign in, light", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/signin");
      await settle(page);
      await expect(page).toHaveScreenshot("signin-phone-light.png", { fullPage: true });
    });

    test("sign up, light", async ({ page }) => {
      await setTheme(page, "light");
      await page.goto("/auth/signup");
      await settle(page);
      await expect(page).toHaveScreenshot("signup-phone-light.png", { fullPage: true });
    });
  });
});

test.describe("signed-in workspace", () => {
  let user: TestUser;

  test.beforeEach(async ({ request }) => {
    user = makeTestUser("vis");
    await registerUser(request, user);
  });

  test.describe("desktop", () => {
    test.use({ viewport: DESKTOP });

    test("chat workspace, empty, light", async ({ page }) => {
      await setTheme(page, "light");
      await signInViaUi(page, user);
      await settle(page);
      await expect(page).toHaveScreenshot("chat-empty-desktop-light.png", {
        fullPage: true,
        mask: [page.getByText(user.userName, { exact: true })],
      });
    });

    test("chat workspace, empty, dark", async ({ page }) => {
      await setTheme(page, "dark");
      await signInViaUi(page, user);
      await settle(page);
      await expect(page).toHaveScreenshot("chat-empty-desktop-dark.png", {
        fullPage: true,
        mask: [page.getByText(user.userName, { exact: true })],
      });
    });

    test("new chat dialog, light", async ({ page }) => {
      await setTheme(page, "light");
      await signInViaUi(page, user);
      await page.getByRole("button", { name: "New chat options" }).click();
      await page.getByRole("button", { name: "New chat", exact: true }).click();
      await expect(page.getByPlaceholder("Search by name or email")).toBeVisible();
      await settle(page);
      await expect(page).toHaveScreenshot("new-chat-dialog-desktop-light.png", {
        mask: [page.getByText(user.userName, { exact: true })],
      });
    });
  });

  test.describe("phone", () => {
    test.use({ viewport: PHONE });

    test("chat workspace, empty, light", async ({ page }) => {
      await setTheme(page, "light");
      await signInViaUi(page, user);
      await settle(page);
      await expect(page).toHaveScreenshot("chat-empty-phone-light.png", {
        fullPage: true,
        mask: [page.getByText(user.userName, { exact: true })],
      });
    });
  });
});
