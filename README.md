# Cloudflare Workers Status Page

[![Deploy Status](https://github.com/mdlew/cf-workers-status-page-typescript/actions/workflows/publish.yml/badge.svg)](https://github.com/mdlew/cf-workers-status-page-typescript/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A powerful, serverless status page application built with **TypeScript** and **React**, running on **Cloudflare Workers**. Monitor your websites and APIs with automated health checks, historical uptime data, and instant notifications via Slack or Discord.

**🔗 [Live Demo](https://status.lewlab.com/)**

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Advanced Features](#-advanced-features)
- [Workers KV Free Tier](#-workers-kv-free-tier)
- [Known Issues](#-known-issues)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## ✨ Features

- **🦄 TypeScript First** - Fully typed for enhanced developer experience
- **⚡ Serverless Architecture** - Built on Cloudflare Workers for global edge deployment
- **📊 Historical Data** - Track uptime with configurable history (default: 90 days)
- **🔔 Smart Notifications** - Instant alerts via Slack or Discord webhooks
- **📈 Response Time Monitoring** - Collect and display response time metrics
- **🌍 Remote CSV Monitors** - Import monitor configurations from Google Sheets
- **🚀 Unlimited Monitors** - No artificial limits, even on Workers KV free tier
- **♻️ Auto Cleanup** - Automatic garbage collection for KV storage optimization
- **🎨 Modern UI** - React-based interface with Tailwind CSS and SSR via Vike
- **⚙️ CRON Scheduling** - Automated health checks at customizable intervals

## 📦 Prerequisites

### Required

- **Node.js** (v20 or higher) and **pnpm** package manager
- **[Cloudflare Workers Account](https://dash.cloudflare.com/sign-up/workers)**
  - Workers domain configured
  - Workers Bundled subscription ($5/month) *or* Free tier ([see limitations](#-workers-kv-free-tier))
- **Cloudflare API Token** with `Edit Cloudflare Workers` permissions
  - Create at: [Cloudflare Dashboard > My Profile > API Tokens](https://dash.cloudflare.com/profile/api-tokens)
  - Use the "Edit Cloudflare Workers" template

### Optional

- **Slack Webhook URL** - For Slack notifications ([setup guide](https://api.slack.com/messaging/webhooks))
- **Discord Webhook URL** - For Discord notifications ([setup guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks))

## 🚀 Quick Start

### 1. Create Your Repository

Click the **"Use this template"** button at the top of this repository to create your own copy.

### 2. Create KV Namespace

Create a KV namespace in your Cloudflare account:

1. Go to [Cloudflare Dashboard > Workers & Pages > KV](https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces)
2. Click **"Create a namespace"**
3. Name it `KV_STORE` (or any name you prefer)
4. Copy the namespace ID
5. Update [wrangler.toml](./wrangler.toml):
   ```toml
   kv_namespaces = [ { binding = "KV_STORE", id = "your-namespace-id-here" } ]
   ```

### 3. Configure GitHub Secrets

Navigate to your repository **Settings > Secrets and variables > Actions** and add:

| Secret Name | Required | Description |
|------------|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Your Cloudflare account ID ([find it here](https://dash.cloudflare.com/)) |
| `CLOUDFLARE_API_TOKEN` | ✅ | API token with Workers edit permissions |
| `SECRET_SLACK_WEBHOOK_URL` | ❌ | Slack webhook for notifications |
| `SECRET_DISCORD_WEBHOOK_URL` | ❌ | Discord webhook for notifications |

### 4. Configure Monitors

Edit [src/config.ts](./src/config.ts) to customize your status page:

```typescript
export const config: Config = {
  settings: {
    title: 'My Status Page',
    url: 'https://status.example.com/',
    displayDays: 90,
    collectResponseTimes: true,
  },
  monitors: [
    {
      id: 'example-website',
      url: 'https://example.com/',
      name: 'Example Website',
      followRedirect: true,
    },
    // Add more monitors here
  ],
}
```

### 5. Deploy

Push your changes to the `master` branch:

```bash
git add .
git commit -m "Configure status page"
git push origin master
```

GitHub Actions will automatically build and deploy your status page! 🎉

### 6. Optional: Custom Domain

1. Go to [Cloudflare Dashboard > Workers & Pages](https://dash.cloudflare.com/?to=/workers)
2. Select your worker
3. Go to **Settings > Triggers > Routes**
4. Add a custom domain or route

## ⚙️ Configuration

### Monitor Configuration

Each monitor in [src/config.ts](./src/config.ts) supports the following options:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `id` | `string` | ✅ | Unique identifier for the monitor |
| `url` | `string` | ✅ | URL to monitor |
| `name` | `string` | ✅ | Display name for the monitor |
| `followRedirect` | `boolean` | ✅ | Whether to follow HTTP redirects |

### Settings Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `title` | `string` | - | Status page title |
| `url` | `string` | - | Public URL of your status page |
| `displayDays` | `number` | `90` | Number of days to display history |
| `collectResponseTimes` | `boolean` | `true` | Whether to collect response times |

### CRON Schedule

Edit the cron schedule in [wrangler.toml](./wrangler.toml):

```toml
[env.production.triggers]
crons = [
  "*/30 * * * *",  # Check every 30 minutes
]
```

Use [crontab.guru](https://crontab.guru/) to create custom schedules.

## 💻 Local Development

### Installation

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/your-username/cf-workers-status-page-typescript.git
   cd cf-workers-status-page-typescript
   pnpm install
   ```

3. **Authenticate with Cloudflare**:
   ```bash
   npx wrangler login
   ```

4. **Create KV namespace** (if not already created):
   ```bash
   npx wrangler kv:namespace create KV_STORE
   ```
   Copy the namespace ID to [wrangler.toml](./wrangler.toml).

### Development Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `pnpm install` | Install dependencies | ~16s |
| `pnpm run build` | Build the project | ~10s |
| `pnpm run preview` | Build and preview locally at http://localhost:3000 | ~15s startup |
| `pnpm run preview:production` | Preview in production mode | ~15s startup |
| `pnpm run deploy` | Deploy to Cloudflare Workers | ~30s |
| `pnpm run wrangler:types` | Generate TypeScript types from Wrangler | ~3s |

### Important Notes

- **⚠️ Do not use `pnpm run dev`** - It has a known issue with path-to-regexp dependency
- **✅ Use `pnpm run preview` instead** - This uses Wrangler dev mode which is fully functional
- **Build required** - Changes require a full build to be reflected
- **No hot reload** - Manual rebuild and restart needed for changes
- **React version sync** - `react` and `react-dom` versions must always match. A preinstall hook validates this automatically.

### Project Structure

```
cf-workers-status-page-typescript/
├── src/
│   ├── config.ts              # Main configuration file
│   ├── worker/
│   │   ├── index.ts           # Worker entry point
│   │   ├── cron/              # Scheduled monitoring logic
│   │   └── ssr/               # Server-side rendering
│   ├── pages/                 # React page components
│   └── components/            # Reusable React components
├── wrangler.toml              # Cloudflare Worker config
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🚢 Deployment

### Automatic Deployment (Recommended)

The project uses GitHub Actions for automatic deployment:

1. Push to the `master` branch
2. GitHub Actions automatically builds and deploys
3. Check deployment status in the Actions tab

### Manual Deployment

```bash
pnpm run deploy
```

Ensure you have the following configured:
- Cloudflare authentication (via `wrangler login`)
- Correct account ID in `wrangler.toml` or environment variables
- KV namespace created and configured

## 🎯 Advanced Features

### Remote CSV Monitors

You can import monitor configurations from a remote CSV file (e.g., Google Sheets):

1. Create a Google Sheet using [this template](https://docs.google.com/spreadsheets/d/1eNhgeS0ElQGFeaVLNJwFWI8JW-Ppv158necdqASJ6TY/edit?usp=sharing)
2. Publish it to the web: **File > Share > Publish to web**
3. Select the specific sheet and choose **Comma-separated values (.csv)**
4. Copy the URL and add it to [src/config.ts](./src/config.ts):
   ```typescript
   monitorsCsvUrl: 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv'
   ```
5. Uncomment the CSV update cron trigger in [wrangler.toml](./wrangler.toml)

### Response Time Collection

Enable response time tracking in [src/config.ts](./src/config.ts):

```typescript
settings: {
  collectResponseTimes: true,
}
```

Response times are displayed on the status page for each monitor.

### Notification Webhooks

Add webhook URLs as secrets in GitHub repository settings or Cloudflare Workers environment variables:

- **Slack**: `SECRET_SLACK_WEBHOOK_URL`
- **Discord**: `SECRET_DISCORD_WEBHOOK_URL`

Notifications are sent when a monitor's status changes (up ↔️ down).

## 🆓 Workers KV Free Tier

The Cloudflare Workers Free plan includes limited KV operations:
- **Read operations**: 100,000 per day
- **Write operations**: 1,000 per day
- **Storage**: 1 GB

**For free tier users**, adjust the monitoring frequency:

1. Edit [wrangler.toml](./wrangler.toml):
   ```toml
   crons = ["*/2 * * * *"]  # Check every 2 minutes instead of 30
   ```

2. Consider reducing the number of monitors or `displayDays` in config

The default 30-minute interval works well with the Bundled plan ($5/month).

**Reference**: [Cloudflare Workers KV Free Tier Announcement](https://blog.cloudflare.com/workers-kv-free-tier/)

## ⚠️ Known Issues

### KV Replication Lag
- **Issue**: Notifications arrive instantly, but status page updates may lag by a few seconds
- **Cause**: [CRON Triggers run on underutilized machines](https://blog.cloudflare.com/introducing-cron-triggers-for-cloudflare-workers/#how-are-you-able-to-offer-this-feature-at-no-additional-cost)
- **Impact**: Minimal; typically resolves within seconds

### Initial Delay (No Data)
- **Issue**: Status page shows "No Data" immediately after deployment
- **Cause**: CRON Triggers take a few minutes to initialize and run for the first time
- **Solution**: Wait 2-5 minutes after deployment for first data collection

### Development Server Issue
- **Issue**: `pnpm run dev` fails with "TypeError: Missing parameter name at 1" from path-to-regexp
- **Workaround**: Use `pnpm run preview` instead
- **Status**: Known issue with dependency compatibility

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

Please ensure your code:
- Follows the existing TypeScript style
- Includes appropriate type definitions
- Has been tested locally with `pnpm run preview`
- Doesn't break existing functionality

### Reporting Issues

Found a bug? Please [open an issue](https://github.com/mdlew/cf-workers-status-page-typescript/issues) with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (Node version, OS, etc.)

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2026 Matthew Lew

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

This project builds upon the excellent work of:

- **[yunsii/cf-worker-status-page-pro](https://github.com/yunsii/cf-worker-status-page-pro)** - Enhanced status page implementation
- **[eidam/cf-workers-status-page](https://github.com/eidam/cf-workers-status-page)** - Original inspiration and concept
- **[Vike](https://vike.dev/)** - SSR framework for React
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Serverless platform

Special thanks to the open-source community for making projects like this possible! 💙

---

**Made with ❤️ using Cloudflare Workers, React, and TypeScript**

[⬆ Back to top](#cloudflare-workers-status-page)
