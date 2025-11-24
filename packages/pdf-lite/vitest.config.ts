import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    test: {
        isolate: true,
        projects: [
            {
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['**/*.node.(test|spec).ts'],
                    exclude: ['node_modules'],
                },
            },
            {
                test: {
                    name: 'browser',
                    include: ['**/*.(test|spec).ts'],
                    exclude: ['node_modules', '**/*.node.(test|spec).ts'],
                    browser: {
                        // Disable CORS to test the timestamp request example
                        provider: playwright({
                            contextOptions: {
                                extraHTTPHeaders: {
                                    'Content-Type':
                                        'application/timestamp-query',
                                },
                            },
                            launchOptions: {
                                args: ['--disable-web-security'],
                            },
                        }),
                        enabled: true,
                        headless: true,
                        screenshotFailures: false,
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
})
