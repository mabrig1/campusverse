import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

export class GoogleAuthNotConfiguredError extends Error {
  constructor() {
    super("Google sign-in isn't configured on this server yet");
  }
}

/**
 * Verifies a Google Identity Services ID token (the `credential` the
 * frontend receives from Google's Sign In With Google button) and returns
 * the verified profile. Throws if GOOGLE_CLIENT_ID isn't set, or if the
 * token's signature/audience don't check out.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!client) throw new GoogleAuthNotConfiguredError();

  const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || payload.email,
    avatarUrl: payload.picture,
  };
}
