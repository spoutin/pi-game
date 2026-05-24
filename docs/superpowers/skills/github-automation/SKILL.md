---
name: github-automation
description: Use when you need to process, triage, and implement GitHub issues through PR creation.
---

# GitHub Automation

## Overview
This skill provides a structured workflow for managing GitHub issues—from triage to implementation and PR creation. It emphasizes project alignment, collaborative communication, and strict safety guardrails to protect the system and codebase.

## Triage Workflow
Triage is performed using a "Collaborative" model:

1. **Discovery:**
   * Run `gh issue list --limit 10` to see active issues.
   * Run `gh issue view <ID>` to analyze specific issues.

2. **Analysis:**
   * Check `agent.md` for project roadmap alignment.
   * Verify technical feasibility within the current architecture.
   * Identify missing info (reproduction steps, browser/OS, specific goals).

3. **Interaction & State:**
   * **Accept:** 
     * Comment: "I've triaged this and it aligns with our roadmap. I'll begin implementation shortly."
     * Command: `gh issue edit <ID> --add-label "triaged","in-progress"`
   * **Inquire:**
     * Comment: "Thanks for the report! Could you please provide [specific detail] so I can look into this further?"
     * Command: `gh issue edit <ID> --add-label "needs-info"`
   * **Reject:**
     * Comment: "While this is a valid suggestion, it currently falls outside the scope of our project goals as defined in agent.md. Closing for now."
     * Command: `gh issue close <ID> -c "Closing per triage decision"`

## Delivery Phase
1. **Push:** Push the local branch to origin.
2. **PR Creation:**
   * Command: `gh pr create --body "Closes #ID" --label "ready-for-review"`
   * Verify "Closes #ID" is in the body to ensure automatic closure of the issue.

## Merging Phase (Automated)
1. **Verification:**
   * Command: `gh pr checks <PR_NUMBER>`
   * **If checks pass:** Proceed to merge.
   * **If no checks exist:** Notify user: *"No CI checks detected. Proceeding with merge after local verification."*
   * **If checks fail:** Stop and request manual intervention.
2. **Merge:**
   * Command: `gh pr merge <PR_NUMBER> --squash --delete-branch`
3. **Audit:**
   * Log the merge action to the audit log.

## Safety & Audit Trail
* **Hard Boundary:** All commands MUST be relative to the project root. Absolute paths outside the project are forbidden.
* **Secret Scanning:** REQUIRED before push: `grep -riE "api_key|token|secret|password" .` on staged changes.
* **Audit Log:** Write every action to `docs/superpowers/automation-audit.log`.
  * Format: `[YYYY-MM-DD HH:MM:SS] <ACTION> - <DETAILS>`
* **Verification Gates:** 
  * MUST get approval for implementation plan.
  * MUST summarize file deletions/renames before PR creation.
  * MUST provide a "Merge Summary" and get final approval before executing `gh pr merge`.
