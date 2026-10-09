# Quiet Space

> A calm, low-pressure place to leave small traces of life and be gently seen by people you trust.

Quiet Space is a social reflection prototype built around personal spaces, not feeds. It explores what online connection can feel like without likes, follower counts, rankings, or pressure to perform.

## Problem

Most social products turn everyday life into content to be measured. Public metrics, algorithmic feeds, and polished posting conventions make small moments feel unworthy of sharing and make connection feel competitive.

Quiet Space asks a different question: what if a social product helped people stay lightly present in one another's lives without demanding attention or comparison?

## Core Loop

1. Leave a small trace in your own space: a sentence, image, book, film, or weekly status.
2. Choose whether that trace is for yourself or visible to friends.
3. Visit a friend's space or a shared room to notice what is happening in their life.
4. Respond with one gentle sentence when words feel useful.

## Current Prototype / Working Flows

- A corridor-style home that summarizes your space, friends' spaces, shared rooms, and recent traces.
- An interactive memory room with a character, gentle furnishings, and an optional generated ambient soundscape.
- Client-side AES-GCM memory capsules that turn encrypted notes into objects in the room, with an anniversary ritual and a local SHA-256 proof.
- A lightweight add flow for a sentence, image URL, book, film, or weekly status, with self/friends visibility controls.
- A personal space with a weekly snapshot, books, films, shared notes, and private notes.
- A friends directory and individual friend spaces, including a prototype flow for leaving a private reply.
- Shared rooms with room-specific notes and a gentle view of people's possible free time.
- Seeded mock content plus same-browser persistence through `localStorage`.

## Product Principles

- No likes, follower counts, rankings, streaks, or trending content.
- People are represented as spaces to visit, not profiles competing in a feed.
- Small, unfinished moments are valid contributions.
- Visibility should be explicit, understandable, and easy to control.
- Calm interaction and emotional safety matter more than engagement volume.

## Current Stage

Quiet Space is a functional front-end prototype built with React, TanStack Start, Tailwind CSS, and Lovable. The main interaction paths work in a single browser, but all people and initial content are simulated.

There is currently no authentication, database, real friend graph, media upload service, or real-time multi-user behavior. New prototype data is stored only in the browser's local storage. Memory capsules are genuinely encrypted in the browser, but encrypted cloud storage and Solana Devnet verification are explicitly marked as the next build step rather than presented as finished functionality.

## Hacker House Build Goal

Turn the prototype into a small, testable multi-user MVP without losing its calm interaction model. The immediate goal is to move encrypted capsule data into secure off-chain storage, record only ownership, timestamps, and content proofs on Solana Devnet, then add authentication, real friend and room membership, and a deployable mobile-ready experience.

Success is not maximizing time spent. It is learning whether lightweight traces help people feel more naturally present in one another's lives.

## Looking For

- Full-stack collaborators who care about privacy-aware social systems.
- Product and design partners interested in humane, low-pressure interaction models.
- Early testers willing to evaluate emotional comfort and usefulness, not just engagement.

## Founder / Role

Solo founder leading product direction, interaction design, prototyping, and user discovery. Currently looking for technical collaborators who can help turn the prototype into a secure, testable product.

## Development

Requirements: Node.js and npm.

```bash
git clone https://github.com/Bicey07/gentle-glimpse-42.git
cd gentle-glimpse-42
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
```

This project is connected to Lovable. Changes pushed to `main` remain available in the Lovable editor.
