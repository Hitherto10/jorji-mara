import {getSupabaseClient} from '../supabase'

const supabase = getSupabaseClient()

module.exports = async function adminMiddleware(req, res, next) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single()
    if (error || data?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' })
    }
    next()
}
// Chaining both on a route:
// router.patch("/:id/status", auth, admin, async (req, res) => { ... })