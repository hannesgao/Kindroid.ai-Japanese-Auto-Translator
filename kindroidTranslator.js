// ==UserScript==
// @name         Kindroid.ai Japanese Auto Translator
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Automatically translate Japanese to Chinese on kindroid.ai
// @author       Hannes Gao | hannesgao.eth
// @match        https://kindroid.ai/*
// @match        https://www.kindroid.ai/*
// @match        http://kindroid.ai/*
// @match        http://www.kindroid.ai/*
// @include      *://kindroid.ai/*
// @include      *://*.kindroid.ai/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // Output debug info immediately
    console.log('%c[Kindroid Translator] Script loaded!', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('[Kindroid Translator] Current URL:', window.location.href);
    console.log('[Kindroid Translator] Current domain:', window.location.hostname);
    console.log('[Kindroid Translator] Page state:', document.readyState);

    // DeepL API Configuration
    const DEEPL_API_KEY = 'YOUR_DEEPL_API_KEY'; // Please replace with your DeepL API key
    const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'; // Free API
    // const DEEPL_API_URL = 'https://api.deepl.com/v2/translate'; // Pro API

    // Configuration options
    const CONFIG = {
        debounceTime: 500, // Debounce time (milliseconds)
        batchSize: 5, // Batch translation size
        minTextLength: 2, // Minimum text length for translation
        excludeTags: ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT'], // Excluded tags
        excludeClasses: ['auto-translation', 'translation-loading'], // Excluded classes
        enableLogging: true, // Enable logging
        logLevel: 'verbose', // Log level: 'error', 'warn', 'info', 'verbose'
        maxRetries: 5, // Maximum retries per element
        retryDelay: 1000, // Retry delay (milliseconds)
        globalMaxFailures: 10 // Global maximum failures before stopping
    };
    
    // Global failure counter
    let globalFailureCount = 0;
    let isTranslationStopped = false;

    // Logger utility
    const Logger = {
        levels: {
            error: 0,
            warn: 1,
            info: 2,
            verbose: 3
        },
        
        shouldLog(level) {
            return CONFIG.enableLogging && this.levels[level] <= this.levels[CONFIG.logLevel];
        },
        
        error(...args) {
            if (this.shouldLog('error')) {
                console.error('[Kindroid Translator] ❌', ...args);
            }
        },
        
        warn(...args) {
            if (this.shouldLog('warn')) {
                console.warn('[Kindroid Translator] ⚠️', ...args);
            }
        },
        
        info(...args) {
            if (this.shouldLog('info')) {
                console.log('[Kindroid Translator] ℹ️', ...args);
            }
        },
        
        verbose(...args) {
            if (this.shouldLog('verbose')) {
                console.log('[Kindroid Translator] 🔍', ...args);
            }
        },
        
        group(label) {
            if (CONFIG.enableLogging) {
                console.group(`[Kindroid Translator] ${label}`);
            }
        },
        
        groupEnd() {
            if (CONFIG.enableLogging) {
                console.groupEnd();
            }
        }
    };

    // Add translation text styles
    GM_addStyle(`
        .auto-translation {
            color: #666;
            font-size: 0.9em;
            margin-top: 5px;
            padding: 5px 8px;
            background-color: #f5f5f5;
            border-left: 3px solid #4CAF50;
            border-radius: 3px;
            line-height: 1.5;
            display: block;
        }
        
        .translation-loading {
            color: #999;
            font-size: 0.85em;
            font-style: italic;
            margin-top: 3px;
        }
        
        .translation-error {
            color: #f44336;
            font-size: 0.85em;
            margin-top: 3px;
        }
        
        [data-translated="true"] {
            position: relative;
        }
    `);

    // Check if text contains Japanese
    function containsJapanese(text) {
        // Detect hiragana, katakana and kanji
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
        // Exclude pure Chinese characters
        const onlyChineseRegex = /^[\u4E00-\u9FAF\u3400-\u4DBF\s\d\p{P}]+$/u;
        
        const hasJapanese = japaneseRegex.test(text) && !onlyChineseRegex.test(text);
        
        if (hasJapanese) {
            Logger.verbose(`Japanese text detected: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        }
        
        return hasJapanese;
    }

    // Call DeepL API for translation (with retry mechanism)
    async function translateText(text, retryCount = 0) {
        // Check if translation service is stopped
        if (isTranslationStopped) {
            Logger.error('Translation service stopped (global failure limit reached)');
            throw new Error('Translation service stopped');
        }
        
        Logger.info(`Starting translation (attempt ${retryCount + 1}/${CONFIG.maxRetries + 1}): "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        const startTime = performance.now();
        
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: DEEPL_API_URL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`
                },
                data: `text=${encodeURIComponent(text)}&source_lang=JA&target_lang=ZH`,
                timeout: 10000,
                onload: async function(response) {
                    const endTime = performance.now();
                    Logger.verbose(`API response time: ${(endTime - startTime).toFixed(2)}ms`);
                    
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const translatedText = data.translations[0].text;
                            Logger.info(`Translation successful: "${translatedText.substring(0, 100)}${translatedText.length > 100 ? '...' : ''}"`);
                            
                            // Decrease failure count on success
                            if (globalFailureCount > 0) {
                                globalFailureCount = Math.max(0, globalFailureCount - 1);
                                Logger.verbose(`Global failure count decreased to: ${globalFailureCount}`);
                            }
                            
                            resolve(translatedText);
                        } catch (e) {
                            Logger.error('Failed to parse API response:', e, 'Response:', response.responseText);
                            await handleTranslationError('Failed to parse response', text, retryCount, resolve, reject);
                        }
                    } else {
                        Logger.error(`API request failed: status ${response.status}`, response.responseText);
                        await handleTranslationError(`API request failed: ${response.status}`, text, retryCount, resolve, reject);
                    }
                },
                ontimeout: async function() {
                    Logger.error('API request timeout');
                    await handleTranslationError('Request timeout', text, retryCount, resolve, reject);
                },
                onerror: async function(error) {
                    Logger.error('Network request failed:', error);
                    await handleTranslationError('Network request failed', text, retryCount, resolve, reject);
                }
            });
        });
    }
    
    // Handle translation errors and retry logic
    async function handleTranslationError(error, text, retryCount, resolve, reject) {
        globalFailureCount++;
        Logger.warn(`Global failure count: ${globalFailureCount}/${CONFIG.globalMaxFailures}`);
        
        // Check if global failure limit reached
        if (globalFailureCount >= CONFIG.globalMaxFailures) {
            isTranslationStopped = true;
            Logger.error(`❌ Global failure limit reached (${CONFIG.globalMaxFailures}), stopping all translation services`);
            console.error('%cTranslation service stopped! Please check API key and network connection.', 'color: red; font-size: 16px; font-weight: bold;');
            reject(new Error('Global failure limit reached, translation service stopped'));
            return;
        }
        
        // Check if can retry
        if (retryCount < CONFIG.maxRetries) {
            Logger.warn(`Translation failed, retrying in ${CONFIG.retryDelay}ms (attempt ${retryCount + 2})...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
            
            try {
                const result = await translateText(text, retryCount + 1);
                resolve(result);
            } catch (retryError) {
                reject(retryError);
            }
        } else {
            Logger.error(`❌ Maximum retries reached (${CONFIG.maxRetries}), giving up`);
            reject(new Error(`${error} (retried ${CONFIG.maxRetries} times)`));
        }
    }

    // Get direct text content of element (excluding child translations)
    function getDirectTextContent(element) {
        let text = '';
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            }
        }
        return text.trim();
    }

    // Process translation for single element
    async function processElement(element) {
        // Check if translation service is stopped
        if (isTranslationStopped) {
            Logger.warn('Translation service stopped, skipping element processing');
            return;
        }
        
        // Check if already translated or translating
        if (element.dataset.translated === 'true' || element.dataset.translating === 'true') {
            Logger.verbose('Element already translated or translating, skipping:', element);
            return;
        }

        // Check for excluded classes
        if (CONFIG.excludeClasses.some(cls => element.classList.contains(cls))) {
            Logger.verbose('Element contains excluded class, skipping:', element.className);
            return;
        }

        // Get direct text content
        const text = getDirectTextContent(element);
        
        // Check text length and Japanese content
        if (text.length < CONFIG.minTextLength) {
            Logger.verbose(`Text too short (${text.length} < ${CONFIG.minTextLength}), skipping:`, text);
            return;
        }
        
        if (!containsJapanese(text)) {
            return;
        }

        Logger.group(`Processing element translation`);
        Logger.info('Element info:', {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            textLength: text.length,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
        });

        try {
            // Mark as translating
            element.dataset.translating = 'true';
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'translation-loading';
            loadingDiv.textContent = 'Translating...';
            element.appendChild(loadingDiv);
            
            // Call translation API (with retry mechanism)
            const translatedText = await translateText(text);
            
            // Remove loading indicator
            loadingDiv.remove();
            
            // Create translation element
            const translationDiv = document.createElement('div');
            translationDiv.className = 'auto-translation';
            translationDiv.textContent = `Chinese: ${translatedText}`;
            
            // Add translation to element
            element.appendChild(translationDiv);
            
            // Mark as translated
            element.dataset.translated = 'true';
            element.dataset.translating = 'false';
            
            Logger.info('✅ Translation complete');
            
        } catch (error) {
            Logger.error('Translation failed:', error);
            
            // Remove loading indicator
            const loadingDiv = element.querySelector('.translation-loading');
            if (loadingDiv) loadingDiv.remove();
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'translation-error';
            errorDiv.textContent = `Translation failed: ${error.message || error}`;
            element.appendChild(errorDiv);
            
            element.dataset.translating = 'false';
            element.dataset.translationFailed = 'true';
        } finally {
            Logger.groupEnd();
        }
    }

    // Scan page for all text elements
    function scanPageForJapanese() {
        // Check if translation service is stopped
        if (isTranslationStopped) {
            Logger.warn('Translation service stopped, skipping page scan');
            return;
        }
        
        Logger.group('Starting page scan');
        Logger.info('Scan configuration:', CONFIG);
        Logger.info(`Current failure stats: global failures=${globalFailureCount}/${CONFIG.globalMaxFailures}`);
        
        const startTime = performance.now();
        const allElements = document.querySelectorAll('*');
        const elementsToTranslate = [];
        let scannedCount = 0;
        let skippedCount = 0;
        
        allElements.forEach(element => {
            scannedCount++;
            
            // Skip excluded tags
            if (CONFIG.excludeTags.includes(element.tagName)) {
                Logger.verbose(`Skipping excluded tag: ${element.tagName}`);
                skippedCount++;
                return;
            }
            
            // Skip translated, translating or failed elements
            if (element.dataset.translated === 'true' || 
                element.dataset.translating === 'true' ||
                element.dataset.translationFailed === 'true') {
                Logger.verbose('Skipping processed element:', element);
                skippedCount++;
                return;
            }
            
            // Check for direct text content
            const directText = getDirectTextContent(element);
            if (directText && containsJapanese(directText)) {
                // Check if child elements contain text (avoid duplicate translations)
                const hasTextChildren = Array.from(element.children).some(child => 
                    getDirectTextContent(child).length > 0
                );
                
                if (!hasTextChildren) {
                    elementsToTranslate.push(element);
                    Logger.verbose(`Found element to translate: ${element.tagName}.${element.className}`);
                }
            }
        });
        
        const endTime = performance.now();
        Logger.info(`Scan complete: total=${allElements.length}, scanned=${scannedCount}, skipped=${skippedCount}, to translate=${elementsToTranslate.length}, time=${(endTime - startTime).toFixed(2)}ms`);
        Logger.groupEnd();
        
        // Process translations in batches
        if (elementsToTranslate.length > 0) {
            Logger.info(`Preparing to translate ${elementsToTranslate.length} elements`);
            processBatch(elementsToTranslate);
        }
    }

    // Process translation requests in batches
    async function processBatch(elements) {
        Logger.group(`Batch translation processing (${elements.length} elements total)`);
        
        for (let i = 0; i < elements.length; i += CONFIG.batchSize) {
            const batch = elements.slice(i, i + CONFIG.batchSize);
            const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
            const totalBatches = Math.ceil(elements.length / CONFIG.batchSize);
            
            Logger.info(`Processing batch ${batchNum}/${totalBatches} (${batch.length} elements)`);
            
            await Promise.all(batch.map(el => processElement(el)));
            
            // Add delay between batches
            if (i + CONFIG.batchSize < elements.length) {
                Logger.verbose('Batch delay 100ms');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        Logger.info('✅ Batch translation complete');
        Logger.groupEnd();
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Setup DOM observer
    function setupObserver() {
        Logger.info('Setting up DOM observer');
        const debouncedScan = debounce(scanPageForJapanese, CONFIG.debounceTime);
        
        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            let changeCount = 0;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if new nodes contain text
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            shouldScan = true;
                            changeCount++;
                        }
                    });
                }
                
                if (mutation.type === 'characterData') {
                    shouldScan = true;
                    changeCount++;
                }
            }
            
            if (shouldScan) {
                Logger.verbose(`Detected ${changeCount} DOM changes, scanning in ${CONFIG.debounceTime}ms`);
                debouncedScan();
            }
        });

        // Start observing document
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
        
        Logger.info('✅ DOM observer started');
    }

    // Initialization function
    let initialized = false; // Prevent duplicate initialization
    
    function init() {
        // Prevent duplicate initialization
        if (initialized) {
            Logger.verbose('Script already initialized, skipping duplicate initialization');
            return;
        }
        
        // Check current domain
        const currentHost = window.location.hostname;
        const currentUrl = window.location.href;
        
        console.log('[Kindroid Translator] Initialization check - Host:', currentHost, 'URL:', currentUrl);
        
        if (!currentHost.includes('kindroid.ai')) {
            console.warn('[Kindroid Translator] Current page is not kindroid.ai, stopping script');
            return;
        }
        
        initialized = true;
        
        Logger.group('🚀 Kindroid.ai Japanese Translator Starting');
        Logger.info('Version: 2.1');
        Logger.info('Current page:', window.location.href);
        Logger.info('Page state:', document.readyState);
        Logger.info('Body exists:', !!document.body);
        Logger.info('API configuration:', {
            url: DEEPL_API_URL,
            apiKeyLength: DEEPL_API_KEY.length,
            hasApiKey: DEEPL_API_KEY !== 'YOUR_DEEPL_API_KEY'
        });
        
        if (DEEPL_API_KEY === 'YOUR_DEEPL_API_KEY') {
            Logger.error('⚠️ Warning: Please set your DeepL API key!');
            console.warn('%cPlease set your DeepL API key in the script', 'color: red; font-size: 16px; font-weight: bold;');
        }
        
        // Ensure document.body exists
        if (!document.body) {
            Logger.warn('document.body not found, delaying initialization');
            setTimeout(init, 100);
            Logger.groupEnd();
            return;
        }
        
        Logger.info('Page ready, starting initialization');
        
        // Delay first scan to ensure page is fully loaded
        setTimeout(() => {
            Logger.info('Executing first scan');
            scanPageForJapanese();
        }, 500);
        
        // Setup observer
        setupObserver();
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                Logger.info('Page visible again, executing scan');
                scanPageForJapanese();
            }
        });
        
        // Listen for URL changes (for SPA applications)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                Logger.info('URL change detected:', url);
                setTimeout(() => scanPageForJapanese(), 500);
            }
        }).observe(document, {subtree: true, childList: true});
        
        Logger.info('✅ Initialization complete');
        Logger.groupEnd();
        
        // Output usage tips
        console.log('%c💡 Tip: You can adjust log level and retry settings in CONFIG', 'color: #4CAF50; font-weight: bold;');
        console.log('Log level options: "error", "warn", "info", "verbose"');
        console.log('Current level:', CONFIG.logLevel);
        console.log('Retry settings: maxRetries=' + CONFIG.maxRetries + ', globalMaxFailures=' + CONFIG.globalMaxFailures);
        
        // Add manual reset function
        window.resetTranslationService = function() {
            globalFailureCount = 0;
            isTranslationStopped = false;
            console.log('%c✅ Translation service reset', 'color: green; font-weight: bold;');
            console.log('Translation can now resume');
            scanPageForJapanese();
        };
        console.log('%c💡 If translation service stops, type resetTranslationService() in console to reset', 'color: #2196F3;');
    }

    // Start script - use multiple methods to ensure execution
    console.log('[Kindroid Translator] Preparing initialization...');
    
    // Method 1: Try direct initialization
    try {
        init();
    } catch (e) {
        console.error('[Kindroid Translator] Direct initialization failed:', e);
    }
    
    // Method 2: Initialize after DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[Kindroid Translator] DOMContentLoaded event fired');
            init();
        });
    }
    
    // Method 3: Initialize after window load
    window.addEventListener('load', () => {
        console.log('[Kindroid Translator] window.load event fired');
        init();
    });
    
    // Method 4: Use timer as backup
    setTimeout(() => {
        console.log('[Kindroid Translator] Timer triggered initialization');
        init();
    }, 1000);

})();
