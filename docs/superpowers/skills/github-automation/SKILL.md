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

## Implementation Phase
Once an issue is accepted, follow the standard development cycle:

1. **Plan Review:** Present a concise implementation plan and wait for user approval.
2. **Branching:** Create a branch `issue-<ID>-<short-description>`.
3. **Execution:** Use `subagent-driven-development` or `executing-plans`.
4. **Safety Verification:** Run `grep -riE "api_key|token|secret|password" .` on staged changes before committing.
