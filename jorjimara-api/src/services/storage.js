// src/services/storage.js
const supabase = require('../supabase')
const { v4: uuidv4 } = require('uuid')
async function uploadProductImage(fileBuffer, mimeType, productId) {
    const ext = mimeType.split('/')[1]
    const filename = `${productId}/${uuidv4()}.${ext}`
    const { error } = await supabase.storage
        .from('product-images')
        .upload(filename, fileBuffer, { contentType: mimeType, upsert: false })
    if (error) throw new Error(`Storage upload failed: ${error.message}`)
    const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename)
    return publicUrl // store this in product_images.url
}
module.exports = { uploadProductImage }