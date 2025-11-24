import { computeAlgorithm2bHash } from '../key-derivation/key-derivation-aes256.js'
import { getRandomBytes } from '../../utils/algos.js'
import { aes256CbcNoPaddingEncrypt } from '../../utils/algos.js'
import { ByteArray } from '../../types.js'

export async function generateUandUe(
    password: ByteArray,
    fileKey: ByteArray,
): Promise<{ U: ByteArray; UE: ByteArray }> {
    const random = getRandomBytes(16)
    const userValidationSalt = random.subarray(0, 8)
    const userKeySalt = random.subarray(8, 16)

    const U = new Uint8Array(48)
    U.set(await computeAlgorithm2bHash(password, userValidationSalt))
    U.set(userValidationSalt, 32)
    U.set(userKeySalt, 40)

    const hash = await computeAlgorithm2bHash(password, userKeySalt)
    const UE = await aes256CbcNoPaddingEncrypt(
        hash,
        fileKey,
        new Uint8Array(16),
    )

    return { U, UE }
}

export async function generateOandOe(
    password: ByteArray,
    U: ByteArray,
    fileKey: ByteArray,
): Promise<{ O: ByteArray; OE: ByteArray }> {
    const random = getRandomBytes(16)
    const ownerValidationSalt = random.subarray(0, 8)
    const ownerKeySalt = random.subarray(8, 16)

    const O = new Uint8Array(48)
    O.set(await computeAlgorithm2bHash(password, ownerValidationSalt, U))
    O.set(ownerValidationSalt, 32)
    O.set(ownerKeySalt, 40)

    const hash = await computeAlgorithm2bHash(password, ownerKeySalt, U)

    const OE = await aes256CbcNoPaddingEncrypt(
        hash,
        fileKey,
        new Uint8Array(16),
    )

    return { O, OE }
}
