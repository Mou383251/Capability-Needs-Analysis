// This is a client-side simulation of authentication.
// In a real production app, credentials would be sent to a backend server.
const PLAIN_PASSWORD = 'Lmou2in1_2025';
const ALLOWED_USERNAMES = ['DPM@2025'];

/**
 * Verifies user credentials by comparing them to stored values.
 * This is NOT SECURE and is for development purposes only.
 * Also logs the login attempt to the console.
 * This version is robust, trimming whitespace and making username check case-insensitive.
 * @param username The entered username.
 * @param password The entered password (plain text).
 * @returns A promise that resolves to true if credentials are valid, false otherwise.
 */
export async function verifyCredentials(username: string, password: string): Promise<boolean> {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    const timestamp = new Date().toISOString();
    
    // Make username check case-insensitive
    const isUsernameValid = ALLOWED_USERNAMES.map(u => u.toLowerCase()).includes(trimmedUsername.toLowerCase());
    const isPasswordValid = trimmedPassword === PLAIN_PASSWORD;
    
    const status = isUsernameValid && isPasswordValid ? 'success' : 'failure';
    
    // In a real application, this log would be sent to a secure, server-side logging service.
    console.log(`Login attempt: { username: "${trimmedUsername}", timestamp: "${timestamp}", status: "${status}" }`);
    
    return isUsernameValid && isPasswordValid;
}
