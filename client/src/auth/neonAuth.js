const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";
const DEFAULT_NEON_AUTH_URL =
  "https://ep-fancy-smoke-b51bqfgm.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth";
let neonAuthUrlPromise;

export const getNeonAuthUrl = () => {
  if (!neonAuthUrlPromise) {
    neonAuthUrlPromise = fetch(`${API_BASE}/api/auth/neon/config`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then(async (response) => {
        const config = await response.json();
        if (!response.ok || !config.enabled || !config.base_url) {
          return DEFAULT_NEON_AUTH_URL;
        }

        return config.base_url.replace(/\/$/, "");
      })
      .catch(() => DEFAULT_NEON_AUTH_URL);
  }

  return neonAuthUrlPromise;
};

export const startGoogleSignIn = async () => {
  const authUrl = await getNeonAuthUrl();
  const callbackURL = `${window.location.origin}/auth/neon/callback`;
  const response = await fetch(`${authUrl}/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      errorCallbackURL: `${window.location.origin}/login?auth_error=google`,
    }),
  });
  const result = await response.json();

  if (!response.ok || !result.url) {
    throw new Error(result.message || result.error || "Google sign-in could not be started.");
  }

  window.location.assign(result.url);
};

export const completeGoogleSignIn = async () => {
  const authUrl = await getNeonAuthUrl();
  const response = await fetch(`${authUrl}/get-session`, {
    headers: { Accept: "application/json" },
    credentials: "include",
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Neon Auth session check failed (${response.status}). Please try Google sign-in again.`);
  }

  if (!result?.session || !result?.user) {
    throw new Error(
      "Neon Auth did not find an active session. Please try again and allow cookies for the Neon Auth domain if your browser asks."
    );
  }

  const token = response.headers.get("set-auth-jwt") || result.session.token;
  if (!token) throw new Error("Could not securely confirm your Google sign-in.");

  return { token, user: result.user };
};
