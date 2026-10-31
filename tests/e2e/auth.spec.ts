import { test, expect, signInViaUi, signOutViaUi } from "./support/fixtures";
import { makeTestUser } from "./support/users";

test.describe("authentication", () => {
  test("anonymous visitors are sent from /chat to sign in", async ({ page }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("signs in with valid credentials and lands on the chat", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await expect(page.getByPlaceholder("Search conversations...")).toBeVisible();
  });

  test("keeps the session after a reload", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await page.reload();
    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByPlaceholder("Search conversations...")).toBeVisible();
  });

  test("shows the backend error for a wrong password and stays on sign in", async ({ page, alice }) => {
    await page.goto("/auth/signin");
    await page.getByLabel(/^username/i).fill(alice.userName);
    await page.getByLabel(/^password/i).fill("WrongPassword9");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Invalid Username or password")).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("shows required-field errors and does not call the login API", async ({ page }) => {
    const loginRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/auth/login")) loginRequests.push(req.url());
    });

    await page.goto("/auth/signin");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText("Username is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    expect(loginRequests).toHaveLength(0);
  });

  test("signing out ends the session and protects the chat again", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await signOutViaUi(page, alice);

    await page.goto("/chat");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("protects the profile route for anonymous visitors", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe("sign up", () => {
  test("creates an account, stores no session token, and returns to sign in", async ({ page }) => {
    const user = makeTestUser("new");
    await page.goto("/auth/signup");

    await page.getByLabel(/^username/i).fill(user.userName);
    await page.getByLabel(/^display name/i).fill(user.displayName);
    await page.getByLabel(/^email/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/auth\/signin/);
    const storedToken = await page.evaluate(() => localStorage.getItem("token"));
    expect(storedToken).toBeNull();

    await page.getByLabel(/^username/i).fill(user.userName);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/chat/);
  });

  test("rejects a weak password before calling the API", async ({ page }) => {
    const registerRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/auth/register")) registerRequests.push(req.url());
    });

    const user = makeTestUser("weak");
    await page.goto("/auth/signup");
    await page.getByLabel(/^username/i).fill(user.userName);
    await page.getByLabel(/^display name/i).fill(user.displayName);
    await page.getByLabel(/^email/i).fill(user.email);
    await page.getByLabel(/^password/i).fill("short");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/Password must be at least 8 characters/)).toBeVisible();
    expect(registerRequests).toHaveLength(0);
  });

  test("requires accepting the terms", async ({ page }) => {
    const user = makeTestUser("terms");
    await page.goto("/auth/signup");
    await page.getByLabel(/^username/i).fill(user.userName);
    await page.getByLabel(/^display name/i).fill(user.displayName);
    await page.getByLabel(/^email/i).fill(user.email);
    await page.getByLabel(/^password/i).fill(user.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("You must agree to the terms conditions and privacy policy")).toBeVisible();
  });

  test("shows the backend error when the username is already taken", async ({ page, alice }) => {
    await page.goto("/auth/signup");
    await page.getByLabel(/^username/i).fill(alice.userName);
    await page.getByLabel(/^display name/i).fill("Duplicate");
    await page.getByLabel(/^email/i).fill(`dup_${alice.email}`);
    await page.getByLabel(/^password/i).fill("Duplicate1");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("status").first()).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });
});

test.describe("password reset", () => {
  test("sends a reset link for a registered email and masks the address", async ({ page, alice }) => {
    await page.goto("/auth/reset-password");
    await page.getByLabel(/^email/i).fill(alice.email);
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByRole("heading", { name: "Reset link sent" })).toBeVisible();
    await expect(page.getByText(/^Reset link sent/)).toBeVisible();
  });

  test("rejects a malformed email", async ({ page }) => {
    await page.goto("/auth/reset-password");
    await page.getByLabel(/^email/i).fill("not-an-email");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
  });
});
