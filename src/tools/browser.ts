/**
 * Browser Automation Tools (Playwright)
 * Navigate websites, take screenshots, extract content
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

export interface BrowserResult {
  success: boolean;
  content?: string;
  screenshot?: string;
  url?: string;
  title?: string;
  error?: string;
}

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  if (!context) {
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    });
  }

  if (!page) {
    page = await context.newPage();
  }

  return { browser, context, page };
}

/**
 * Navigate to a URL
 */
export async function browserNavigate(url: string): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    const title = await page.title();
    const currentUrl = page.url();

    return {
      success: true,
      url: currentUrl,
      title,
      content: await page.content(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Navigation failed: ${error.message}`,
    };
  }
}

/**
 * Take a screenshot
 */
export async function browserScreenshot(savePath?: string): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png',
    });

    let savedPath: string | undefined;
    if (savePath) {
      const { writeFile } = await import('fs/promises');
      await writeFile(savePath, screenshot);
      savedPath = savePath;
    }

    return {
      success: true,
      screenshot: screenshot.toString('base64'),
      url: savedPath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Screenshot failed: ${error.message}`,
    };
  }
}

/**
 * Click an element
 */
export async function browserClick(selector: string): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    await page.click(selector, { timeout: 5000 });

    return {
      success: true,
      content: `Clicked: ${selector}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Click failed: ${error.message}`,
    };
  }
}

/**
 * Type text into an input
 */
export async function browserType(selector: string, text: string, pressEnter?: boolean): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    await page.fill(selector, text, { timeout: 5000 });
    
    if (pressEnter) {
      await page.press(selector, 'Enter');
    }

    return {
      success: true,
      content: `Typed "${text}" into ${selector}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Type failed: ${error.message}`,
    };
  }
}

/**
 * Extract text from page
 */
export async function browserExtract(selector?: string): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    let text: string;
    if (selector) {
      text = await page.$eval(selector, el => el.textContent || '').catch(() => '');
    } else {
      text = await page.evaluate(() => document.body.innerText);
    }

    return {
      success: true,
      content: text.substring(0, 5000), // Limit to 5000 chars
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Extract failed: ${error.message}`,
    };
  }
}

/**
 * Get all links from page
 */
export async function browserGetLinks(): Promise<BrowserResult> {
  try {
    const { page } = await getBrowser();
    
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({
          text: a.textContent?.trim() || '',
          href: (a as HTMLAnchorElement).href,
        }))
        .filter(link => link.href.startsWith('http'));
    });

    return {
      success: true,
      content: JSON.stringify(links, null, 2),
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Get links failed: ${error.message}`,
    };
  }
}

/**
 * Search Google (helper function)
 */
export async function browserSearchGoogle(query: string): Promise<BrowserResult> {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return browserNavigate(searchUrl);
}

/**
 * Close browser
 */
export async function browserClose(): Promise<void> {
  if (page) {
    await page.close();
    page = null;
  }
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Browser tools export
 */
export const browserTools = {
  navigate: browserNavigate,
  screenshot: browserScreenshot,
  click: browserClick,
  type: browserType,
  extract: browserExtract,
  getLinks: browserGetLinks,
  searchGoogle: browserSearchGoogle,
  close: browserClose,
};
