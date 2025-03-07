import { expect } from '@jest/globals';
import { API_KEY_KEY, MODEL_KEY } from '../extension/constants';
import { createTestPage, waitForElement, optionsPageUrl, waitForShadowElement } from './utils';

/**
 * This function configures the Summy extension with the
 * test model and API key options. It verifies the options
 * were saved to synced storage and that the "Verify LLM Access"
 * logic works as expected.
 *
 * @param browser
 * @param extensionId
 * @returns {Promise<void>}
 */
export async function configureLLM(browser, extensionId) {
    const testModel = process.env.SUMMY_TEST_MODEL;
    if (!testModel) {
        throw new Error('Missing environment variable SUMMY_TEST_MODEL');
    }

    const testApiKey = process.env.SUMMY_TEST_API_KEY;
    if (!testApiKey) {
        throw new Error('Missing environment variable SUMMY_TEST_API_KEY');
    }

    // Open options page
    const optionsPage = await createTestPage(browser);
    await optionsPage.goto(optionsPageUrl(extensionId));

    // Wait for the model and API key inputs to be ready on the page
    await waitForElement(optionsPage, '#model', 1000);
    await waitForElement(optionsPage, '#api-key', 1000);

    // Input model and api key
    await optionsPage.evaluate(({ model, apiKey }) => {
        document.getElementById('model').value = model;
        document.getElementById('api-key').value = apiKey;

        // Trigger change events to save the values
        document.getElementById('model').dispatchEvent(new Event('change'));
        document.getElementById('api-key').dispatchEvent(new Event('change'));
    }, { model: testModel, apiKey: testApiKey });

    // Verify the options were saved to synced storage
    await optionsPage.waitForFunction(
        async ({modelKey, wantModelValue, apiKeyKey, wantApiKey}) => {
            let options = await chrome.storage.sync.get([modelKey, apiKeyKey]);
            if (chrome.runtime.lastError) {
                return false;
            }

            let modelStored = options[modelKey] === wantModelValue;
            let apiKeyStored = options[apiKeyKey] === wantApiKey;

            return modelStored && apiKeyStored;
        },
        {
            timeout: 5000
        },
        {
            modelKey: MODEL_KEY,
            wantModelValue: testModel,
            apiKeyKey: API_KEY_KEY,
            wantApiKey: testApiKey
        }
    );

    // Click verify button and wait for success response
    await optionsPage.click('#test-button');

    // Wait for and capture the verification response
    await optionsPage.waitForFunction(
        () => {
            const response = document.getElementById('test-response').textContent;
            return response && !response.includes('Testing...');
        },
        { timeout: 20000 }
    );

    const testResponse = await optionsPage.$eval('#test-response', el => el.textContent);
    expect(testResponse).toContain('Access confirmed');

    await optionsPage.close();
}

/**
 * This function opens the Summy summary view in the provided
 * page. It clicks the Summy button and waits for the summary
 * view to appear.
 *
 * @param page
 * @returns {Promise<void>}
 */
export async function openSummary(page) {
    // Wait for Summy button and click it
    await waitForShadowElement(page, '#summy-button-root', '#summy-button');
    await page.evaluate(() => {
        const root = document.querySelector('#summy-button-root');
        const button = root.shadowRoot.querySelector('#summy-button');
        button.click();
    });

    // Wait for the loading state
    await page.evaluate(() => {
        return new Promise(resolve => {
            const checkLoading = () => {
                const root = document.querySelector('#summy-button-root');
                const button = root.shadowRoot.querySelector('#summy-button');
                if (button.classList.contains('loading')) {
                    resolve(true);
                    return;
                }
                setTimeout(checkLoading, 100);
            };
            checkLoading();
        });
    });

    // Wait for the summary response
    await page.waitForFunction(() => {
        const root = document.querySelector('#summy-summary-root');
        if (!root || !root.shadowRoot) return false;

        // Check for either success or error state
        const summary = root.shadowRoot.querySelector('.content-text');
        const error = root.shadowRoot.querySelector('.error-view');

        return summary || error;
    }, { timeout: 30000 });
}

/**
 * This function verifies the main elements of the Summy
 * summary view. It checks for the title, emojis, summary
 * text, stress score, questions, settings button, and
 * close button.
 *
 * It expects the Summy summary to be present in the provided
 * page.
 *
 * @param page
 * @returns {Promise<void>}
 */
export async function verifySummary(page) {
    // Verify the summary view
    const state = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;

        // Check for main elements
        const title = shadow.querySelector('.content-title');
        const summary = shadow.querySelector('.content-text');
        const stressScore = shadow.querySelector('.stress-container');
        const questions = shadow.querySelectorAll('.question-item');
        const settingsButton = shadow.querySelector('.settings-button');
        const closeButton = shadow.querySelector('.close-button');

        return {
            hasTitle: !!title,
            hasEmojis: !!shadow.querySelector('.title-emojis'),
            hasSummary: !!summary,
            hasStressScore: !!stressScore,
            questionCount: questions.length,
            hasSettingsButton: !!settingsButton,
            hasCloseButton: !!closeButton,
            titleText: title ? title.textContent : null,
            summaryText: summary ? summary.textContent : null,
            error: shadow.querySelector('.error-view') ? shadow.querySelector('.error-view').textContent : null
        };
    });

    expect(state.hasTitle).toBe(true);
    expect(state.hasEmojis).toBe(true);
    expect(state.hasSummary).toBe(true);
    expect(state.hasStressScore).toBe(true);
    expect(state.questionCount).toBe(3);
    expect(state.hasSettingsButton).toBe(true);
    expect(state.hasCloseButton).toBe(true);
}

/**
 * This function looks at the title and text of the summary
 * and verifies that they are not empty or equal to the
 * expected values.
 *
 * It assumes the Summy summary to be present in the provided page.
 *
 * @param page
 * @returns {Promise<void>}
 */
export async function readSummary(page, expectedTitle=null, expectedText=null) {
    // Verify title is present
    const titleText = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.title-text').textContent;
    });

    if (expectedTitle) {
        expect(titleText).toBe(expectedTitle);
    } else {
        expect(titleText).toBeTruthy();
    }

    // Verify summary is present
    const summaryText = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.content-text').textContent;
    });

    if (expectedText) {
        expect(summaryText).toBe(expectedText);
    } else {
        expect(summaryText).toBeTruthy();
    }
}

/**
 * This function clicks on a question from the summary view
 * and verifies that the question is displayed as the title
 * and that the summary is not empty. It then clicks the
 * back button and verifies that the original title and
 * text are restored.
 *
 * It expects the Summy summary to be present in the provided
 * page.
 *
 * @param page
 * @param idx
 * @returns {Promise<void>}
 */
export async function readQuestion(page, idx) {
    // Get current title
    const originalTitle = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.title-text').textContent;
    });

    // Get current text
    const originalText = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.content-text').textContent;
    });

    // Click on question
    const question = await page.evaluate(({idx}) => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const questions = shadow.querySelectorAll('.question-item');
        questions[idx].click();
        return questions[idx].textContent;
    }, {idx: idx});

    // Wait for back button
    waitForShadowElement(page, '#summy-summary-root', '.back-button');

    // Verify title is set to question
    const titleText = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.title-text').textContent;
    });
    expect(titleText).toBe(question);

    // Verify summary is present and not what it was before
    const summaryText = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.content-text').textContent;
    });
    expect(summaryText).toBeTruthy();
    expect(summaryText).not.toBe(originalText);

    // Click back button
    await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const backButton = shadow.querySelector('.back-button');
        backButton.click();
    });

    // Wait for back button to disappear
    await page.waitForFunction(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return !shadow.querySelector('.back-button');
    });

    // Make sure title and content have been restored
    await readSummary(page, originalTitle, originalText);
}

/**
 * This function submits a user question and validates the
 * answer. It expects the Summy summary to be present in the
 * provided page.
 *
 * @param page
 * @returns {Promise<void>}
 */
export async function askQuestion(page) {
    const question = 'What is this about?';

    // Submit question
    await page.evaluate(({question}) => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const input = shadow.querySelector('.custom-question-input');
        const button = shadow.querySelector('.custom-question-button');
        input.value = question;
        button.click();
    }, {question: question});

    // Wait for answer to appear
    await page.waitForFunction(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const text = shadow.querySelector('.content-text');
        return text && text.textContent && text.textContent !== 'Getting answer...';
    }, { timeout: 10000 });

    // Validate title equals question
    const title = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.title-text').textContent;
    });
    expect(title).toBe(question);

    // Validate answer is not empty
    const customAnswer = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        return shadow.querySelector('.content-text').textContent;
    });
    expect(customAnswer).toContain('example');
}

/**
 * This function opens the Summy extension options page from the
 * content script. It verifies that the settings button was clicked
 * successfully and that the options page was opened in a new tab.
 *
 * It expects the Summy summary to be present in the provided page.
 *
 * @param page
 * @param extensionId
 * @returns {Promise<void>}
 */
export async function openOptionsFromContent(page, extensionId) {
    // Store the initial number of pages/tabs
    const initialPages = await page.browser().pages();
    const initialPageCount = initialPages.length;

    // Click the settings button in the summary view
    await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const settingsButton = shadow.querySelector('.settings-button');
        settingsButton.click();
    });

    // Wait for a new tab to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pages = await page.browser().pages();
    expect(pages.length).toBe(initialPageCount + 1);

    // Get the newly opened tab (should be the last one)
    const optionsPage = pages[pages.length - 1];

    // Verify the URL contains the options page
    const url = await optionsPage.url();
    expect(url).toBe(optionsPageUrl(extensionId));

    // Close the options tab to clean up
    await optionsPage.close();
}

/**
 * This function closes the summary view in the provided page.
 * It verifies that the summary view is hidden and that the
 * shadow root is empty.
 *
 * It expects the Summy summary to be present in the provided
 * page.
 *
 * @param page
 * @returns {Promise<void>}
 */
export async function closeSummary(page) {
    // Click the close button in the summary view
    await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const closeButton = shadow.querySelector('.close-button');
        closeButton.click();
    });

    // Wait a moment for the animation to start
    await page.evaluate(() => new Promise(
        resolve => setTimeout(resolve, 100)
    ));

    // Verify summary is hidden or has slide-down class
    await page.waitForFunction(() => {
        const root = document.querySelector('#summy-summary-root');
        const summary = root.shadowRoot.querySelector('.page-tldr');
        return !summary || summary.classList.contains('slide-down');
    }, { timeout: 5000 });

    // Wait a bit for animation to complete
    await page.evaluate(() => new Promise(
        resolve => setTimeout(resolve, 500)
    ));

    // Verify summary has been removed, i.e. the shadow root is empty
    const shadowRoot = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        return root.shadowRoot.innerHTML;
    });
    expect(shadowRoot).toBe('');
}

/**
 * This function verifies the error view in the provided page.
 * It checks for the error message to be present and the
 * setting button to be functional.
 *
 * It does NOT open the summary but expects it to be already
 * present in the provided page.
 *
 * @param page
 * @param extensionId
 * @returns {Promise<void>}
 */
export async function verifyErrorView(page, extensionId) {
    waitForShadowElement(page, '#summy-summary-root', '.error-view');

    // Verify error view
    const state = await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;

        // Check for main elements
        const errorView = shadow.querySelector('.error-view');
        const errorMessage = errorView ? errorView.querySelector('.error-message') : null;
        const settingsLink = errorView ? errorView.querySelector('.settings-link') : null;

        return {
            hasError: !!errorMessage,
            hasSettingsLink: !!settingsLink,
            errorText: errorMessage ? errorMessage.textContent : null
        };
    });

    expect(state.hasError).toBe(true);
    expect(state.hasSettingsLink).toBe(true);
    expect(state.errorText).toBeTruthy();

    // Store the initial number of pages/tabs
    const initialPages = await page.browser().pages();
    const initialPageCount = initialPages.length;

    // Click the settings button in the summary view
    await page.evaluate(() => {
        const root = document.querySelector('#summy-summary-root');
        const shadow = root.shadowRoot;
        const settingsLink = shadow.querySelector('.settings-link');
        settingsLink.click();
    });

    // Wait for a new tab to open
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pages = await page.browser().pages();
    expect(pages.length).toBe(initialPageCount + 1);

    // Get the newly opened tab (should be the last one)
    const optionsPage = pages[pages.length - 1];

    // Verify the URL contains the options page
    const url = await optionsPage.url();
    expect(url).toBe(optionsPageUrl(extensionId));

    // Close the options tab to clean up
    await optionsPage.close();
}

/**
 * This function resets the extension configuration by removing
 * the model and API key options from storage.
 *
 * @param browser
 * @param extensionId
 */
export async function resetOptions(browser, extensionId) {
    // Open options page
    const optionsPage = await createTestPage(browser);
    await optionsPage.goto(optionsPageUrl(extensionId));

    // remove options from storage
    await optionsPage.evaluate(async () => {
        await chrome.storage.sync.clear();
    });

    // Close the options tab to clean up
    await optionsPage.close();
}