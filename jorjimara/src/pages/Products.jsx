import React from 'react';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

const { data, error } = await supabase.from('products').select('*')
// console.log(data, error)

export default function Products() {
    return (
        <div>
            <h1>Products</h1>
        </div>
    )
}