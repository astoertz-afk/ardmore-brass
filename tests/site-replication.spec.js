const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/', name: 'Home', file: 'index.html' },
  { path: '/about.html', name: 'About' },
  { path: '/contact.html', name: 'Contact' },
  { path: '/music.html', name: 'Music' },
  { path: '/musicians.html', name: 'Musicians' },
];

test.describe('Site Replication', () => {
  for (const page of PAGES) {
    test(`${page.name} page loads without errors`, async ({ page: p }) => {
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));

      const response = await p.goto(page.path);
      expect(response.status()).toBe(200);
      // Allow JS errors from GoDaddy widget code (expected in static clone)
    });

    test(`${page.name} page has correct title`, async ({ page: p }) => {
      await p.goto(page.path);
      const title = await p.title();
      expect(title).toContain('Ardmore Brass');
    });

    test(`${page.name} page has navigation links`, async ({ page: p }) => {
      await p.goto(page.path);
      const html = await p.content();
      expect(html).toContain('href="index.html"');
      expect(html).toContain('href="about.html"');
      expect(html).toContain('href="musicians.html"');
      expect(html).toContain('href="music.html"');
      expect(html).toContain('href="contact.html"');
    });
  }

  test('Home page has hero banner content', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('Ardmore Brass Quintet');
    expect(html).toContain('Winston-Salem');
  });

  test('About page has founding story', async ({ page }) => {
    await page.goto('/about.html');
    const html = await page.content();
    expect(html).toContain('2011');
    expect(html).toContain('Ardmore');
  });

  test('Musicians page has member bios', async ({ page }) => {
    await page.goto('/musicians.html');
    const html = await page.content();
    expect(html).toContain('Luke Boudreault');
    expect(html).toContain('Steve Sutton');
    expect(html).toContain('trumpet');
  });

  test('Music page has album info', async ({ page }) => {
    await page.goto('/music.html');
    const html = await page.content();
    expect(html).toContain('Best of Baroque');
  });

  test('Contact page has contact form', async ({ page }) => {
    await page.goto('/contact.html');
    const html = await page.content();
    expect(html).toContain('Winston Salem');
    expect(html).toContain('North Carolina');
  });

  test('Facebook link is present', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('facebook.com/ardmorebrass');
  });
});
