"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAuth = exports.supabase = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = require("dotenv");
const supabase_js_1 = require("@supabase/supabase-js");
// Load `.env` before reading `process.env`. With `tsx`, `import 'dotenv/config'` in
// `index.ts` can run *after* route modules are evaluated, so route imports may load
// this file first — load env here so variables are always available.
const envPaths = [(0, path_1.join)(process.cwd(), '.env'), (0, path_1.join)(__dirname, '..', '.env')];
for (const envPath of envPaths) {
    if (!(0, fs_1.existsSync)(envPath))
        continue;
    if ((0, fs_1.statSync)(envPath).size === 0) {
        throw new Error(`backend env file is empty: ${envPath}\nSave your variables to this file (or copy from .env.example), then restart.`);
    }
    (0, dotenv_1.config)({ path: envPath });
    break;
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.\n' +
        `Checked: ${envPaths.join(' and ')} — ensure one exists, is saved, and contains those keys.`);
}
// Service role client — full DB access, server-side only, NEVER exposed to any client.
// IMPORTANT: never call auth.signInWithPassword / signUp on this client. Doing so
// replaces its service-role credentials with a user session, which then makes every
// subsequent .from() query run as that user and fail RLS-protected reads.
exports.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
    global: {
        headers: { 'x-application-name': 'nanabanana-backend' },
    },
});
// Dedicated client for user sign-in / sign-up only. Kept separate so user sessions
// never poison the service-role client above.
exports.supabaseAuth = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});
//# sourceMappingURL=supabase.js.map