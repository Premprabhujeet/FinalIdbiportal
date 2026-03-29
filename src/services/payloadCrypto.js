import CryptoJS from 'crypto-js'

const payloadEncryptionKey = import.meta.env.VITE_PAYLOAD_ENCRYPTION_KEY ?? ''

function getDecodedKey() {
  if (!payloadEncryptionKey) {
    throw new Error('Missing VITE_PAYLOAD_ENCRYPTION_KEY for request encryption.')
  }

  return CryptoJS.enc.Base64.parse(payloadEncryptionKey)
}

export function encryptRequestData(requestBody) {
  const serializedBody =
    typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody ?? {})
  const iv = CryptoJS.lib.WordArray.random(16)
  const decodedKey = getDecodedKey()
  // The backend expects AES-CBC with a random IV prefixed to the ciphertext before Base64 encoding.
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(serializedBody), decodedKey, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  })
  const combined = iv.concat(encrypted.ciphertext)

  return CryptoJS.enc.Base64.stringify(combined)
}

export function decryptResponseData(responseBody) {
  if (!responseBody || typeof responseBody !== 'string') {
    return responseBody
  }

  const byteCipherText = CryptoJS.enc.Base64.parse(responseBody)
  // The first 16 bytes contain the IV; the remaining bytes are the actual ciphertext.
  const iv = CryptoJS.lib.WordArray.create(byteCipherText.words.slice(0, 4), 16)
  const cipherText = CryptoJS.lib.WordArray.create(
    byteCipherText.words.slice(4),
    byteCipherText.sigBytes - 16,
  )
  const decodedKey = getDecodedKey()
  const decrypted = CryptoJS.AES.decrypt({ ciphertext: cipherText }, decodedKey, {
    iv,
    padding: CryptoJS.pad.Pkcs7,
    mode: CryptoJS.mode.CBC,
  })
  const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)

  return decryptedString
}

export function decodeApiResponse(responseData) {
  if (!responseData || typeof responseData !== 'object') {
    return responseData
  }

  if (!responseData.ResponseData) {
    return responseData
  }

  // Some APIs return encrypted JSON inside ResponseData, others already return plain JSON.
  const decryptedString = decryptResponseData(responseData.ResponseData)

  try {
    return JSON.parse(decryptedString)
  } catch {
    return decryptedString
  }
}
