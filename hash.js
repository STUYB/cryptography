//**********************************************************************************************/
// Hash challenge
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
import { randomBytes } from 'crypto';
//**********************************************************************************************/
async function executeChallenge() {
    try {
        // Prepare/Load sodium library
        await _sodium.ready;
        const sodium = _sodium;
        // Create challenge resources
        const baseUrl = 'https://g5qrhxi4ni.execute-api.eu-west-1.amazonaws.com/Prod';
        const hashUrl = `${baseUrl}/hash`;
        const { challengeId, message, attemptsRemaining } = await http(hashUrl, HttpMethod.POST);
        info("Resource creation succeeded!")
        // Fetch created challenge resources
        const resourceUrl = `${hashUrl}/${challengeId}`;
        const getResponse = await http(resourceUrl, HttpMethod.GET);
        const created_challengeId = getResponse.challengeId;
        const created_message = getResponse.message;
        const created_attemptsRemaining = getResponse.attemptsRemaining;
        info("Resource can be retrieved!")
        // Check if they both are the same
        if (created_challengeId != challengeId ||
            created_message != message ||
            created_attemptsRemaining != attemptsRemaining) {
            throw new Error("Created and fetched resources do not match");
        }
        info("Fetched resource has not been modified!")
        // Prepend it to the challenge's message results in a Blake2 hash with the 2 leading bytes equal to 0
        // First decode from bae64 due to HTTP limitation
        const message_bytes = sodium.from_base64(message, sodium.base64_variants.ORIGINAL);
        const prefix_bytes = await find00Prefix(message_bytes);
        // Encode raw bytes to base64 before HTTP transport
        const prefix_base64 = sodium.to_base64(prefix_bytes, sodium.base64_variants.ORIGINAL);
        // Prepare payload
        let data = {
            prefix: prefix_base64
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
async function find00Prefix(message) {
    try {
        // Prepare/Load sodium library
        await _sodium.ready;
        const sodium = _sodium;
        const length = 10; // limit brute force 
        let hash = new Uint8Array([1, 1]); // starting point
        let prefix;
        while (hash[0] !== 0 || hash[1] !== 0) {
            prefix = randomBytes(length);
            const prepended_bytes = new Uint8Array([...prefix, ...message]);
            hash = _sodium.crypto_generichash(_sodium.crypto_generichash_BYTES, prepended_bytes);
        }
        return prefix;
    } catch (e) {
        throw e;
    }
}
//**********************************************************************************************/
executeChallenge();
//**********************************************************************************************/