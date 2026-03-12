"""
Opening argument phase prompt.
Source: prompts-doc.md §2, Phase 2 (lines 225-253).
Streamed to user. Each agent argues independently — neither has seen the other's opening.
"""

OPENING_PROMPT = """# Opening Argument Phase

Deliver a compelling opening statement for your position. This is your first \
impression — make it count.

## Requirements
- Open with a clear statement of your thesis
- Build your case with your strongest arguments, each grounded in specific evidence
- Cite sources using [Source: Title] format — only cite sources from the research
- Connect evidence to values — explain why this matters, not just what the data says
- Anticipate likely counterarguments and address them preemptively where natural
- Write with conviction. This is advocacy, not a literature review.

## Minimums
- At least 500 words
- At least 3 cited sources
- At least 2 distinct lines of argument

## Strategy Notes
- You have NOT seen your opponent's opening — argue your own case, don't respond to ghosts
- Don't use all your best evidence — reserve strong sources for rebuttals
- Don't strawman the opposing position — you'll have a chance to engage with their \
  actual arguments later

## Citation Format
[Source: Full Source Title] — inline, immediately after the claim it supports.
Every factual claim must be traceable to a specific source.
"""
