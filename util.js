//**********************************************************************************************/
// Util
//**********************************************************************************************/
const HttpMethod = Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
});
const COLORS = Object.freeze({
    Black: "\x1b[30m",
    Red: "\x1b[31m",
    Green: "\x1b[32m",
    Yellow: "\x1b[33m",
    Blue: "\x1b[34m",
    Magenta: "\x1b[35m",
    Cyan: "\x1b[36m",
    White: "\x1b[37m"
});
function warn(text) { console.log(COLORS.Yellow, text) }
function log_error(text) { console.log(COLORS.Red, text) }
function info(text) { console.log(COLORS.Cyan, text) }
//**********************************************************************************************/
async function http(url, method, data) {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : null
        });
        let status = response.status;
        // Status above the "ok" range should throw an error
        if (status < 200 || status >= 300) throw new Error(`Request failed with status ${response.status}`);
        const responseData = method != HttpMethod.DELETE ?
            await response.json() : await response.text();
        return responseData;
    } catch (error) {
        throw error;
    }
}
//**********************************************************************************************/
export {
    HttpMethod,
    COLORS,
    warn,
    log_error,
    info,
    http
};
//**********************************************************************************************/