---
name: github-actions
description: Set up, configure, and manage GitHub Actions workflows. Automate CI/CD pipelines, testing, deployments, and custom automations.
---

# GitHub Actions

Automate workflows with GitHub Actions – CI/CD, testing, deployments, and more.

## Common Workflows

- **CI/CD** – Automated testing and deployment
- **Testing** – Run tests on every commit
- **Linting** – Code quality checks
- **Releases** – Automated versioning and publishing
- **Notifications** – Slack alerts, issue creation

## Workflow Structure

```yaml
name: Test and Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run build
```

## Popular Actions

- `actions/checkout` – Check out code
- `actions/setup-node` – Set up Node.js
- `actions/upload-artifact` – Store build outputs
- Third-party integrations – Slack, Discord, AWS, etc

## Use Cases

- Prevent broken code from merging
- Auto-deploy on push to main
- Generate release notes
- Run security scans
- Deploy to multiple environments

## Best Practices

- Keep workflows simple and focused
- Use reusable workflows for common patterns
- Cache dependencies for speed
- Store secrets in GitHub Secrets

Perfect for team automation!
