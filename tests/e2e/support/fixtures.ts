import { expect, test as base, type Page } from "@playwright/test";
import { makeTestUser, registerUser, type TestUser } from "./users";

interface Fixtures {
  alice: TestUser;
  bob: TestUser;
}

/** Registers two fresh users through the API before each test that asks for them. */
export const test = base.extend<Fixtures>({
  alice: async ({ request }, use) => {
    const user = makeTestUser("a");
    await registerUser(request, user);
    await use(user);
  },
  bob: async ({ request }, use) => {
    const user = makeTestUser("b");
    await registerUser(request, user);
    await use(user);
  },
});

export { expect };

export async function signInViaUi(page: Page, user: TestUser): Promise<void> {
  await page.goto("/auth/signin");
  await page.getByLabel(/^username/i).fill(user.userName);
  await page.getByLabel(/^password/i).fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/chat/);
}

export async function signOutViaUi(page: Page, user: TestUser): Promise<void> {
  await page.getByRole("button", { name: new RegExp(user.userName) }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\/signin/);
}
