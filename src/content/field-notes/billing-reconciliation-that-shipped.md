---
title: "An AI workflow that actually shipped: billing reconciliation at a freight forwarder"
date: 2026-05-20
pillar: "AI that shipped"
summary: "Most “AI initiatives” die as a pilot nobody uses. Here’s the anatomy of one that made it into production at an $8M freight forwarder — and why it stuck."
---

Most AI in business right now is shelfware. Seats bought, a few people poking at a chat window, nothing in a production workflow. The gap between "we have AI" and "AI does real work here" is where almost every initiative dies.

This is a build log for one that didn't.

## The situation

An $8M freight forwarder. Billing and reconciliation ran on people re-keying numbers between systems every week — matching invoices to shipments, catching exceptions by eye, reconciling at month-end in a scramble that ate senior hours. Classic founder-led-company tax: the work got done because good people forced it through, not because a system did it.

The temptation is to "add AI" to the whole mess. That's how you get a pilot nobody trusts. We didn't do that.

## What was actually broken

Not the people. The *loop*. Three things, specifically:

1. **No source of truth.** Two systems disagreed and a human arbitrated every time.
2. **Exceptions were invisible until downstream.** Errors surfaced after they'd already cost something.
3. **The work didn't scale.** More volume meant more re-keying, linearly.

A reconciliation workflow is a genuinely good fit for an AI system because the task is bounded, the rules are knowable, and the exceptions — not the matches — are where the human judgment actually belongs.

## What got built

One workflow, in production, doing one job: ingest both sides, match what matches, and surface only the exceptions to a human with the context to resolve them. The team stopped re-keying. They started reviewing.

The part that made it *stick* wasn't the model. It was that we put the human exactly where humans are good — judgment on exceptions — and took them out of where they were wasted — copying numbers. Adoption followed because the workflow made their week better, not because anyone mandated it.

## What moved

Manual reconciliation hours collapsed, and month-end stopped being a fire drill. More importantly: the loop now scales with volume instead of against it.

## The pattern, if you want to steal it

- Don't "add AI." Find the single highest-burn, most-bounded manual loop and replace *that*.
- Keep the human on exceptions, not on the conveyor belt.
- Ship it into the real workflow or it doesn't count. A pilot nobody depends on is a demo, not a system.

If your team is burning 10+ hours a week on re-keying, reports, or reconciliation, that's not a staffing problem. It's an un-built system. [Score where your AI leverage actually stands →](/tools/revenue-engine-check)
