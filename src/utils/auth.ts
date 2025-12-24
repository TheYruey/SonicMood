/**
 * Inicia el flujo de autenticación PKCE.
 * Genera un verifier, crea un challenge y redirige al usuario a Spotify para autorizar.
 * @param clientId ID del cliente de Spotify
 */
export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/");
    // Scope actualizado para incluir lectura de top artists (user-top-read)
    params.append("scope", "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por un token de acceso.
 * Verifica que el verifier almacenado coincida.
 * @param clientId ID del cliente de Spotify
 * @param code Código devuelto por Spotify
 * @returns Token de acceso (access_token)
 */
export async function getAccessToken(clientId: string, code: string) {
    const verifier = localStorage.getItem("verifier");

    console.log("Token Exchange Debug:", { clientId, codeLength: code?.length, verifierLength: verifier?.length, verifier });

    if (!verifier) {
        throw new Error("No verifier found in localStorage");
    }

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    if (!result.ok) {
        const errorBody = await result.text(); // Read text first in case JSON parsing fails
        console.error("Token Exchange Error:", result.status, result.statusText, errorBody);
        throw new Error(`Token exchange failed: ${result.status} ${errorBody}`);
    }

    const { access_token } = await result.json();
    return access_token;
}

/**
 * Genera una cadena aleatoria para usar como verificador de código (PKCE).
 * @param length Longitud de la cadena
 * @returns Cadena aleatoria
 */
function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Genera el challenge SHA-256 a partir del verifier.
 * @param codeVerifier El verifier generado
 * @returns Challenge codificado en base64 URL-safe
 */
async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
