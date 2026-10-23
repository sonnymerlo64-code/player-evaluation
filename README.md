# GAME MGR — Player Development

A standalone, responsive player evaluation app for baseball coaches.

## Features
- CSV roster import and manual player entry, grouped by team/age
- Editable scoring library: Offense, Defense, Character (attitude, effort, body language)
- 1–5 scores, practice/game/tryout evaluations, coach notes
- Historical evaluations, first-vs-latest skill changes, category trend bars
- Individual goals, drills/actions, success measures and review dates
- Print/save PDF progress reports through browser printing
- Supabase email/password login and shared data between signed-in coaches

## Deploy to GitHub and Vercel
1. Create a **new GitHub repository** (do not overwrite the current GAME MGR or calendar repo).
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
