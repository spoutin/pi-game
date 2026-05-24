---
name: github-automation
description: Use when you need to process, triage, and implement GitHub issues through PR creation.
---

# GitHub Automation

## Overview
This skill provides a structured workflow for managing GitHub issues—from triage to implementation and PR creation. It emphasizes project alignment, collaborative communication, and strict safety guardrails to protect the system and codebase.

## Triage Logic
Triage is performed using a "Collaborative" model:
1. **Analyze:** Fetch issue details (`gh issue view`) and compare against `agent.md` and current code.
2. **Decision Criteria:**
    * **Completeness:** Does it have reproduction steps/clear intent?
    * **Alignment:** Does it match the roadmap in `agent.md`?
    * **Feasibility:** Is the technical approach sound?
3. **Interaction:**
    * **Accept:** Add `triaged` label and start implementation.
    * **Inquire:** Add `needs-info` label and request missing details.
    * **Reject:** Politely explain and close the issue.
