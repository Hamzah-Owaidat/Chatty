import { randomBytes } from "node:crypto";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { test, expect, signInViaUi } from "./support/fixtures";
import type { TestUser } from "./support/users";

async function openSignedInPage(browser: Browser, user: TestUser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  await signInViaUi(page, user);
  return { context, page };
}

async function startNewChatWith(page: Page, target: TestUser): Promise<void> {
  await page.getByRole("button", { name: "New chat options" }).click();
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await page.getByPlaceholder("Search by name or email").fill(target.userName);
  await page.getByRole("button", { name: new RegExp(target.displayName) }).click();
}

test.describe("chat requests", () => {
  test("a request is sent, accepted, and the conversation exchanges messages", async ({ browser, alice, bob }) => {
    const alicePage = await (await openSignedInPage(browser, alice)).page;
    const bobSession = await openSignedInPage(browser, bob);
    const bobPage = bobSession.page;

    await startNewChatWith(alicePage, bob);
    await expect(alicePage.getByText(`Chat request sent to ${bob.displayName}`)).toBeVisible();

    await bobPage.getByRole("button", { name: "Chat requests" }).click();
    const acceptResponse = bobPage.waitForResponse(
      (res) => res.request().method() === "POST" && /\/chat-requests\/[^/]+\/accept$/.test(res.url()),
    );
    await bobPage.getByRole("button", { name: `Accept chat request from ${alice.displayName}` }).click();
    expect((await acceptResponse).ok()).toBe(true);
    await expect(bobPage.getByRole("button", { name: new RegExp(alice.displayName) }).first()).toBeVisible();

    const message = `hello from alice ${randomBytes(3).toString("hex")}`;
    await alicePage.reload();
    await alicePage.getByText(bob.displayName, { exact: true }).click();
    await alicePage.getByPlaceholder("Type a message...").fill(message);
    await alicePage.getByRole("button", { name: "Send message" }).click();
    await expect(alicePage.getByText(message)).toBeVisible();

    await bobPage.reload();
    await bobPage.getByText(alice.displayName, { exact: true }).click();
    await expect(bobPage.getByText(message)).toBeVisible();

    await bobSession.context.close();
  });

  test("searching for an unknown user shows an empty state", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await page.getByRole("button", { name: "New chat options" }).click();
    await page.getByRole("button", { name: "New chat", exact: true }).click();
    await page.getByPlaceholder("Search by name or email").fill("zz_no_such_user_zz");

    await expect(page.getByText("No users found.")).toBeVisible();
  });
});

test.describe("group chats", () => {
  test("creating a group requires a name and at least one invitee", async ({ page, alice }) => {
    await signInViaUi(page, alice);
    await page.getByRole("button", { name: "New chat options" }).click();
    await page.getByRole("button", { name: "New group", exact: true }).click();
    await page.getByRole("button", { name: "Create group" }).click();

    await expect(page.getByText("Group name is required")).toBeVisible();

    await page.getByPlaceholder("Group name").fill("E2E Empty Group");
    await page.getByRole("button", { name: "Create group" }).click();
    await expect(page.getByText("Pick at least 1 person to invite")).toBeVisible();
  });

  test("creates a group with an invitee and shows it in the sidebar", async ({ page, alice, bob }) => {
    await signInViaUi(page, alice);
    const groupName = `E2E Team ${randomBytes(2).toString("hex")}`;

    await page.getByRole("button", { name: "New chat options" }).click();
    await page.getByRole("button", { name: "New group", exact: true }).click();
    await page.getByPlaceholder("Group name").fill(groupName);
    await page.getByPlaceholder("Search people to invite").fill(bob.userName);
    await page.getByRole("button", { name: new RegExp(bob.displayName) }).click();
    await expect(page.getByRole("button", { name: `Remove ${bob.displayName}` })).toBeVisible();

    await page.getByRole("button", { name: "Create group" }).click();
    await expect(page.getByText("Group created — invites sent to the people you picked")).toBeVisible();
    await expect(page.getByText(groupName, { exact: true })).toBeVisible();
  });
});

test.describe("invite links", () => {
  test("a signed-in invitee joins through the link and the inviter appears in their sidebar", async ({
    browser,
    alice,
    bob,
  }) => {
    const alicePage = (await openSignedInPage(browser, alice)).page;

    await alicePage.getByRole("button", { name: "New chat options" }).click();
    await alicePage.getByRole("button", { name: "Invite via link", exact: true }).click();
    const linkInput = alicePage.locator("input[readonly]");
    await expect(linkInput).toHaveValue(/\/invite\//);
    const inviteUrl = await linkInput.inputValue();

    const bobSession = await openSignedInPage(browser, bob);
    await bobSession.page.goto(inviteUrl);
    await expect(
      bobSession.page.getByRole("button", { name: new RegExp(alice.displayName) }).first(),
    ).toBeVisible({ timeout: 20_000 });
    await bobSession.context.close();
  });

  test("an anonymous visitor sees who invited them and the sign-in options", async ({ page, browser, alice }) => {
    const aliceSession = await openSignedInPage(browser, alice);
    await aliceSession.page.getByRole("button", { name: "New chat options" }).click();
    await aliceSession.page.getByRole("button", { name: "Invite via link", exact: true }).click();
    const inviteUrl = await aliceSession.page.locator("input[readonly]").inputValue();
    await aliceSession.context.close();

    await page.goto(inviteUrl);
    await expect(page.getByText(`${alice.displayName} invited you to chat`)).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", /redirect=/);
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", /redirect=/);
  });

  test("an invalid invite link shows a clear error", async ({ page }) => {
    await page.goto("/invite/not-a-real-token-e2e");
    await expect(page.getByText("This invite link isn't valid")).toBeVisible();
  });
});
