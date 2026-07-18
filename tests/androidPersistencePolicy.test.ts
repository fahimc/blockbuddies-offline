/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const mainActivityPath = resolve(
  process.cwd(),
  'android/app/src/main/java/com/blockbuddies/offline/MainActivity.java',
)

describe('Android persistence policy', () => {
  it('keeps persistent WebView storage across app updates', () => {
    const source = readFileSync(mainActivityPath, 'utf8')

    expect(source).not.toContain('WebStorage')
    expect(source).not.toContain('deleteAllData')
    expect(source).toContain('clearCache(true)')
    expect(source).toContain('clearStaleWebViewCachesForThisBuild')
  })
})
