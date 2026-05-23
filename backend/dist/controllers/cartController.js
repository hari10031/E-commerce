"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCart = getCart;
exports.addToCart = addToCart;
exports.updateCartItem = updateCartItem;
exports.removeFromCart = removeFromCart;
exports.clearCart = clearCart;
const supabase_1 = require("../supabase");
const cartSelect = `
  id, quantity, product_id, variant_id,
  product:products(id, title, base_price, discount_pct, type,
    images:product_images(url, is_primary, color)),
  variant:variants(id, color, size, quantity, sku, image_url)
`;
// The storefront always works with the whole cart, so every endpoint
// responds with the full, current list under { items }.
async function fetchCart(userId) {
    const { data } = await supabase_1.supabase
        .from('cart_items')
        .select(cartSelect)
        .eq('user_id', userId)
        .order('id', { ascending: true });
    return data ?? [];
}
async function getCart(req, res) {
    res.json({ items: await fetchCart(req.user.id) });
}
async function addToCart(req, res) {
    const { product_id, variant_id, quantity = 1 } = req.body;
    const { data: variant } = await supabase_1.supabase
        .from('variants')
        .select('quantity')
        .eq('id', variant_id)
        .single();
    if (!variant || variant.quantity < 1) {
        return res.status(400).json({ error: 'Item out of stock' });
    }
    const { error } = await supabase_1.supabase
        .from('cart_items')
        .upsert({ user_id: req.user.id, product_id, variant_id, quantity }, { onConflict: 'user_id,variant_id', ignoreDuplicates: false });
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json({ items: await fetchCart(req.user.id) });
}
async function updateCartItem(req, res) {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be >= 1' });
    }
    const { error } = await supabase_1.supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ items: await fetchCart(req.user.id) });
}
async function removeFromCart(req, res) {
    const { error } = await supabase_1.supabase
        .from('cart_items')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ items: await fetchCart(req.user.id) });
}
async function clearCart(req, res) {
    await supabase_1.supabase.from('cart_items').delete().eq('user_id', req.user.id);
    res.json({ items: [] });
}
//# sourceMappingURL=cartController.js.map