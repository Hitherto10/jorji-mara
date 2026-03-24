import {getSupabaseClient} from "../supabase.js";
import dotenv from "dotenv";
import express from "express";

const router = express.Router();
dotenv.config({path: '../../.env', quiet: true});

const getNewProducts = (products, productImages) => {
    return products.slice(0, 4).map((product) => {

        // 1. Filter images belonging to this product
        // 2. Sort them so the primary image (is_primary: true) comes first
        const images = productImages
            .filter((img) => img.product_id === product.id)
            .sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
            .map((img) => img.url);

        return {
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            // Using the first tag as a badge, or a default "New"
            badge: product.tags && product.tags.length > 0 ? product.tags[0] : "New",
            photos: images,
        };
    });
};

// Usage:

router.get('/products' , async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .contains('tags', ['New']);

        const Imagedata = await supabase
            .from('product_images')
            .select('*')

        const newProducts = getNewProducts(data, Imagedata.data);

        res.status(200)
            .json(JSON.stringify({
                success: true,
                message: `Products fetched successfully!`,
                data: newProducts
            }));

    } catch (error) {
        console.log(error);
    }
})

export default router;
