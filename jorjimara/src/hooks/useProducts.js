import { apiGet } from '../lib/api.js';
import { useState, useEffect } from 'react';

export function useProducts({ filters = {}, sort = "new", page = 0 } = {}) {
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const params = { page, sort };
        if (filters.categories?.length) params.category = filters.categories[0];
        if (filters.colors?.length) params.colors = filters.colors.join(",");
        if (filters.sizes?.length) params.sizes = filters.sizes.join(",");

        if (filters.inStock)
            params.inStock = "true";

        apiGet("/api/products", params)
            .then(res => {
                if (!cancelled) {
                    setProducts(res.data ?? []);
                    setTotal(res.total ?? 0);
                    setLoading(false);
                }
            })
            .catch(err => { if (!cancelled) { setError(err.message); setLoading(false); } });
        return () => { cancelled = true; };
    }, [JSON.stringify(filters), sort, page]);
    return { products, total, loading, error, pageSize: 24 };
}

export function useFilterOptions() {
    const [options, setOptions] = useState({ colors: [], sizes: [], categories: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet("/api/catalog/filters")
            .then(({ data }) => { setOptions(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);
    return { options, loading };
}