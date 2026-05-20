"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWishlist = getWishlist;
exports.addToWishlist = addToWishlist;
exports.removeFromWishlist = removeFromWishlist;
exports.toggleWishlist = toggleWishlist;
const supabase_1 = require("../supabase");
const wishlistSelect = `
  id, created_at,
  product:products(id, title, base_price, discount_pct, type,
    images:product_images(url, is_primary, color),
    variants(id, color, size, quantity))
`;
async function getWishlist(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('wishlist_items')
        .select(wishlistSelect)
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}
async function addToWishlist(req, res) {
    const { product_id } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('wishlist_items')
        .upsert({ user_id: req.user.id, product_id }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
        .select(wishlistSelect)
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
}
async function removeFromWishlist(req, res) {
    const { error } = await supabase_1.supabase
        .from('wishlist_items')
        .delete()
        .eq('product_id', req.params.productId)
        .eq('user_id', req.user.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
}
async function toggleWishlist(req, res) {
    const { product_id } = req.body;
    const { data: existing } = await supabase_1.supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('product_id', product_id)
        .single();
    if (existing) {
        await supabase_1.supabase.from('wishlist_items').delete().eq('id', existing.id);
        return res.json({ added: false });
    }
    await supabase_1.supabase.from('wishlist_items').insert({ user_id: req.user.id, product_id });
    res.json({ added: true });
}
//# sourceMappingURL=wishlistController.js.map