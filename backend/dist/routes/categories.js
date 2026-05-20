"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const supabase_1 = require("../supabase");
const auth_1 = require("../middleware/auth");
const storageService_1 = require("../services/storageService");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// List categories. ?topLevel=true returns only roots; ?parentId=<id> returns one parent's children.
router.get('/', async (req, res) => {
    let query = supabase_1.supabase.from('categories').select('*').order('name');
    if (req.query.parentId) {
        query = query.eq('parent_id', req.query.parentId);
    }
    else if (req.query.topLevel === 'true') {
        query = query.is('parent_id', null);
    }
    const { data, error } = await query;
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
router.get('/:slug', async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .select('*')
        .eq('slug', req.params.slug)
        .single();
    if (error)
        return res.status(404).json({ error: 'Category not found' });
    res.json(data);
});
router.post('/', auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('image'), [(0, express_validator_1.body)('name').trim().notEmpty()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { name, description, parent_id } = req.body;
    const slug = req.body.slug?.trim() || slugify(name);
    let image_url = req.body.image_url || undefined;
    if (req.file) {
        image_url = await (0, storageService_1.uploadImage)(req.file.buffer, req.file.originalname, 'category-images');
    }
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .insert({ name, slug, description, image_url, parent_id: parent_id || null })
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});
router.patch('/:id', auth_1.authenticate, auth_1.requireApprovedEmployee, upload.single('image'), async (req, res) => {
    const { name, slug, description, parent_id } = req.body;
    const updates = {};
    if (name)
        updates.name = name;
    if (slug)
        updates.slug = slug;
    if (description !== undefined)
        updates.description = description;
    if (parent_id !== undefined) {
        if (parent_id === req.params.id) {
            return res.status(400).json({ error: 'A category cannot be its own parent' });
        }
        updates.parent_id = parent_id || null;
    }
    if (req.file) {
        updates.image_url = await (0, storageService_1.uploadImage)(req.file.buffer, req.file.originalname, 'category-images');
    }
    else if (req.body.image_url !== undefined) {
        updates.image_url = req.body.image_url || null;
    }
    const { data, error } = await supabase_1.supabase
        .from('categories')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .single();
    if (error)
        return res.status(400).json({ error: error.message });
    res.json(data);
});
router.delete('/:id', auth_1.authenticate, auth_1.requireApprovedEmployee, async (req, res) => {
    const { error } = await supabase_1.supabase
        .from('categories')
        .delete()
        .eq('id', req.params.id);
    if (error)
        return res.status(400).json({ error: error.message });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=categories.js.map