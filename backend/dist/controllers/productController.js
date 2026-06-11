"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.publishProduct = publishProduct;
exports.unpublishProduct = unpublishProduct;
exports.deleteProduct = deleteProduct;
exports.addProductImage = addProductImage;
exports.deleteProductImage = deleteProductImage;
const supabase_1 = require("../supabase");
const productSelect = `
  *,
  category:categories(id, name, slug),
  images:product_images(id, url, color, is_primary, display_order, alt_text),
  variants(id, color, size, quantity, sold_count, sku, image_url)
`;
async function getAllProducts(req, res) {
    const { type, category, search, minPrice, maxPrice, page = '1', limit = '20', published, sort } = req.query;
    let query = supabase_1.supabase
        .from('products')
        .select(productSelect, { count: 'exact' });
    if (published !== 'all')
        query = query.eq('published', true);
    if (type) {
        // Accepts one or more (comma-separated) product types.
        const typeArr = type.split(',').map((t) => t.trim()).filter(Boolean);
        query = query.in('type', typeArr);
    }
    if (category) {
        // Accepts one or more (comma-separated) category ids. A top-level category
        // match also includes products in its sub-categories.
        const catParam = category.split(',').map((c) => c.trim()).filter(Boolean);
        const { data: subCats } = await supabase_1.supabase
            .from('categories')
            .select('id')
            .in('parent_id', catParam);
        const catIds = [...catParam, ...(subCats ?? []).map((c) => c.id)];
        query = query.in('category_id', catIds);
    }
    if (search)
        query = query.ilike('title', `%${search}%`);
    if (minPrice)
        query = query.gte('base_price', +minPrice);
    if (maxPrice)
        query = query.lte('base_price', +maxPrice);
    if (sort === 'price_asc')
        query = query.order('base_price', { ascending: true });
    else if (sort === 'price_desc')
        query = query.order('base_price', { ascending: false });
    else
        query = query.order('created_at', { ascending: false });
    query = query.range((+page - 1) * +limit, +page * +limit - 1);
    const { data, error, count } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({
        data,
        count,
        total: count,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil((count ?? 0) / +limit),
    });
}
async function getProductById(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('products')
        .select(productSelect)
        .eq('id', req.params.id)
        .single();
    if (error)
        return res.status(404).json({ error: 'Product not found' });
    res.json(data);
}
async function createProduct(req, res) {
    const { title, description, type, category_id, base_price, discount_pct, coupon_code, coupon_disc } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('products')
        .insert({
        title,
        description,
        type,
        category_id: category_id || null,
        base_price,
        discount_pct: discount_pct ?? 0,
        coupon_code: coupon_code || null,
        coupon_disc: coupon_disc || null,
        created_by: req.user.id,
        published: false,
    })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
}
async function updateProduct(req, res) {
    const allowed = ['title', 'description', 'type', 'category_id', 'base_price', 'discount_pct', 'coupon_code', 'coupon_disc'];
    const updates = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    const { data, error } = await supabase_1.supabase
        .from('products')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
}
async function publishProduct(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('products')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
}
async function unpublishProduct(req, res) {
    const { data, error } = await supabase_1.supabase
        .from('products')
        .update({ published: false, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
}
async function deleteProduct(req, res) {
    const { error } = await supabase_1.supabase.from('products').delete().eq('id', req.params.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
}
async function addProductImage(req, res) {
    const { url, alt_text, is_primary, color, display_order } = req.body;
    const { product_id } = req.params;
    if (is_primary) {
        await supabase_1.supabase
            .from('product_images')
            .update({ is_primary: false })
            .eq('product_id', product_id);
    }
    const { data, error } = await supabase_1.supabase
        .from('product_images')
        .insert({ product_id, url, alt_text, is_primary: !!is_primary, color, display_order: display_order ?? 0 })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
}
async function deleteProductImage(req, res) {
    const { product_id, image_id } = req.params;
    const { error } = await supabase_1.supabase
        .from('product_images')
        .delete()
        .eq('id', image_id)
        .eq('product_id', product_id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
}
//# sourceMappingURL=productController.js.map