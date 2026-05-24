# Design Doc: GitHub Automation Skill (Updated)

## Overview
This skill enables an AI agent to autonomously manage the lifecycle of GitHub issues for the `pi-game` project. It covers triaging issues, updating them with decisions, implementing accepted changes, creating linked Pull Requests (PRs), and automated merging.

## Goals
- Automate issue triaging based on completeness, strategic alignment, and technical feasibility.
- Maintain a clear, collaborative communication style with issue reporters.
- Ensure high code quality and safety through mandatory verification gates and system isolation.
- Link PRs to issues using standard GitHub syntax for automatic closure.
- **Automate merging** of PRs once CI checks pass (or after local verification if no CI exists).

## Workflow

### 1. Triage Phase
- **Fetch:** List open issues using `gh issue list`.
- **Analyze:** Compare issue content against `agent.md` and current codebase.
- **Decision:**
    - **Accept:** Comment and add `triaged`, `in-progress` labels.
    - **Request Info:** Comment asking for specific missing details, add `needs-info` label.
    - **Reject:** Comment with explanation and close the issue.

### 2. Implementation Phase
- **Plan:** Present a concise implementation plan for user approval.
- **Branch:** Create `issue-<ID>-<short-description>`.
- **Develop:** Implement changes following TDD and project conventions.
- **Verify:** Run linting, tests, and a secret-scanning grep on staged changes.

### 3. Delivery Phase
- **Push:** Push the branch to origin.
- **PR:** Create PR with `gh pr create --body "Closes #ID" --label "ready-for-review"`.

### 4. Merging Phase (Automated)
- **CI Check:** Run `gh pr checks <PR_NUMBER>`.
    - If checks pass: Proceed to merge.
    - If no checks exist: Notify user and proceed to merge after confirmation.
    - If checks fail: Stop and request manual intervention.
- **Merge:** Execute `gh pr merge <PR_NUMBER> --squash --delete-branch`.
- **Verify:** Ensure PR is marked as merged and branch is deleted.

## Checks & Balances (Safety)
- **Hard Isolation:** No commands or paths allowed outside the project root. No `sudo` or global configuration changes.
- **Secret Protection:** Automated pre-commit scan for `api_key`, `secret`, `token`, etc.
- **Audit Trail:** Log all actions to `docs/superpowers/automation-audit.log`. **MUST** be added to `.gitignore`.
- **Verification Gates:** Mandatory user approval for implementation plans and a final "Merge Summary" before merging.

## Failure Handling
- **Conflicts:** Abort and notify user if merge conflicts occur.
- **CI Failures:** Attempt one round of automated fixes for linting/simple test failures before requesting manual intervention.
