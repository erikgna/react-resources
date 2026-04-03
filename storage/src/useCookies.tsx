// They are automatically sent with every HTTP request
// max size is 4kb per cookie
// 20-50 cookies per domain
// expiration built in
// scope by domain or path

// Set-Cookie: user=erik; Max-Age=3600; Path=/; Secure; SameSite=Lax

// user=erik → value
// Domain → the domain to set the cookie for, if not set, it will be the current domain
// Max-Age / Expires → lifetime in seconds, if not set, the cookie will expire with the session
// Path → where it applies
// Secure → HTTPS only
// HttpOnly → JS cannot access
// SameSite → CSRF protection
    // Lax: the browser controls when to send it to the server based on request context (default)
    // Strict: Never sent for any cross-site request
    // None: Sent for all requests but requires Secure

export class CookieService {
  static set(
    name: string,
    value: string,
    options?: {
      maxAge?: number;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax" | "none";
    },
  ) {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;

    cookie += `; Path=${options?.path ?? "/"}`;

    if (options?.secure) cookie += `; Secure`;
    if (options?.httpOnly) cookie += `; HttpOnly`;
    if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;

    document.cookie = cookie;
  }

  static get(name: string): string | null {
    const cookies = document.cookie.split("; ");

    for (const c of cookies) {
      const [key, value] = c.split("=");
      if (key === name) return decodeURIComponent(value);
    }

    return null;
  }

  static remove(name: string) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

import { useState } from "react";

export function useCookie(name: string, initialValue: string) {
  const [value, setValue] = useState(() => {
    return CookieService.get(name) ?? initialValue;
  });

  const update = (newValue: string) => {
    CookieService.set(name, newValue);
    setValue(newValue);
  };

  return [value, update] as const;
}
