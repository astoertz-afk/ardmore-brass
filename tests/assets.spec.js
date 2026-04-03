const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

test.describe('Asset Integrity', () => {
  const requiredFonts = [
    'fonts/archivo-black-latin.woff2',
    'fonts/archivo-black-latin-ext.woff2',
    'fonts/montserrat-latin.woff2',
    'fonts/montserrat-latin-ext.woff2',
    'fonts/montserrat-cyrillic.woff2',
    'fonts/montserrat-cyrillic-ext.woff2',
    'fonts/montserrat-vietnamese.woff2',
  ];

  const requiredImages = [
    'images/logo/logo-nav.png',
    'images/logo/logo-nav-2x.png',
    'images/logo/logo-nav-3x.png',
    'images/banner/homepage-banner-full.jpg',
    'images/headshots/luke-headshot.jpg',
    'images/headshots/member-headshot.jpg',
    'images/headshots/musician-1.jpg',
    'images/headshots/musician-2.jpg',
    'images/headshots/musician-3.jpg',
    'images/headshots/musician-4.jpg',
    'images/headshots/placeholder.png',
  ];

  const requiredIcons = [
    'images/icons/logo-57.png',
    'images/icons/logo-60.png',
    'images/icons/logo-72.png',
    'images/icons/logo-114.png',
    'images/icons/logo-120.png',
    'images/icons/logo-144.png',
    'images/icons/logo-152.png',
    'images/icons/logo-180.png',
  ];

  const requiredJS = [
    'js/page-home.js',
    'js/page-about.js',
    'js/page-contact.js',
    'js/page-music.js',
    'js/page-musicians.js',
    'js/widgets-home.js',
    'js/widgets-about.js',
    'js/widgets-contact.js',
    'js/widgets-music.js',
    'js/widgets-musicians.js',
    'js/ux-widgets.js',
    'js/analytics.js',
  ];

  for (const font of requiredFonts) {
    test(`font exists: ${font}`, () => {
      expect(fs.existsSync(path.join(ROOT, font))).toBe(true);
      const stat = fs.statSync(path.join(ROOT, font));
      expect(stat.size).toBeGreaterThan(1000);
    });
  }

  for (const img of [...requiredImages, ...requiredIcons]) {
    test(`image exists: ${img}`, () => {
      expect(fs.existsSync(path.join(ROOT, img))).toBe(true);
      const stat = fs.statSync(path.join(ROOT, img));
      expect(stat.size).toBeGreaterThan(100);
    });
  }

  for (const js of requiredJS) {
    test(`script exists: ${js}`, () => {
      expect(fs.existsSync(path.join(ROOT, js))).toBe(true);
      const stat = fs.statSync(path.join(ROOT, js));
      expect(stat.size).toBeGreaterThan(1000);
    });
  }

  test('no remaining CDN references in HTML', () => {
    const htmlFiles = ['index.html', 'about.html', 'contact.html', 'music.html', 'musicians.html'];
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
      expect(content).not.toContain('img1.wsimg.com');
      expect(content).not.toContain('HTTrack');
    }
  });

  test('no broken local asset references', async ({ page }) => {
    const failedRequests = [];
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().includes('favicon')) {
        failedRequests.push({ url: response.url(), status: response.status() });
      }
    });

    for (const p of ['/', '/about.html', '/contact.html', '/music.html', '/musicians.html']) {
      await page.goto(p);
      await page.waitForTimeout(500);
    }

    // Ignore known expected 404s: /markup/ad (GoDaddy freemium ad), /contact (nav uses .html)
    const ignorePaths = ['/markup/ad', '/contact'];
    const localFailures = failedRequests.filter(r =>
      r.url.startsWith('http://localhost') &&
      !ignorePaths.some(p => new URL(r.url).pathname === p)
    );
    if (localFailures.length > 0) {
      console.log('Failed local requests:', localFailures);
    }
    expect(localFailures.length).toBe(0);
  });
});
