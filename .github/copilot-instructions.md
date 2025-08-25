# Cloudflare Workers Status Page TypeScript

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

This is a TypeScript-based status page application that runs on Cloudflare Workers, monitoring websites and APIs with automated notifications. Built with React, Vike (SSR framework), and deployed serverlessly.

## Working Effectively

### Bootstrap and Setup
- Install pnpm package manager: `npm install -g pnpm`
- Install dependencies: `pnpm install` -- takes 16 seconds. NEVER CANCEL.
- Generate types: `pnpm run wrangler:types` -- takes 3 seconds.

### Build and Development
- Build the project: `pnpm run build` -- takes 10 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
  - This runs: wrangler types → TypeScript compilation → asset generation → Vike SSR build
- **CRITICAL**: Do NOT use `pnpm run dev` - it fails due to path-to-regexp dependency issue
- **Use instead**: `pnpm run preview` -- takes 15 seconds to start. NEVER CANCEL. Set timeout to 120+ seconds.
  - This builds the project and starts wrangler dev server on http://localhost:3000
- **Alternative for quick testing**: `pnpm run preview:production` for production mode testing

### Testing and Validation
- **MANUAL VALIDATION REQUIREMENT**: After making changes, ALWAYS manually validate by:
  1. Run `pnpm run build` to ensure no build errors
  2. Run `pnpm run preview` to start the application
  3. Visit http://localhost:3000 and verify the status page loads correctly
  4. Verify the page shows "No Data (X monitor(s))" initially (expected behavior)
  5. Check the footer shows "Powered by Cloudflare Workers & Vike"
- **No automated test suite exists** - rely on manual validation and build success
- **Pre-commit hooks**: The project uses husky with lint-staged, though no explicit linting configuration exists

### Deployment
- Deploy to production: `pnpm run deploy` -- requires Cloudflare API credentials
- **Required secrets** (set in GitHub repository settings):
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - `SECRET_DISCORD_WEBHOOK_URL` (optional)
- Deployment is automated via GitHub Actions on push to `master` branch

## Project Structure and Key Files

### Configuration Files
- `src/config.ts` - **MOST IMPORTANT**: Main configuration defining monitors, title, URL, display settings
- `wrangler.toml` - Cloudflare Worker configuration including KV namespaces and cron schedules
- `package.json` - Build scripts and dependencies
- `tsconfig.json` - TypeScript configuration with custom path mapping (#src/*)

### Core Application Files
- `src/worker/index.ts` - Main Cloudflare Worker entry point with fetch and scheduled handlers
- `src/worker/cron/` - Scheduled monitoring logic that checks website status
- `src/worker/ssr/` - Server-side rendering handling via Vike
- `src/pages/index/` - Main status page React components
- `dev-server/index.ts` - Express development server (problematic - don't use)

### Build and Assets
- `dist/` - Generated build output (client and server bundles)
- `scripts/public-assets.ts` - Script to generate static asset mappings
- `src/worker/static-assets/` - Static asset handling for the worker

## Common Tasks

### Adding a New Monitor
1. Edit `src/config.ts`
2. Add monitor object to the `monitors` array:
   ```typescript
   {
     id: 'unique-identifier',
     url: 'https://example.com',
     name: 'Display Name',
     followRedirect: true/false,
   }
   ```
3. Run `pnpm run build` and `pnpm run preview` to test

### Modifying the UI
1. Edit files in `src/pages/` or `src/components/`
2. The project uses React with TypeScript and Tailwind CSS
3. ALWAYS test changes with `pnpm run preview` after building

### Updating Worker Logic
1. Modify files in `src/worker/`
2. Key areas:
   - `src/worker/cron/` for monitoring logic
   - `src/worker/index.ts` for request handling
   - `src/worker/ssr/` for SSR configuration
3. Build and test with wrangler preview mode

### Deployment Configuration
1. **KV Namespace Setup**: Ensure `wrangler.toml` has correct KV namespace IDs
2. **Cron Schedule**: Modify cron triggers in `wrangler.toml` (default: every 30 minutes)
3. **Environment Variables**: Set secrets in Cloudflare Workers dashboard or GitHub repository

## Known Issues and Workarounds

### Development Server Issues
- **Problem**: `pnpm run dev` fails with "TypeError: Missing parameter name at 1" from path-to-regexp
- **Workaround**: Use `pnpm run preview` instead, which uses wrangler dev mode
- **Impact**: Slightly slower development cycle but fully functional

### Cloudflare Workers Limitations
- **Build Size**: Watch for bundle size when adding dependencies
- **KV Storage**: Free tier has limits - adjust cron frequency if needed (see `wrangler.toml`)
- **Network Access**: Some external APIs may not be accessible from worker environment

### First-Time Setup Requirements
- **Node.js**: Requires Node.js (project uses v20+)
- **Cloudflare Account**: Need Cloudflare Workers account with KV namespace created
- **Git**: Project uses husky for pre-commit hooks

## Timing Expectations
- **pnpm install**: ~16 seconds - NEVER CANCEL, set timeout 120+ seconds
- **pnpm run build**: ~10 seconds - NEVER CANCEL, set timeout 60+ seconds  
- **pnpm run preview startup**: ~15 seconds - NEVER CANCEL, set timeout 120+ seconds
- **pnpm run deploy**: ~30 seconds (varies with network) - NEVER CANCEL, set timeout 300+ seconds

## Validation Checklist
Before completing any code changes, ALWAYS verify:
- [ ] `pnpm run build` succeeds without errors
- [ ] `pnpm run preview` starts successfully
- [ ] Application loads at http://localhost:3000
- [ ] Status page displays correctly with expected content
- [ ] No console errors in browser developer tools
- [ ] If modifying monitors: config changes reflected in UI
- [ ] If modifying worker logic: cron/fetch behavior works as expected

## Important Notes
- **Always build before testing**: Changes require a full build to be reflected
- **Use wrangler preview**: The only reliable development mode
- **KV namespace dependency**: Application requires KV storage - ensure proper configuration
- **Serverless architecture**: Remember this runs on Cloudflare Workers, not traditional servers
- **No hot reload**: Changes require manual rebuild and restart