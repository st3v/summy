import {
    describe,
    test,
    expect,
    beforeAll,
    afterAll
} from '@jest/globals';

import {
    setupBrowser,
    createTestPage,
    getExtensionId,
    waitForElement,
    optionsPageUrl
 } from './utils.js';

import * as steps from './steps.js';

describe('Summy Extension', () => {
    let browser;
    let extensionId;

    beforeAll(async () => {
        browser = await setupBrowser();
        try {
            extensionId = await getExtensionId(browser);
        } catch (error) {
            console.error('Failed to get extension ID:', error);
            throw error;
        }
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('content script injects summary button', async () => {
        const page = await createTestPage(browser);

        // Navigate to a test page and wait for it to load
        await page.goto('https://example.com', { waitUntil: 'networkidle0' });

        // Wait for the button container first
        const buttonRootExists = await waitForElement(page, '#summy-button-root');
        expect(buttonRootExists).toBe(true);

        // Get the shadow root and check for the actual button
        const buttonExists = await page.evaluate(() => {
            const root = document.querySelector('#summy-button-root');
            if (!root || !root.shadowRoot) return false;
            const button = root.shadowRoot.querySelector('#summy-button');
            return !!button;
        });
        expect(buttonExists).toBe(true);

        await page.close();
    }, 10000);

    test('options page loads correctly', async () => {
        const page = await createTestPage(browser);
        await page.goto(optionsPageUrl(extensionId));

        // Check for required form elements
        const modelExists = await waitForElement(page, '#model');
        const apiKeyExists = await waitForElement(page, '#api-key');
        const showButtonExists = await waitForElement(page, '#show-button');

        expect(modelExists).toBe(true);
        expect(apiKeyExists).toBe(true);
        expect(showButtonExists).toBe(true);

        await page.close();
    }, 10000);

    test('extension shows correct version', async () => {
        const page = await createTestPage(browser);
        await page.goto(optionsPageUrl(extensionId));

        const versionExists = await waitForElement(page, '#version-number');
        expect(versionExists).toBe(true);

        const version = await page.$eval('#version-number', el => el.textContent);
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);

        await page.close();
    }, 10000);

    test('options are saved and loaded correctly', async () => {
        const page = await createTestPage(browser);
        await page.goto(optionsPageUrl(extensionId));

        // Wait for elements to be available
        await waitForElement(page, '#model');
        await waitForElement(page, '#api-key');
        await waitForElement(page, '#show-button');

        // Set new values
        await page.evaluate(() => {
            document.getElementById('model').value = 'test-model';
            document.getElementById('api-key').value = 'test-key';
            document.getElementById('show-button').checked = false;

            // Trigger change events
            document.getElementById('model').dispatchEvent(new Event('change'));
            document.getElementById('api-key').dispatchEvent(new Event('change'));
            document.getElementById('show-button').dispatchEvent(new Event('change'));
        });

        // Close the page and reopen to verify persistence
        await page.close();

        const newPage = await createTestPage(browser);
        await newPage.goto(optionsPageUrl(extensionId));

        // Wait for elements and verify values
        await waitForElement(newPage, '#model');
        await waitForElement(newPage, '#api-key');
        await waitForElement(newPage, '#show-button');

        const savedValues = await newPage.evaluate(() => ({
            model: document.getElementById('model').value,
            apiKey: document.getElementById('api-key').value,
            showButton: document.getElementById('show-button').checked
        }));

        expect(savedValues.model).toBe('test-model');
        expect(savedValues.apiKey).toBe('test-key');
        expect(savedValues.showButton).toBe(false);

        // Clean up
        await newPage.close();
    }, 10000);

    test('button visibility change is reflected immediately', async () => {
        const page = await createTestPage(browser);
        await page.goto('https://example.com', { waitUntil: 'networkidle0' });

        // Wait for initial button setup
        await page.waitForSelector('#summy-button-root');

        // Open options in another tab
        const optionsPage = await createTestPage(browser);
        await optionsPage.goto(optionsPageUrl(extensionId));
        await waitForElement(optionsPage, '#show-button');

        // Set initial state to hidden
        await optionsPage.evaluate(() => {
            return new Promise(resolve => {
                document.getElementById('show-button').checked = false;
                document.getElementById('show-button').dispatchEvent(new Event('change'));
                setTimeout(resolve, 500);
            });
        });

        // Verify button is hidden
        await page.waitForFunction(() => {
            const root = document.querySelector('#summy-button-root');
            return root.classList.contains('hidden');
        }, { timeout: 2000 });

        // Toggle button visibility to shown
        await optionsPage.evaluate(() => {
            return new Promise(resolve => {
                document.getElementById('show-button').checked = true;
                document.getElementById('show-button').dispatchEvent(new Event('change'));
                setTimeout(resolve, 500);
            });
        });

        // Wait for both storage update and message to be processed
        const buttonVisible = await page.evaluate(() => {
            return new Promise(resolve => {
                // Check both the class and storage
                const checkVisibility = () => {
                    const root = document.querySelector('#summy-button-root');
                    if (!root.classList.contains('hidden')) {
                        resolve(true);
                        return;
                    }
                    setTimeout(checkVisibility, 100);
                };
                checkVisibility();
            });
        });

        expect(buttonVisible).toBe(true);

        // Clean up
        await page.close();
        await optionsPage.close();
    }, 10000);

    test('verify happy path', async () => {
        // Configure the extension
        await steps.configureLLM(browser, extensionId);

        // Now test the summary functionality
        const page = await createTestPage(browser);
        await page.goto('https://example.com', { waitUntil: 'networkidle0' });

        // Click the summary button
        await steps.openSummary(page);
        await steps.verifySummary(page);

        // Read summary
        await steps.readSummary(page);

        // Read all 3 questions
        await steps.readQuestion(page, 0);
        await steps.readQuestion(page, 1);
        await steps.readQuestion(page, 2);

        // Submit user question
        await steps.askQuestion(page);

        // Open the settings from within the summary view
        await steps.openOptionsFromContent(page, extensionId);

        // Close the summary
        await steps.closeSummary(page);

        // Close the page
        await page.close();
    }, 30000);

    test('verify error view', async () => {
         // Make sure the extension is NOT configured
         await steps.resetOptions(browser, extensionId);

         // Open web page
        const page = await createTestPage(browser);
        await page.goto('https://example.com', { waitUntil: 'networkidle0' });

        // Click the summary button
        await steps.openSummary(page);

        // Verify error message
        await steps.verifyErrorView(page, extensionId);

        // Close page
        await page.close();

    }, 30000);
});