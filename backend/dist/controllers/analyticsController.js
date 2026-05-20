"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getSalesTimeline = getSalesTimeline;
exports.getInventory = getInventory;
exports.getEmployeePerformance = getEmployeePerformance;
exports.getSalesSummary = getSalesSummary;
exports.getCategoryInventory = getCategoryInventory;
exports.getCategorySales = getCategorySales;
const supabase_1 = require("../supabase");
async function getDashboardStats(_req, res) {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [allOrders, monthOrders, totalCount, pendingCount, lowStock, totalProducts, totalCustomers] = await Promise.all([
        supabase_1.supabase.from('orders').select('total_amount').not('status', 'eq', 'cancelled'),
        supabase_1.supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', monthStart)
            .not('status', 'eq', 'cancelled'),
        supabase_1.supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase_1.supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'placed'),
        supabase_1.supabase.from('variants').select('id', { count: 'exact', head: true }).lt('quantity', 5),
        supabase_1.supabase.from('products').select('id', { count: 'exact', head: true }).eq('published', true),
        supabase_1.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    ]);
    res.json({
        totalRevenue: allOrders.data?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0,
        revenueThisMonth: monthOrders.data?.reduce((s, o) => s + Number(o.total_amount), 0) ?? 0,
        totalOrders: totalCount.count ?? 0,
        pendingOrders: pendingCount.count ?? 0,
        lowStockVariants: lowStock.count ?? 0,
        totalProducts: totalProducts.count ?? 0,
        totalCustomers: totalCustomers.count ?? 0,
    });
}
async function getSalesTimeline(_req, res) {
    const { data, error } = await supabase_1.supabase.rpc('daily_sales_last_30_days');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
}
async function getInventory(req, res) {
    const { type, category } = req.query;
    let query = supabase_1.supabase
        .from('variants')
        .select(`
      id, color, size, quantity, sold_count,
      product:products(id, title, type, published,
        category:categories(id, name))
    `)
        .order('sold_count', { ascending: false });
    if (type)
        query = query.eq('product.type', type);
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    let filtered = data ?? [];
    if (type)
        filtered = filtered.filter((v) => v.product?.type === type);
    if (category)
        filtered = filtered.filter((v) => v.product?.category?.id === category);
    res.json(filtered);
}
// Per-employee offline-sales performance + top performer.
async function getEmployeePerformance(_req, res) {
    const { data: sales, error } = await supabase_1.supabase
        .from('offline_sales')
        .select('quantity, unit_price, sold_by, seller:profiles!sold_by(id, name)');
    if (error)
        return res.status(500).json({ error: error.message });
    const map = {};
    for (const s of sales ?? []) {
        const id = s.sold_by;
        if (!id)
            continue;
        const seller = s.seller;
        if (!map[id]) {
            map[id] = { id, name: seller?.name ?? 'Unknown', revenue: 0, itemsSold: 0, saleCount: 0 };
        }
        map[id].revenue += Number(s.unit_price) * Number(s.quantity);
        map[id].itemsSold += Number(s.quantity);
        map[id].saleCount += 1;
    }
    const employees = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    res.json({ employees, topPerformer: employees[0] ?? null });
}
// Online (web orders) vs offline (in-person) sales totals.
async function getSalesSummary(_req, res) {
    const [online, offline] = await Promise.all([
        supabase_1.supabase.from('orders').select('total_amount').not('status', 'eq', 'cancelled'),
        supabase_1.supabase.from('offline_sales').select('quantity, unit_price'),
    ]);
    const onlineRevenue = (online.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0);
    const offlineRevenue = (offline.data ?? []).reduce((s, o) => s + Number(o.unit_price) * Number(o.quantity), 0);
    res.json({
        onlineRevenue,
        offlineRevenue,
        totalRevenue: onlineRevenue + offlineRevenue,
        onlineCount: online.data?.length ?? 0,
        offlineCount: offline.data?.length ?? 0,
    });
}
// Stock left per category — sums variant quantities grouped by product category.
async function getCategoryInventory(_req, res) {
    const { data, error } = await supabase_1.supabase
        .from('variants')
        .select('quantity, product:products(category:categories(id, name))');
    if (error)
        return res.status(500).json({ error: error.message });
    const map = {};
    for (const v of data ?? []) {
        const cat = v.product?.category;
        const key = cat?.id ?? 'uncategorized';
        const name = cat?.name ?? 'Uncategorized';
        if (!map[key])
            map[key] = { id: key, name, itemsLeft: 0, variantCount: 0 };
        map[key].itemsLeft += Number(v.quantity);
        map[key].variantCount += 1;
    }
    res.json(Object.values(map).sort((a, b) => b.itemsLeft - a.itemsLeft));
}
async function getCategorySales(_req, res) {
    const { data, error } = await supabase_1.supabase
        .from('order_items')
        .select(`
      quantity, unit_price,
      product:products(type)
    `);
    if (error)
        return res.status(500).json({ error: error.message });
    const grouped = {};
    for (const item of data ?? []) {
        const type = item.product?.type ?? 'unknown';
        grouped[type] = (grouped[type] ?? 0) + item.quantity * item.unit_price;
    }
    res.json(Object.entries(grouped).map(([type, revenue]) => ({ type, revenue })));
}
//# sourceMappingURL=analyticsController.js.map