//**********************************************************************************************/
// Decrypt challenge
//**********************************************************************************************/
import _sodium from 'libsodium-wrappers';
import {
    HttpMethod,
    COLORS,
    warn,
    log_error,
    info,
    http
  } from './util.js';
//**********************************************************************************************/
async function executeChallenge() {
    try {
        // Prepare/Load sodium library
        await _sodium.ready;
        const sodium = _sodium;
        // Create challenge resources
        const baseUrl = 'https://g5qrhxi4ni.execute-api.eu-west-1.amazonaws.com/Prod';
        const decryptUrl = `${baseUrl}/decrypt`;
        const { challengeId, key, ciphertext, nonce } = await http(decryptUrl, HttpMethod.POST);
        info("Resource creation succeeded!")
        // Fetch created challenge resources
        const resourceUrl = `${decryptUrl}/${challengeId}`;
        const getResponse = await http(resourceUrl, HttpMethod.GET);
        const created_challengeId = getResponse.challengeId;
        const created_key = getResponse.key;
        const created_ciphertext = getResponse.ciphertext;
        const created_nonce = getResponse.nonce;
        info("Resource can be retrieved!")
        // Check if they both are the same
        if (created_challengeId != challengeId ||
            created_key != key ||
            created_ciphertext != ciphertext ||
            created_nonce != nonce) {
            throw new Error("Created and fetched resources do not match");
        }
        info("Fetched resource has not been modified!")
        // Decrypt message with Ekey(nonce, plaintext) = ciphertext
        // First decode from bae64 due to HTTP limitation
        const key_bytes = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
        const ciphertext_bytes = sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL);
        const nonce_bytes = sodium.from_base64(nonce, sodium.base64_variants.ORIGINAL);
        // The algorythm used is XSalsa20 stream cipher
        const plaintext = sodium.crypto_secretbox_open_easy(ciphertext_bytes, nonce_bytes, key_bytes);
        // Encode raw bytes to base64 before HTTP transport
        const plaintext_base64 = sodium.to_base64(plaintext, sodium.base64_variants.ORIGINAL);
        // Prepare payload
        let data = {
            plaintext: plaintext_base64
        };
        // Delete the created resource
        const delResponse = await http(resourceUrl, HttpMethod.DELETE, data);
        info("Resource deleted successfully!")
        // Try and retrieve same resource, expected behavior should be a catched 404 error
        const errResponse = await http(resourceUrl, HttpMethod.GET);
    } catch (error) {
        log_error(error.message);
    }
}
//**********************************************************************************************/
executeChallenge();
//**********************************************************************************************/