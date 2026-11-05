import { z } from "zod";

/** User-confirmed existing backend; never use the attached fleet project's auth. */
export const ALIN_API_BASE_URL = "https://app.alinmove.com/api";
export const ALIN_API_ORIGIN = "https://app.alinmove.com";
export const LOGIN_CONTRACT = Object.freeze({ method: "POST" as const, pathTemplate: "/api/auth/login" });

export interface LoginCredentials {
  email: string;
  password: string;
}

// Shape consumed by the canonical app's public client; staging verification pending.
export const loginResponseSchema = z.object({
  access_token: z.string().min(1).max(16384).regex(/^\S+$/),
  expires_in: z.number().int().positive().max(3600),
}).transform((body) => ({ accessToken: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 }));

export type LoginSession = z.output<typeof loginResponseSchema>;

export class LoginError extends Error {
  constructor(readonly code: "NETWORK_OR_CORS" | "INVALID_CREDENTIALS" | "FORBIDDEN" | "RATE_LIMITED" | "UNAVAILABLE" | "INVALID_RESPONSE") {
    const messages = {
      NETWORK_OR_CORS: "Couldn't reach ALiN Move. Check your connection and retry. If it continues, ALiN Move may still need to allow sign-in from this portal.",
      INVALID_CREDENTIALS: "The email or password wasn't accepted. Please try again.",
      FORBIDDEN: "ALiN Move hasn't allowed this account to sign in. Contact your fleet owner.",
      RATE_LIMITED: "Too many sign-in attempts. Please wait before trying again.",
      UNAVAILABLE: "ALiN Move sign-in is temporarily unavailable. Please try again later.",
      INVALID_RESPONSE: "ALiN Move returned an unexpected sign-in response. No session was opened.",
    };
    super(messages[code]);
    this.name = "LoginError";
  }
}