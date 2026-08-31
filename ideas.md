# TEDx Thyna — Design Direction

## Three possible directions

### Theme Name: Redacted Noir
**Very Brief Intro:** A cinematic classified dossier experience where crimson light cuts through near-black editorial space. The tone is intelligent, restrained and investigative rather than cartoonish, making the visitor feel like they have accessed a living case file.

**Probability:** 0.073

### Theme Name: Brutalist Signal Room
**Very Brief Intro:** A stark typographic control room built from oversized numerals, hard rules, red status lights and asymmetrical information blocks. It feels urgent, modern and institutional, with the conference treated as a high-value signal.

**Probability:** 0.021

### Theme Name: Brass After Hours
**Very Brief Intro:** A warm underground salon with smoked paper, dark wood, muted brass and selective crimson accents. The emotional intent is intimate and prestigious, positioning TEDx Thyna as a rare invitation into a circle of thoughtful people.

**Probability:** 0.008

## Selected approach: Redacted Noir

### Design Movement
Contemporary cinematic editorialism with neo-noir photography, classified intelligence interfaces and luxury magazine art direction.

### Core Principles
1. **Reveal, never dump:** Information enters in stages like evidence being uncovered.
2. **Black is the canvas, red is the signal:** Crimson marks attention, action, status and narrative transitions; it never floods the page.
3. **Editorial asymmetry:** Sections use offset columns, dossier rails, pinned labels and long horizontal rules instead of repetitive centered cards.
4. **Every detail earns its place:** Grain, scan lines, stamps, cursor states and motion reinforce investigation or hierarchy.

### Color Philosophy
Near-black gives the visitor the feeling of entering a sealed archive. Off-white carries the authority of editorial print. Crimson is reserved for the moment the system wants attention: a scan, a link, a status, a CTA or a clue. Muted brass appears only as a physical trace of the organization—paper clips, file edges and clearance labels—so it reads as material, not decoration.

**Palette:** #050505, #0A0A0C, #E5092F, #720016, #F5F5F5, #9B9892, #B18B54.

### Layout Paradigm
A cinematic vertical timeline rather than a conventional landing-page stack. The left rail behaves like a case index, while the main content moves through large scene changes: access, investigation, organization, minds, scene and mission. Wide media panels, sticky evidence boards and offset text blocks create the sensation of moving through a film set.

### Signature Elements
- A persistent red case rail with changing file numbers and a live progress marker.
- Thin scanning lines and micro-stamps such as `STATUS: ACTIVE`, `CLEARANCE: OPEN` and `CASE Nº: TX-2026`.
- Dossier cards with redacted contact states that reveal only on deliberate interaction.

### Interaction Philosophy
Interaction should feel like handling evidence. Hovering sharpens, scans and exposes; clicking opens a file; scrolling advances the investigation. Nothing should jump without a visual reason. Buttons respond with magnetic pull and a controlled red fill, while keyboard focus remains visible and respected.

### Animation
The opening uses a short, skippable sequence with typewriter lines, a single red sweep and a forward zoom into the hero. Section entrances use opacity, translate and clip-path reveals with staggered timing. Cards use subtle 3D tilt and cursor-following light only when motion is allowed. Use transform and opacity for performance, avoid perpetual noise, and honor `prefers-reduced-motion` by switching to immediate fades and static backgrounds.

### Typography System
Display: **Space Grotesk** with 500–700 weights for headlines and event statements. Body: **DM Sans** for calm, modern readability. Investigation metadata: **IBM Plex Mono** with tracking and uppercase labels. Headlines are compact and editorial, body copy is never set too narrow, and mono labels are used sparingly as an interface layer.

### Brand Essence
**TEDx Thyna is a high-trust ideas gathering for curious people in Sfax who want to inspect the forces shaping the future—not simply watch a conference.** Personality: **discreet, incisive, magnetic**.

### Brand Voice
Headlines are declarative, cinematic and slightly enigmatic. CTAs are active invitations, not generic conversion language. Microcopy sounds like a live system with human judgment behind it.

Example lines:
- “The file is open. The questions are yours.”
- “Follow the signal →”

### Wordmark & Logo
The wordmark uses a compact uppercase lockup with a deliberate split between `TEDx` and `THYNA`, separated by a thin crimson rule. The symbol is a sharp geometric intersection inspired by a compass signal and a classified file tab; it is used alone at large scale in the intro and header rather than shrinking into a generic favicon.

### Signature Brand Color
**Thyna Crimson — #E5092F.** It is bright enough to feel like an active signal against the archive-black canvas, but precise enough to remain premium when used only for moments of consequence.

## Implementation guardrails

- Use the provided visual assets for hero, investigation board and theatre scene; do not repeat the same image across unrelated sections.
- Keep the design dark, editorial and sophisticated; avoid cartoon mafia motifs, blood, guns, skulls, Halloween styling and generic neon cyberpunk treatments.
- Use live interactions for the intro, nav, dossiers, team contact reveal, investigation board, countdown and registration states.
- Keep placeholders honest: speaker records show “CLASSIFIED / TO BE REVEALED” until real speaker data is available, and the event date remains “DATE TO BE ANNOUNCED” rather than being invented.
- Treat the team contact data supplied in the brief as authoritative and expose phone numbers only through deliberate reveal or tap-to-call behavior.

## Style Decisions

- Crimson may create large moments of focus, but it should never become a flat full-width promo background; registration remains archive-black with crimson used as signal, access state, rule, or active fill.
- The case rail is a mandatory page-level motif: every major section must visually connect to a continuous dossier index with file numbers, status language, and a visible sense of investigation progress.
- Classified speaker placeholders must look like intentionally sealed evidence, using redaction, stamps, file tabs, signal traces, or surveillance abstraction rather than generic blurred portrait boxes.

## Delivery note

The first delivery candidate was compiled and visually checked on desktop; the layout also includes a mobile breakpoint with simplified navigation and stacked dossier files.
