# Player Evaluation

A standalone, responsive player evaluation app for baseball coaches.

## Features
- CSV roster import and manual player entry, grouped by team/age\n- Edit existing players without losing evaluations; improved CSV character encoding handling
- Editable scoring library: Offense, Defense, Character (attitude, effort, body language)
- MLB-style 1–8 scouting scores, practice/game/tryout evaluations, coach notes
- Saved evaluations can be reopened and edited; historical score comparisons and category trends recalculate automatically
- Suggested improvement plans auto-fill from low-scoring evaluation criteria, can be edited and saved for later access
- Print/save PDF progress reports through browser printing
- Supabase email/password login and shared data between signed-in coaches

## Deploy to GitHub and Vercel
1. Create a **new GitHub repository** (use the player-evaluation repository).
2. Upload `index.html`, `app.js`, `vercel.json`, and `schema.sql` to the repo root.
3. Create a **new Supabase project**. In SQL Editor, run `schema.sql`.
4. In Supabase Authentication → Users, create accounts for the coaches who need access.
5. Import the GitHub repository into Vercel and deploy. Framework preset: **Other**; root directory: repository root.
6. Open the deployed site. Enter your Supabase Project URL and **publishable/anon** key (Settings → API Keys). Never use a secret/service-role key in the browser.
7. Sign in. Enter a shared organization code. Coaches using the same code will see the same rosters and evaluations.

## Important security limitation
This is an **internal coaching-team MVP**, not a commercial multi-tenant app. `schema.sql` permits all authenticated users of this Supabase project to access every organization's data. The organization code is a filter, **not an access-control boundary**. Only invite trusted coaches into a dedicated project. Before selling to outside organizations, add organization membership tables, invite/role management, and membership-based RLS policies. Protect player data and follow your organization's youth-data policies.

## Notes
- CSV columns: `First Name, Last Name, Team, Jersey Number` or `Name, Team, Jersey Number`.
- Data is stored in Supabase, not in the browser. Configuration values (public URL and public key) are stored in local browser storage.
- The initial criterion library is seeded when a coach first opens a new organization. Additional custom criteria can be added or disabled.
- This version has no paid subscriptions, player/parent portal, automated reminders or automatic plan generation. Coaches write measurable improvement plans based on saved evaluations.

## Scoring note
The interface now uses an MLB-style 1–8 scale. Previously saved 1–5 ratings are preserved as entered; they are not automatically converted. For accurate trends, re-evaluate or edit earlier ratings using the new scale.

## V5: Editable default improvement steps
Each focus skill generates five editable steps based on its Offense, Defense, or Character category. Coaches can add, delete, reorder, and edit steps. Saved steps are serialized into the existing `pd_plans.actions` text field, so no database migration is required. Older free-text plans remain editable.

## V6: Printable improvement plans
Each saved plan includes Print / Save PDF. Print output is a clean US Letter portrait sheet with player/team, focus skill, goal, numbered development steps, success measure, review date, and signature lines. Use the browser print dialog to print or save as PDF.

## V7 Progressive Evaluation & Dropdown Response Library

1. Run `migration-v7.sql` once in the SAME Supabase project as the app.
2. Uncomment the final SQL insert, replacing `YOUR_ORGANIZATION_CODE` with the exact code used in the app, to grant the administrator permission to maintain shared response options. Do not expose a service-role key in the browser.
3. Upload `index.html`, `app.js`, and `vercel.json` to the existing GitHub repository. Keep `schema.sql` as reference; do not rerun it.
4. Test a NEW evaluation before editing important existing records.

Levels 1–4 progressively reveal more criteria; existing scores and evaluations are preserved. Each skill offers three separate multi-select lists for strengths, improvements, and recommended drills, plus coach-specific notes. Organization-wide response overrides are stored in Supabase, while a built-in category-based library is available immediately. An administrator may add or disable shared options; coaches may select options and write individual notes. Structured observations are saved to `pd_evaluations.observations`, and recommended drills from the lowest-scoring skill populate the editable improvement plan.

**Known limitations:** Level depth is presently based on the first 2, 4, or all active skills per category, rather than a configurable level-to-skill mapping. Shared response editing adds/disables options; editing text in place requires adding a replacement and disabling the old option. The existing project's original organization RLS policies are permissive for authenticated users and must be hardened before use across separate organizations. Browser-side multi-select uses Command-click on Mac to choose multiple items. Existing V6 printable improvement plans are retained. Live Supabase and Vercel integration tests have not been performed.


## V8 automatic database connection (no repeated coach setup)

The app fetches public configuration from `/api/public-config` at startup and connects automatically. The endpoint reads Vercel environment variables. This requires **one administrator setup** in Vercel Project → Settings → Environment Variables:

- `SUPABASE_URL`: the existing project's URL, `https://<project-ref>.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY`: the existing project's **publishable** key (`sb_publishable_...`) or legacy public anon key; **never** use a secret/service-role key.

Choose Production (and Preview if needed), save both, then redeploy. The Vercel runtime exposes only these intended public credentials to the browser. Do not paste them into GitHub or screenshots. Supabase Row Level Security must remain enabled and properly restricted.

Existing browser-stored connection information is used as a fallback for the administrator if the Vercel configuration is missing. On new devices, the app will not be able to connect until the environment variables are set. No database schema changes are needed for the connection fix. If V7 was not yet migrated, run `migration-v7.sql` before using its new features.

## V9: Category and compact dropdown fix
- Correctly filters criteria by each metric's saved category. Attitude appears under Character, not Offense.
- Shows separate compact expandable Strengths / Areas for Improvement / Recommended Drills checkbox pickers for each skill, with multiple selections and a selected count.
- Provides skill-specific defaults; custom responses from the Supabase library are appended.
- Keeps the existing database, organization `fca-baseball`, V7 migration, saved scores, evaluations, improvement plans and automatic Supabase configuration.
- Upload index.html and app.js to GitHub (plus other files only if not already deployed). No new SQL migration needed.
- Note: Existing miscategorized metrics in Supabase are not automatically reclassified. If a metric has an incorrect `category` value in `pd_metrics`, correct that record in the app's category library or database.
