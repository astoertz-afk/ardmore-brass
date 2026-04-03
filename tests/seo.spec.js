const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  { path: '/', file: 'index.html', name: 'Home' },
  { path: '/about.html', file: 'about.html', name: 'About' },
  { path: '/contact.html', file: 'contact.html', name: 'Contact' },
  { path: '/music.html', file: 'music.html', name: 'Music' },
  { path: '/musicians.html', file: 'musicians.html', name: 'Musicians' },
];

test.describe('SEO', () => {
  for (const pg of PAGES) {
    test(`${pg.name} has meta description`, async ({ page }) => {
      await page.goto(pg.path);
      const desc = await page.getAttribute('meta[name="description"]', 'content');
      expect(desc).toBeTruthy();
      expect(desc.length).toBeGreaterThan(50);
      expect(desc.length).toBeLessThan(160);
    });

    test(`${pg.name} has unique title with keywords`, async ({ page }) => {
      await page.goto(pg.path);
      const title = await page.title();
      expect(title).toContain('Ardmore Brass');
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(70);
    });

    test(`${pg.name} has canonical link`, async ({ page }) => {
      await page.goto(pg.path);
      const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical).toBeTruthy();
      expect(canonical).toContain('ardmorebrass.com');
    });

    test(`${pg.name} has Open Graph tags`, async ({ page }) => {
      await page.goto(pg.path);
      const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
      const ogDesc = await page.getAttribute('meta[property="og:description"]', 'content');
      const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
      const ogType = await page.getAttribute('meta[property="og:type"]', 'content');
      expect(ogTitle).toBeTruthy();
      expect(ogDesc).toBeTruthy();
      expect(ogImage).toBeTruthy();
      expect(ogType).toBeTruthy();
    });

    test(`${pg.name} has Twitter Card tags`, async ({ page }) => {
      await page.goto(pg.path);
      const card = await page.getAttribute('meta[name="twitter:card"]', 'content');
      const title = await page.getAttribute('meta[name="twitter:title"]', 'content');
      const desc = await page.getAttribute('meta[name="twitter:description"]', 'content');
      expect(card).toBeTruthy();
      expect(title).toBeTruthy();
      expect(desc).toBeTruthy();
    });

    test(`${pg.name} has lang attribute`, async ({ page }) => {
      await page.goto(pg.path);
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBe('en-US');
    });

    test(`${pg.name} has JSON-LD structured data`, async ({ page }) => {
      await page.goto(pg.path);
      const scripts = await page.$$eval(
        'script[type="application/ld+json"]',
        els => els.map(el => JSON.parse(el.textContent))
      );
      expect(scripts.length).toBeGreaterThan(0);
      const orgSchema = scripts.find(s => s['@type'] === 'MusicGroup');
      expect(orgSchema).toBeTruthy();
      expect(orgSchema.name).toBe('Ardmore Brass Quintet');
    });
  }
});

test.describe('AEO (Answer Engine Optimization)', () => {
  test('About page has FAQ schema', async ({ page }) => {
    await page.goto('/about.html');
    const scripts = await page.$$eval(
      'script[type="application/ld+json"]',
      els => els.map(el => JSON.parse(el.textContent))
    );
    const faq = scripts.find(s => s['@type'] === 'FAQPage');
    expect(faq).toBeTruthy();
    expect(faq.mainEntity.length).toBeGreaterThan(0);
    for (const q of faq.mainEntity) {
      expect(q['@type']).toBe('Question');
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer).toBeTruthy();
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });

  test('Music page has MusicAlbum schema', async ({ page }) => {
    await page.goto('/music.html');
    const scripts = await page.$$eval(
      'script[type="application/ld+json"]',
      els => els.map(el => JSON.parse(el.textContent))
    );
    const album = scripts.find(s => s['@type'] === 'MusicAlbum');
    expect(album).toBeTruthy();
    expect(album.name).toContain('Baroque');
  });

  test('Organization schema has location info', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.$$eval(
      'script[type="application/ld+json"]',
      els => els.map(el => JSON.parse(el.textContent))
    );
    const org = scripts.find(s => s['@type'] === 'MusicGroup');
    expect(org.foundingLocation).toBeTruthy();
    expect(org.foundingLocation.name).toContain('Winston-Salem');
    expect(org.areaServed).toBeTruthy();
  });

  test('Organization schema has social links', async ({ page }) => {
    await page.goto('/');
    const scripts = await page.$$eval(
      'script[type="application/ld+json"]',
      els => els.map(el => JSON.parse(el.textContent))
    );
    const org = scripts.find(s => s['@type'] === 'MusicGroup');
    expect(org.sameAs).toBeTruthy();
    expect(org.sameAs.length).toBeGreaterThan(0);
    expect(org.sameAs[0]).toContain('facebook');
  });
});

test.describe('SEO Files', () => {
  test('sitemap.xml exists and is valid', () => {
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf-8');
    expect(sitemap).toContain('<?xml');
    expect(sitemap).toContain('urlset');
    expect(sitemap).toContain('ardmorebrass.com');
    // All pages in sitemap
    for (const pg of ['/', '/about', '/contact', '/music', '/musicians']) {
      expect(sitemap).toContain(pg);
    }
  });

  test('robots.txt exists and references sitemap', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf-8');
    expect(robots).toContain('User-agent');
    expect(robots).toContain('Sitemap');
    expect(robots).toContain('ardmorebrass.com/sitemap.xml');
  });

  test('manifest.webmanifest exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'manifest.webmanifest'))).toBe(true);
  });
});
