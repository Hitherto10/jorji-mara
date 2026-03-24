// backend
import  { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv';

dotenv.config({path: '../.env', quiet: true});


export function getSupabaseClient() {
    return createClient(
        `${process.env.SUPABASE_URL}`,
        `${process.env.SUPABASE_KEY}`
    );
}

