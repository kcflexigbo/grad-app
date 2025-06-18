/**
 * Represents the successful response from the /auth/token endpoint.
 * This should match the `schemas.Token` Pydantic model.
 */
export interface TokenResponse {
    access_token: string;
    token_type: string; // Typically "bearer"
}

/**
 * Represents the decoded payload of the JWT.
 * This helps in understanding what data is stored inside the token.
 */
export interface DecodedToken {
    sub: string; // The "subject" of the token (in our case, the username)
    exp: number; // The expiration timestamp (in seconds since epoch)
}