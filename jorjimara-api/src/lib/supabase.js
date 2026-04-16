// src/lib/supabase.js
/**
* Creates a thin Supabase REST client for Cloudflare Workers.
* Uses the Service Role Key → bypasses RLS → full server access.
* @param {object} env - Hono c.env (Worker bindings)
*/

export function createSupabaseClient(env) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_ANON_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=representation',
    };
    return {
        // SELECT query builder
        from(table) {
            return new QueryBuilder(url, table, headers);
        },
        // Raw RPC call
        async rpc(fn, params = {}) {
            const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(params),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        }
    };
}

class QueryBuilder {
    constructor(baseUrl, table, headers) {
        this._baseUrl = baseUrl;
        this._table = table;
        this._headers = { ...headers };
        this._params = new URLSearchParams();
        this._select = "*";
        this._method = "GET";
        this._body = null;
        this._count = null;
    }
    select(cols, opts = {}) {
        this._select = cols.replace(/\s+/g, ' ').trim();
        if (opts.count === "exact") {
            this._headers['Prefer'] = 'count=exact';
            this._count = true;
        }
        return this;
    }
    eq(col, val) {
        this._params.append(`${col}`, `eq.${val}`);
        return this;
    }
    neq(col, val) {
        this._params.append(`${col}`, `neq.${val}`);
        return this;
    }
    in(col, vals) {
        this._params.append(`${col}`, `in.(${vals.join(",")})`);
        return this;
    }
    ilike(col, val) {
        this._params.append(`${col}`, `ilike.${val}`);
        return this;
    }
    limit(n) {
        this._params.append("limit", String(n));
        return this;
    }
    range(from, to) {
        this._headers["Range"] = `${from}-${to}`;
        return this;
    }
    order(col, opts = {}) {
        const dir = opts.ascending === false ? "desc" : "asc";
        this._params.append("order", `${col}.${dir}`);
        return this;
    }
    single() {
        this._single = true;
        return this;
    }

    async _execute() {
        const qs = this._params.toString();
        const url = `${this._baseUrl}/rest/v1/${this._table}?select=${encodeURIComponent(this._select)}${qs ?
            "&" + qs : ""}`;
        const res = await fetch(url, { method: this._method, headers: this._headers, body: this._body });
        if (!res.ok) {
            const text = await res.text();
            return { data: null, error: { message: text }, count: null };
        }

        const totalCount = this._count ? parseInt(res.headers.get("Content-Range")?.split("/")[1] ?? "0") : null;
        const data = await res.json();
        const result = this._single ? (Array.isArray(data) ? data[0] : data) : data;
        return { data: result ?? null, error: null, count: totalCount };
    }
    then(resolve, reject) { return this._execute().then(resolve, reject); }
}