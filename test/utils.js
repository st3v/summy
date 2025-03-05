import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '../extension');

export async function setupBrowser() {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--no-sandbox'
        ]
    });

    // Wait for extension to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    return browser;
}

export async function createTestPage(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    return page;
}

export async function getExtensionId(browser) {
    // Wait for extension to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    const targets = await browser.targets();
    const extensionTarget = targets.find(target =>
        target.type() === 'service_worker' &&
        target.url().includes('chrome-extension://')
    );

    if (!extensionTarget) {
        throw new Error('Extension service worker not found');
    }

    const extensionUrl = extensionTarget.url();
    const extensionId = extensionUrl.split('/')[2];
    return extensionId;
}

export function optionsPageUrl(extensionId) {
    return `chrome-extension://${extensionId}/options.html`;
}

export async function waitForElement(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        return false;
    }
}

export async function waitForShadowElement(page, rootSelector, shadowSelector, timeout = 5000) {
    try {
        await page.waitForFunction(
            (root, shadow) => {
                const rootElem = document.querySelector(root);
                return rootElem && rootElem.shadowRoot && rootElem.shadowRoot.querySelector(shadow);
            },
            { timeout },
            rootSelector,
            shadowSelector
        );
        return true;
    } catch (error) {
        return false;
    }
}