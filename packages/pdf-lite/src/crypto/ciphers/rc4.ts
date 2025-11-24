import { ByteArray, Cipher } from '../../types.js'

export function rc4(key: ByteArray): Cipher {
    // RC4 Key Scheduling Algorithm (KSA)
    function ksa(key: ByteArray) {
        const S = new Uint8Array(256)
        for (let i = 0; i < 256; i++) S[i] = i
        let j = 0
        for (let i = 0; i < 256; i++) {
            j = (j + S[i] + key[i % key.length]) & 0xff
            ;[S[i], S[j]] = [S[j], S[i]]
        }
        return S
    }

    // RC4 Pseudo-Random Generation Algorithm (PRGA)
    function rc4(data: ByteArray, S: ByteArray): ByteArray {
        const out = new Uint8Array(data.length)
        let i = 0,
            j = 0
        const s = S.slice() // Copy S for each operation
        for (let k = 0; k < data.length; k++) {
            i = (i + 1) & 0xff
            j = (j + s[i]) & 0xff
            ;[s[i], s[j]] = [s[j], s[i]]
            const rnd = s[(s[i] + s[j]) & 0xff]
            out[k] = data[k] ^ rnd
        }
        return out
    }

    const S = ksa(key)
    return {
        encrypt: async (data: ByteArray): Promise<ByteArray> => {
            return rc4(data, S)
        },
        decrypt: async (data: ByteArray): Promise<ByteArray> => {
            return rc4(data, S)
        },
    }
}
