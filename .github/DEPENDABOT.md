# Dependabot Configuration Guide

This document explains the Dependabot configuration for this project and best practices for managing automated dependency updates.

## Overview

Dependabot is configured to automatically:
- Check for dependency updates weekly (every Monday at 09:00 UTC)
- Create pull requests for outdated dependencies
- Group related updates to reduce PR noise
- Auto-merge safe updates (patch and minor versions)
- Flag major updates for manual review

## Configuration Files

### `.github/dependabot.yml`

This is the main configuration file that controls Dependabot's behavior:

- **NPM Dependencies**: Monitors `package.json` and `pnpm-lock.yaml`
- **GitHub Actions**: Monitors workflow files for action updates

### `.github/workflows/dependabot-auto-merge.yml`

This workflow automates the merge process for safe dependency updates:

- **Patch updates** (`1.0.0` → `1.0.1`): Commented for manual merge
- **Minor updates** (`1.0.0` → `1.1.0`): Commented for manual merge
- **Major updates** (`1.0.0` → `2.0.0`): Require manual review

## Key Features

### 1. Dependency Grouping

To reduce notification noise, related dependencies are grouped together:

**NPM Dependencies:**
- **Development dependencies** (patch & minor): Grouped into one PR
- **Production dependencies** (patch & minor): Grouped into one PR
- **Major updates**: Individual PRs for careful review

**GitHub Actions:**
- All action updates: Grouped into one PR

This means instead of receiving 10+ individual PRs, you'll receive 2-3 grouped PRs per week.

### 2. PR Management

- **Open PR Limit**: Max 10 NPM PRs and 5 GitHub Actions PRs at once
- **Prevents overwhelming**: Maintains a manageable number of open PRs
- **Smart scheduling**: Weekly updates on Monday mornings

### 3. Commit Message Convention

All Dependabot commits follow a consistent format:

```
chore(deps): update dependencies
chore(deps-dev): update development dependencies
chore(ci): update github actions
```

This makes it easier to:
- Track dependency changes in git history
- Generate changelogs automatically
- Filter commits by type

### 4. Auto-Merge Strategy

The auto-merge workflow has three behaviors:

**Comment for review (patch & minor):**
```
💬 Commented with guidance for manual review and merge
```

**Manual review (major):**
```
⚠️ Comment added: "Major version update detected - please review"
🏷️ Labeled: "major-update"
```

**Labeling:**
- `major-update`: Major version changes
- `minor-update`: Minor version changes
- `patch-update`: Patch version changes
- `dependencies`: All dependency updates
- `npm` or `github-actions`: Ecosystem type

### 5. Rebase Strategy

Set to `auto` - Dependabot will automatically rebase PRs when the base branch changes. This keeps PRs up-to-date and reduces merge conflicts.

## Best Practices

### For Maintainers

1. **Review Major Updates Carefully**
   - Check release notes and changelogs
   - Look for breaking changes
   - Test locally before merging
   - Use the project's test suite

2. **Monitor Security Alerts**
   - Dependabot creates PRs for security vulnerabilities immediately
   - These are labeled with `security` by GitHub
   - Prioritize reviewing and merging security updates

3. **Keep CI Green (Optional)**
   - When CI checks are configured and marked as required, auto-merge only proceeds after they pass
   - Ensure your test suite covers critical paths
   - Fix failing tests promptly

4. **Customize When Needed**
   - Uncomment `reviewers` and `assignees` in `dependabot.yml`
   - Add specific dependencies to `ignore` list if needed
   - Adjust schedule timing based on your workflow

### For Contributors

1. **Don't Manually Update Dependencies**
   - Let Dependabot handle routine updates
   - Only update manually if you need a specific version immediately

2. **Respect Grouped Updates**
   - Don't cherry-pick individual packages from grouped PRs
   - Test the entire group together

3. **React Version Synchronization**
   - This project enforces matching `react` and `react-dom` versions
   - The preinstall hook will fail if versions don't match
   - Dependabot's `react` group configuration (see `.github/dependabot.yml`) ensures these packages are always updated together

## Troubleshooting

### Dependabot PRs Not Auto-Merging

**Possible causes:**
1. CI checks are failing
2. Conflicts with base branch
3. Major version update (requires manual review)
4. PR was manually modified (disables auto-merge)

**Solution:** Review the PR checks and merge manually if appropriate.

### Too Many PRs

**If you're receiving too many Dependabot PRs:**
1. Lower `open-pull-requests-limit` in `dependabot.yml`
2. Adjust grouping to be more aggressive
3. Change schedule to less frequent (e.g., monthly)

### Ignoring Specific Dependencies

Add to the `ignore` section in `dependabot.yml`:

```yaml
ignore:
  - dependency-name: "package-name"
    update-types: ["version-update:semver-major"]
  - dependency-name: "another-package"
    versions: ["1.x", "2.x"]
```

### Security-Only Updates

If you want to limit Dependabot to only security updates:

```yaml
- package-ecosystem: "npm"
  directory: "/"
  schedule:
    interval: "weekly"
  open-pull-requests-limit: 0  # Disable version updates
```

Then enable security updates in repository settings:
`Settings > Security > Dependabot > Dependabot security updates`

## Additional Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Configuration Options](https://docs.github.com/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [About Dependabot Security Updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates)
- [Auto-merge Dependabot PRs](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions)

## Verification

To verify your Dependabot configuration:

1. **Check Configuration Syntax**
   - GitHub will show a validation error if syntax is wrong
   - Visit: `https://github.com/[OWNER]/[REPO]/network/updates`
   - Replace `[OWNER]` and `[REPO]` with your repository details

2. **View Dependabot Status**
   - Go to: Repository → Insights → Dependency graph → Dependabot
   - See last check time and any errors

3. **Test Auto-Merge**
   - Wait for next Dependabot PR
   - Verify it has auto-merge enabled (if patch/minor)
   - Check that labels are applied correctly

## Summary

This Dependabot configuration balances automation with safety:

✅ **Automated**: Routine patch and minor updates  
🔍 **Manual Review**: Major version updates and breaking changes  
📦 **Organized**: Grouped PRs reduce noise  
🔒 **Secure**: Immediate security update PRs  
🏷️ **Labeled**: Easy to filter and manage  
📅 **Scheduled**: Predictable update cadence

By following these practices, you can keep dependencies up-to-date while minimizing maintenance burden and reducing security risks.
