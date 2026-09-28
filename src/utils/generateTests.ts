/**
 * Generates a Vitest test scaffold from an array of test scenario descriptions.
 * The function name hint is derived from the analysis title.
 */
export function generateTestCode(tests: string[], titleHint: string): string {
  const safeName = titleHint
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40) || 'analyzed_function'

  const cases = tests
    .map((test, i) => {
      const testName = test.replace(/'/g, "\\'")
      return `  it('${testName}', () => {
    // TODO: implement test case ${i + 1}
    // Scenario: ${test}
    expect(true).toBe(true) // replace with real assertion
  })`
    })
    .join('\n\n')

  return `import { describe, it, expect } from 'vitest'
// import { ${safeName} } from './your-module'

describe('${titleHint} — Regression Tests', () => {
${cases}
})`
}
