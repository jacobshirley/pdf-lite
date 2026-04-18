import { describe, it, expect } from 'vitest'
import { server } from 'vitest/browser'
import { PdfFont } from '../../src/fonts/pdf-font'

const OTF_FIXTURE = './test/unit/fixtures/fonts/SourceSans3-Regular.otf'

const base64ToBytes = (base64: string) => {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
}

describe('Debug CFF space', () => {
    it('inspect reverseToUnicodeMap keys', async () => {
        const base64 = await server.commands.readFile(OTF_FIXTURE, {
            encoding: 'base64',
        })
        const fontData = base64ToBytes(base64)

        const font = PdfFont.fromBytes(fontData)

        const toUniMap = font.toUnicodeMap!
        // Check what the space entry actually looks like
        const spaceStr = toUniMap.get(1)!
        console.log('space str length:', spaceStr.length)
        console.log('space charCodeAt(0):', spaceStr.charCodeAt(0))
        console.log('space === " ":', spaceStr === ' ')

        const revMap = font.reverseToUnicodeMap!
        // Look at the first few keys
        const keys = Array.from(revMap.keys()).slice(0, 5)
        console.log('First 5 rev keys:', JSON.stringify(keys))
        console.log(
            'First 5 rev key charCodes:',
            keys.map((k) => k.charCodeAt(0)),
        )

        // Check if there's a key with charCode 0x20
        let foundSpace = false
        for (const [key, val] of revMap) {
            if (key.charCodeAt(0) === 0x20) {
                console.log(
                    'Found space key! value:',
                    val,
                    'key length:',
                    key.length,
                )
                foundSpace = true
                break
            }
        }
        if (!foundSpace) {
            console.log('No key with charCode 0x20 found in revMap')
        }

        // Try lookup with explicit String.fromCharCode
        const sp = String.fromCharCode(0x20)
        console.log('revMap.get(fromCharCode(0x20)):', revMap.get(sp))

        expect(true).toBe(true)
    })
})
