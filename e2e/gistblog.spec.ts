import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("landing page supports gist and author entry", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Your GitHub Gists"
    );

    const input = page.getByLabel("GitHub Gist URL");
    await input.fill("not a gist");
    await page.getByRole("button", { name: "Open post" }).click();
    await expect(page.locator("#publisher-error")).toContainText(
        "valid gist.github.com"
    );

    await page.getByRole("tab", { name: "Author blog" }).click();
    await expect(page.getByLabel("GitHub username")).toBeVisible();
});

test("theme persists and the page has no serious accessibility violations", async ({
    page,
}) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
    expect(
        results.violations.filter((violation) =>
            ["serious", "critical"].includes(violation.impact ?? "")
        )
    ).toEqual([]);
});

test("responsive layouts do not create horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});

test("real author, article, feed, and Markdown export routes work", async ({
    page,
    request,
}, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Network integration runs once.");

    await page.goto("/Aveek-Saha");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Aveek");
    await expect(page.getByRole("link", { name: "RSS" })).toBeVisible();

    await page.goto("/post/62538a714d95ae8b2aafdb5c6751f2c5");
    await expect(
        page.getByRole("heading", { level: 1, name: "Welcome to a Gist blog post" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Share article" })).toBeVisible();

    const sectionLink = page
        .getByRole("navigation", { name: "On this page" })
        .getByRole("link")
        .first();
    const sectionId = (await sectionLink.getAttribute("href"))?.slice(1);
    expect(sectionId).toBeTruthy();
    await sectionLink.click();
    const sectionOffset = async () => {
        return page.evaluate((id) => {
            const heading = document.getElementById(id);
            const header = document.querySelector<HTMLElement>(".site-header");
            if (!heading || !header) return -1;
            return Math.round(heading.getBoundingClientRect().top - header.getBoundingClientRect().bottom);
        }, sectionId as string);
    };
    await expect.poll(sectionOffset).toBeLessThanOrEqual(32);
    expect(await sectionOffset()).toBeGreaterThanOrEqual(12);

    const rss = await request.get("/Aveek-Saha/feed.xml");
    expect(rss.ok()).toBeTruthy();
    expect(rss.headers()["content-type"]).toContain("application/rss+xml");

    const raw = await request.get(
        "/post/62538a714d95ae8b2aafdb5c6751f2c5/raw"
    );
    expect(raw.ok()).toBeTruthy();
    expect(raw.headers()["content-type"]).toContain("text/markdown");
});
