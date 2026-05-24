// src/lib/supabase.js
/**
* Creates a thin Supabase REST client for Cloudflare Workers.
* Uses the Service Role Key → bypasses RLS → full server access.
* @param {object} env - Hono c.env (Worker bindings)
*/

export function createSupabaseClient(env) {
    const url = env.SUPABASE_URL;
    const anonKey = env.SUPABASE_ANON_KEY;
    const serviceKey = env.SUPABASE_SERVICE_ROLE || env.SUPABASE_ANON_KEY;

    return {
        // SELECT query builder
        from(table) {
            return new QueryBuilder(url, table, anonKey, serviceKey);
        },
        // Raw RPC call
        async rpc(fn, params = {}, options = { useServiceRole: false }) {
            const keyToUse = options.useServiceRole ? serviceKey : anonKey;
            const headers = {
                'Content-Type': 'application/json',
                'apikey': keyToUse,
                'Authorization': `Bearer ${keyToUse}`,
                'Prefer': 'return=representation',
            };
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
	constructor(baseUrl, table, anonKey, serviceKey) {
		this._baseUrl = baseUrl;
		this._table = table;
		this._anonKey = anonKey;
		this._serviceKey = serviceKey;
		this._headers = {
			'Content-Type': 'application/json',
			'Prefer': 'return=representation',
		};
		this._params = new URLSearchParams();

		this._select = "*";
		this._method = "GET";
		this._body = null;

		this._single = false;
		this._maybeSingle = false;
		this._count = null;
	}

	// ------------------------
	// SELECT
	// ------------------------
	select(cols = "*", opts = {}) {
		this._select = cols.replace(/\s+/g, ' ').trim();

		if (opts.count === "exact") {
			// Append count=exact to Prefer header
			const currentPrefer = this._headers['Prefer'] || '';
			this._headers['Prefer'] = currentPrefer ? `${currentPrefer},count=exact` : 'count=exact';
			this._count = true;
		}

		return this;
	}

	// ------------------------
	// INSERT / UPSERT / UPDATE / DELETE
	// ------------------------
	insert(data) {
		this._method = "POST";
		this._body = JSON.stringify(data);
		return this;
	}

	upsert(data, { onConflict } = {}) {
		this._method = "POST";
		this._body = JSON.stringify(data);

		this._headers["Prefer"] = "resolution=merge-duplicates,return=representation";

		if (onConflict) {
			this._params.append("on_conflict", onConflict);
		}

		return this;
	}

	update(data) {
		this._method = "PATCH";
		this._body = JSON.stringify(data);
		return this;
	}

	delete() {
		this._method = "DELETE";
		return this;
	}

	returnsMinimal() {
		this._headers["Prefer"] = "return=minimal";
		return this;
	}

	// ------------------------
	// FILTERS
	// ------------------------
	eq(col, val) {
		this._params.append(col, `eq.${val}`);
		return this;
	}

	neq(col, val) {
		this._params.append(col, `neq.${val}`);
		return this;
	}

	gt(col, val) {
		this._params.append(col, `gt.${val}`);
		return this;
	}

	gte(col, val) {
		this._params.append(col, `gte.${val}`);
		return this;
	}

	lt(col, val) {
		this._params.append(col, `lt.${val}`);
		return this;
	}

	lte(col, val) {
		this._params.append(col, `lte.${val}`);
		return this;
	}

	like(col, val) {
		this._params.append(col, `like.${val}`);
		return this;
	}

	ilike(col, val) {
		this._params.append(col, `ilike.${val}`);
		return this;
	}

	in(col, vals) {
		this._params.append(col, `in.(${vals.join(",")})`);
		return this;
	}

	or(condition) {
		this._params.append("or", `(${condition})`);
		return this;
	}

	// ------------------------
	// PAGINATION / SORT
	// ------------------------
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

	// ------------------------
	// SINGLE HANDLING
	// ------------------------
	single() {
		this._single = true;
		return this;
	}

	maybeSingle() {
		this._maybeSingle = true;
		return this;
	}

	// ------------------------
	// EXECUTION
	// ------------------------
	async _execute() {
		const qs = this._params.toString();

		const url = `${this._baseUrl}/rest/v1/${this._table}?select=${encodeURIComponent(this._select)}${qs ? "&" + qs : ""}`;

		const keyToUse = this._method === "GET" ? this._anonKey : this._serviceKey;
		const finalHeaders = {
			...this._headers,
			'apikey': keyToUse,
			'Authorization': `Bearer ${keyToUse}`
		};

		const res = await fetch(url, {
			method: this._method,
			headers: finalHeaders,
			body: this._body
		});

		if (!res.ok) {
			const text = await res.text();
			return { data: null, error: { message: text }, count: null };
		}

		const totalCount = this._count
			? parseInt(res.headers.get("Content-Range")?.split("/")[1] ?? "0")
			: null;

		let data = null;

		try {
			data = await res.json();
		} catch {
			data = null;
		}

		if (this._single) {
			if (!data || (Array.isArray(data) && data.length === 0)) {
				return { data: null, error: { message: "No rows found" }, count: totalCount };
			}
			return { data: Array.isArray(data) ? data[0] : data, error: null, count: totalCount };
		}

		if (this._maybeSingle) {
			return {
				data: Array.isArray(data) ? data[0] ?? null : data ?? null,
				error: null,
				count: totalCount
			};
		}

		return { data, error: null, count: totalCount };
	}

	then(resolve, reject) {
		return this._execute().then(resolve, reject);
	}
}
