import {supabase} from "../lib/supabase.js";

const getNewProducts = (products, productImages) => {
    const formatPrice = (amount) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);

    return products.slice(0, 4).map((product) => {
        const images = productImages
            .filter((img) => img.product_id === product.id)
            .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
            .map((img) => img.url);

        return {
            id: product.id,
            name: product.name,
            price: formatPrice(Number(product.price)),
            currency: product.currency,
            badge: product.tags?.[0] || "New",
            photos: images.slice(0, 3),
        };
    });
};

const { data, error } = await supabase
    .from('products')
    .select('*')
    .contains('tags', ['New']);

const Imagedata = await supabase
    .from('product_images')
    .select('*')

export const newProducts = getNewProducts(data, Imagedata.data);