const BASE_URL = import.meta.env.VITE_CLDFLARE_API_URL;

export async function apiGet(path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${path}${qs ? "?" + qs : ""}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

export async function apiPost(path, body = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}