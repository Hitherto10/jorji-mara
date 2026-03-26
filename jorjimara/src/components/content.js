// content.js
import { supabase } from "../lib/supabase.js";

const formatPrice = (amount) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);

const getNewProducts = (products, productImages, productVariants) => {
    return products.slice(0, 4).map((product) => {
        const images = productImages
            .filter((img) => img.product_id === product.id)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img) => img.url);

        const firstVariant = productVariants
            .filter((v) => v.product_id === product.id && v.is_active)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: formatPrice(Number(product.price)),
            currency: product.currency,
            badge: product.is_new_in ? "New" : (product.tags?.[0] || null),
            photos: images.slice(0, 3),
            firstVariantId: firstVariant?.id ?? null,
        };
    });
};
const formatNewProducts = (products) => {
    const formatPrice = (amount) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);

    return products.map((product) => {
        const images = (product.product_images || [])
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img) => img.url);

        const firstVariant = (product.product_variants || [])
            .filter((v) => v.is_active)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: formatPrice(Number(product.price)),
            currency: product.currency,
            badge: product.is_new_in ? "New" : (product.tags?.[0] || null),
            photos: images.slice(0, 3),
            firstVariantId: firstVariant?.id ?? null,
        };
    });
};
export const fetchNewProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select(`
      id,
      name,
      slug,
      price,
      currency,
      is_new_in,
      tags,
      product_images (
        url,
        sort_order
      ),
      product_variants (
        id,
        is_active,
        created_at
      )
    `)
        .eq('is_new_in', true)
        .eq('is_active', true)
        .limit(4);

    if (error) {
        console.error(error);
        return [];
    }

    return formatNewProducts(data || []);
};