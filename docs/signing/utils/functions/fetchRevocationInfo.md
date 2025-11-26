[**pdf-lite**](../../../README.md)

---

[pdf-lite](../../../README.md) / [signing/utils](../README.md) / fetchRevocationInfo

# Function: fetchRevocationInfo()

> **fetchRevocationInfo**(`options`): `Promise`\<[`RevocationInfo`](../../types/type-aliases/RevocationInfo.md)\>

Fetches revocation information (CRLs and OCSPs) for certificates.
Uses the certificate's embedded URLs to retrieve revocation data.

## Parameters

### options

Configuration for fetching revocation info.

#### certificates

[`ByteArray`](../../../types/type-aliases/ByteArray.md)[]

Array of DER-encoded certificates.

#### crlUrls?

`string`[]

Optional additional CRL URLs.

#### issuerCertificate?

[`ByteArray`](../../../types/type-aliases/ByteArray.md)

Optional issuer certificate for OCSP requests.

#### ocspUrls?

`string`[]

Optional additional OCSP URLs.

#### retrieveCrls?

`boolean`

Whether to fetch CRLs (default: true).

#### retrieveOcsps?

`boolean`

Whether to fetch OCSP responses (default: true).

## Returns

`Promise`\<[`RevocationInfo`](../../types/type-aliases/RevocationInfo.md)\>

The fetched revocation information.

## Example

```typescript
const revInfo = await fetchRevocationInfo({
    certificates: [certBytes],
    retrieveCrls: true,
    retrieveOcsps: true,
})
```
