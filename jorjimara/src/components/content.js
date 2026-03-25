import { supabase } from "../lib/supabase.js";

const getNewProducts = (products, productImages, productVariants) => {
    const formatPrice = (amount) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);

    return products.slice(0, 4).map((product) => {
        const images = productImages
            .filter((img) => img.product_id === product.id)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((img) => img.url);

        // Get the first active variant for this product (used for the URL)
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
            photos: images.length > 0 ? images.slice(0, 3) : [],
            firstVariantId: firstVariant?.id ?? null,
        };
    });
};

const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('is_new_in', true)
    .eq('is_active', true);

const { data: imagesData } = await supabase
    .from('product_images')
    .select('*');

const { data: variantsData } = await supabase
    .from('product_variants')
    .select('*')
    .eq('is_active', true);

export const newProducts = getNewProducts(
    productsData || [],
    imagesData || [],
    variantsData || []
);
