const PREFIX = "remora.web.";

export function lsGet(key: string, fallback = ""): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* ignore quota */
  }
}

export function ssGet(key: string, fallback = ""): string {
  try {
    return sessionStorage.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function ssSet(key: string, value: string) {
  try {
    sessionStorage.setItem(PREFIX + key, value);
  } catch {
    /* ignore */
  }
}

export function ssDel(key: string) {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
