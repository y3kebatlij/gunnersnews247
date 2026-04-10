# Implementation Plan: Arsenal News Aggregator

## Overview

Incremental implementation of the Arsenal News Aggregator — a serverless, event-driven platform built with TypeScript, React/Vite, and AWS services. Tasks are organized by layer: shared types and infrastructure first, then backend Lambda handlers, then frontend components, then integration and deployment wiring. Each task builds on previous steps so there is no orphaned code.

### Userspace Constraint

**All tools, dependencies, and scripts must run without admin/sudo/root access.** This means:
- All npm packages installed locally via `npm ci` (project-level `node_modules/.bin/`) — never global installs
- Semgrep installed via `pip install --user semgrep` or as a project-level Python venv dependency — never via `sudo pip` or system package manager
- Syft and Grype installed to a local `./bin/` directory using `INSTALL_DIR=./bin` — never to `/usr/local/bin`
- AWS CDK/SAM CLI installed locally via npm (`npx aws-cdk` or `npx @aws-cdk/...`) — never global
- nvm manages Node.js in userspace (already userspace by design)
- Python venv at `.venv/` for any Python tooling (Semgrep) — never system Python
- Deployment scripts must not use `sudo`, `chmod` on system paths, or write outside the project directory
- CI/CD pipeline installs all tools per-job using userspace methods

## Tasks

- [x] 1. Project scaffolding and shared types
  - [x] 1.1 Initialize monorepo structure with shared, backend, and frontend packages
    - Create top-level `package.json` with workspaces: `packages/shared`, `packages/backend`, `packages/frontend`
    - Add `.nvmrc` (Node LTS), `.editorconfig`, `.gitignore` (node_modules, dist, .env, .venv, bin/)
    - Add `.env.example` with placeholder values for all environment variables (DynamoDB table names, SES sender, WebSocket URL, API Gateway URL)
    - Install dev dependencies locally (project-level): `typescript`, `vitest`, `fast-check`, `@testing-library/react`, `jest-axe` — all via `npm install --save-dev`, never global
    - Create `python3 -m venv .venv` for Semgrep and document activation in README: `source .venv/bin/activate && pip install semgrep`
    - All tooling runs via `npx` (for Node tools) or `.venv/bin/` (for Python tools) — no global installs, no sudo
    - _Requirements: 9.1, 9.4, 10.1_

  - [x] 1.2 Define shared TypeScript interfaces and constants
    - Create `packages/shared/src/types.ts` with all interfaces from the design: `ContentItemInput`, `SourceRegistryEntry`, `Subscriber`, `DailyDigest`, `DigestItem`, `MatchState`, `MatchEvent`, `Lineup`, `LineupTeam`, `Player`, `NotificationPayload`, `TransferItemType`, `ContentQueryParams`, `StandingsEntry`, `LocalStorageSchema`
    - Create `packages/shared/src/constants.ts` with named constants: content types array, transfer types array, match event types array, duration format strings, reading rate (200 wpm), max summary words (200), max schedule matches (10), notification auto-dismiss (15s), form results count (5)
    - _Requirements: 1.3, 1.4, 2.5, 11.2, 13.4, 14.1_

  - [ ]* 1.3 Write property tests for type invariants
    - **Property 3: Content_Item type classification invariant** — generate random contentType values and verify only valid enum members are accepted
    - **Validates: Requirements 1.3**
    - **Property 25: Transfer_Item classification** — generate random TransferItems and verify `isTransfer = true` and valid `transferType`
    - **Validates: Requirements 11.1, 11.2**
    - **Property 35: Match_Event type invariant** — generate random MatchEvents and verify `type` is one of the 7 valid values
    - **Validates: Requirements 13.4**

- [x] 2. Source Registry and Aggregator Lambda
  - [x] 2.1 Implement Source Registry validation and DynamoDB access
    - Create `packages/backend/src/aggregator/source-registry.ts`
    - Implement `loadSourceRegistry()` to scan the SourceRegistry DynamoDB table for enabled entries
    - Implement `validateRegistryEntry(entry)` to check required fields (name, url, country, contentType, crawlPriority) and URL validity
    - Skip invalid entries with logged validation errors; process all valid entries
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 2.2 Write property tests for Source Registry validation
    - **Property 22: Source_Registry entry schema validation** — generate random registry entries and verify all required fields are validated
    - **Validates: Requirements 8.2**
    - **Property 23: Invalid Source_Registry URLs are skipped** — generate registries with mix of valid/invalid URLs, verify invalid ones are skipped and valid ones processed
    - **Validates: Requirements 8.5**
    - **Property 2: Source_Registry international coverage** — generate valid registries and verify at least 5 distinct countries
    - **Validates: Requirements 1.2**

  - [x] 2.3 Implement content aggregation core logic
    - Create `packages/backend/src/aggregator/handler.ts` with the `handler(event)` function
    - Load Source_Registry, iterate all enabled sources, crawl each source (stub HTTP fetch for now)
    - For each source: extract content metadata, compute duration label, generate summary, classify transfer items
    - Persist Content_Items to DynamoDB ContentItems table
    - Log and skip failed sources without halting the cycle
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x] 2.4 Implement `computeDurationLabel` function
    - Create `packages/backend/src/aggregator/duration.ts`
    - For article/blog/newspaper: `Math.ceil(wordCount / 200)` → `"X min read"`
    - For podcast: extract audio duration from metadata → `"X min listen"`
    - For video: extract video duration from metadata → `"X min watch"`
    - When duration cannot be determined: return `"Duration unknown"`
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 2.5 Write property tests for duration label computation
    - **Property 6: Duration label computation and formatting** — generate random ContentItems with various types and word counts, verify correct format and calculation
    - **Validates: Requirements 2.2, 2.5, 2.6**

  - [x] 2.6 Implement `generateSummary` function
    - Create `packages/backend/src/aggregator/summary.ts`
    - Truncate or summarize full text to no more than 200 words
    - Ensure output is a non-empty string
    - _Requirements: 1.7_

  - [ ]* 2.7 Write property tests for summary generation
    - **Property 5: Summary word count bound** — generate random text inputs and verify summary never exceeds 200 words
    - **Validates: Requirements 1.7**

  - [x] 2.8 Implement `classifyTransferItem` function
    - Create `packages/backend/src/aggregator/transfer-classifier.ts`
    - Classify content as transfer-related based on keywords/patterns
    - Assign `transferType`: rumor, confirmed_signing, loan, contract_extension, or departure
    - Set `isTransfer = true` for classified items
    - _Requirements: 11.1, 11.2_

  - [ ]* 2.9 Write property tests for aggregator processing
    - **Property 1: Aggregator processes all registry sources** — generate a registry with N enabled sources, verify N crawl attempts
    - **Validates: Requirements 1.1, 1.6**
    - **Property 4: Content_Item required fields completeness** — generate stored ContentItems and verify all required fields are present and non-empty
    - **Validates: Requirements 1.4**

- [x] 3. Checkpoint — Aggregator layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Digest and Subscription Lambda
  - [x] 4.1 Implement subscriber management in API handler
    - Create `packages/backend/src/api/subscribers.ts`
    - Implement `subscribe(email)`: validate email format, add to Subscribers table with `active = true` and generated `unsubscribeToken`
    - Implement `unsubscribe(email, token)`: set `active = false` for matching subscriber
    - Implement `validateEmail(email)`: regex-based email format validation
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [ ]* 4.2 Write property tests for subscription management
    - **Property 8: Email validation rejects invalid formats** — generate random invalid email strings and verify rejection
    - **Validates: Requirements 3.7**
    - **Property 9: Subscribe adds to subscriber list** — generate valid emails, subscribe, verify `active = true`
    - **Validates: Requirements 3.2**
    - **Property 10: Unsubscribe removes from subscriber list** — subscribe then unsubscribe, verify `active = false`
    - **Validates: Requirements 3.6**

  - [x] 4.3 Implement Digest Lambda handler
    - Create `packages/backend/src/digest/handler.ts`
    - Query today's Content_Items from DynamoDB (by aggregationDate)
    - Query all active subscribers
    - Compile digest with `compileDigest(items)`
    - Render email HTML with `renderDigestEmail(digest)` including unsubscribe link
    - Send via SES to each active subscriber with retry (3 attempts, exponential backoff)
    - _Requirements: 3.3, 3.4, 3.5, 3.8_

  - [ ]* 4.4 Write property tests for digest compilation
    - **Property 11: Daily_Digest contains all aggregated items with required fields** — generate random ContentItem sets, compile digest, verify all items present with title, summary, durationLabel, sourceUrl
    - **Validates: Requirements 3.4**
    - **Property 12: Daily_Digest email contains unsubscribe link** — render digest email, verify HTML contains unsubscribe URL
    - **Validates: Requirements 3.8**
    - **Property 13: Digest sent to all active subscribers** — generate subscriber lists with mixed active/inactive, verify delivery targets only active subscribers
    - **Validates: Requirements 3.3**

- [x] 5. Match Data and Real-Time Lambdas
  - [x] 5.1 Implement Match Data Lambda
    - Create `packages/backend/src/match/handler.ts`
    - Poll external live data API for current match state (stub for now)
    - Implement `detectNewEvents(previous, current)` to diff match states and identify new events
    - Update Matches and MatchEvents tables in DynamoDB
    - Publish new events to Real-Time Lambda for broadcasting
    - Store lineup data in Lineups table
    - Update Standings table from external data
    - _Requirements: 5.1, 5.2, 13.3, 13.5, 14.3_

  - [ ]* 5.2 Write property tests for match event detection
    - **Property 40: New match events detected** — generate two consecutive MatchState snapshots, verify `detectNewEvents` returns exactly the diff
    - **Validates: Requirements 5.1, 13.5**

  - [x] 5.3 Implement Real-Time Lambda (WebSocket handler)
    - Create `packages/backend/src/realtime/handler.ts`
    - Handle `$connect`: store connectionId in WebSocketConnections table with TTL
    - Handle `$disconnect`: remove connectionId from table
    - Implement `broadcast(payload)`: query all connections, post message to each via API Gateway Management API
    - Remove stale connections on send failure
    - _Requirements: 7.2, 7.3_

  - [ ]* 5.4 Write property tests for notification production
    - **Property 21: Goal events produce notifications** — generate MatchEvents of type "goal"/"own_goal", verify a NotificationPayload of type "goal" is produced
    - **Validates: Requirements 7.3**

- [x] 6. REST API Lambda
  - [x] 6.1 Implement API Gateway Lambda handler with all routes
    - Create `packages/backend/src/api/handler.ts` with route dispatcher
    - `GET /content` — query ContentItems by date, contentType, sourceCountry with pagination
    - `GET /content/:id` — get single ContentItem
    - `GET /transfers` — query TransferItems (GSI-2) sorted by publicationDate desc
    - `GET /schedule` — query upcoming matches (GSI UpcomingMatches, limit 10)
    - `GET /standings` — query Standings table by competition
    - `GET /match/:id` — get MatchState
    - `GET /match/:id/lineup` — get Lineup
    - `GET /match/:id/timeline` — get MatchEvents sorted by minute
    - `POST /subscribe` — call subscribe logic from 4.1
    - `DELETE /subscribe` — call unsubscribe logic from 4.1
    - All routes validate input, return structured JSON, use environment variables for table names
    - _Requirements: 1.4, 3.1, 3.6, 6.1, 11.3, 13.3, 14.1, 14.6_

  - [ ]* 6.2 Write unit tests for API route handlers
    - Test content query with filters returns correct items
    - Test transfer query returns items sorted by date descending
    - Test schedule query returns at most 10 matches sorted by kickoffTime
    - Test standings query filters by competition
    - Test subscribe/unsubscribe flows
    - _Requirements: 1.4, 6.1, 11.3, 14.6_

- [x] 7. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Frontend project setup and App shell
  - [x] 8.1 Initialize React/Vite/TypeScript frontend
    - Create `packages/frontend` with Vite + React + TypeScript template
    - Install `@uswds/uswds` via npm, configure USWDS Sass compilation with Vite
    - Bundle all fonts, icons, CSS locally — no external CDN references
    - Configure Vitest for frontend tests with React Testing Library and jest-axe
    - Set up CSS Modules or USWDS utility class approach
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 8.2 Implement App shell, theme provider, and WebSocket connection manager
    - Create `packages/frontend/src/App.tsx` — root shell with USWDS layout grid
    - Implement `ThemeProvider` context: read `arsenal-theme` from localStorage, default to OS preference via `prefers-color-scheme`, apply USWDS light/dark tokens
    - Implement WebSocket connection manager: connect to WebSocket API URL from env, auto-reconnect with exponential backoff, expose notification stream via context
    - _Requirements: 15.1, 15.2, 15.4, 15.5, 7.2_

  - [x] 8.3 Implement Header with navigation, ThemeToggle, and SubscribeForm
    - Create `packages/frontend/src/components/Header.tsx` — USWDS header with site navigation
    - Create `packages/frontend/src/components/ThemeToggle.tsx` — light/dark switch, keyboard accessible, ARIA label for current state, persists to localStorage
    - Create `packages/frontend/src/components/SubscribeForm.tsx` — email input with USWDS form pattern, client-side email validation, inline error messages, calls POST /subscribe API
    - Include prominent Transfer_Feed nav link when transfer window is open
    - _Requirements: 15.3, 15.6, 3.1, 3.7, 11.5, 10.5_

- [x] 9. Content Feed and related components
  - [x] 9.1 Implement ContentFeed, ContentItemCard, DurationLabel, and FilterPanel
    - Create `packages/frontend/src/components/ContentFeed.tsx` — paginated list fetching from GET /content, applies active filters
    - Create `packages/frontend/src/components/ContentItemCard.tsx` — displays title with DurationLabel appended, summary, source link (target="_blank" rel="noopener noreferrer"), BookmarkButton, conditionally renders VideoEmbed for video type
    - Create `packages/frontend/src/components/DurationLabel.tsx` — renders the durationLabel string
    - Create `packages/frontend/src/components/FilterPanel.tsx` — dropdowns for content type and source country filters
    - Use semantic HTML, USWDS card/list patterns
    - _Requirements: 2.1, 10.5, 10.6, 10.7, 12.5, 12.6, 4.1_

  - [ ]* 9.2 Write property tests for content rendering
    - **Property 7: Duration label presence in rendered content** — generate ContentItems, render ContentItemCard, verify durationLabel text appears in output
    - **Validates: Requirements 2.1**
    - **Property 14: Video content renders Video_Embed** — generate ContentItems with contentType="video", render, verify VideoEmbed component is present
    - **Validates: Requirements 4.1**
    - **Property 24: Content link attributes** — generate ContentItems, render, verify all links have target="_blank" and rel="noopener noreferrer"
    - **Validates: Requirements 10.7**
    - **Property 31: Content feed filtering** — generate ContentItems with various types/countries, apply filters, verify all displayed items match filter criteria
    - **Validates: Requirements 12.5, 12.6**

  - [x] 9.3 Implement VideoEmbed component
    - Create `packages/frontend/src/components/VideoEmbed.tsx`
    - Inline video player with play, pause, volume, fullscreen controls
    - Accessible labels and keyboard navigation for all controls
    - Display text alternative when video unavailable: "This video is no longer available"
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 9.4 Implement BookmarkButton and BookmarkList
    - Create `packages/frontend/src/components/BookmarkButton.tsx` — toggle adds/removes contentId from `arsenal-bookmarks` in localStorage, keyboard accessible, ARIA label for bookmark state
    - Create `packages/frontend/src/components/BookmarkList.tsx` — dedicated view showing all bookmarked ContentItems from localStorage, with remove capability
    - Graceful degradation if localStorage unavailable (session-only bookmarks)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.7_

  - [ ]* 9.5 Write property tests for bookmarking
    - **Property 29: Bookmark toggle adds to Bookmark_List** — generate contentIds, toggle bookmark on, verify contentId in list
    - **Validates: Requirements 12.1**
    - **Property 30: Bookmark removal** — add then remove bookmark, verify contentId no longer in list
    - **Validates: Requirements 12.4**
    - **Property 32: localStorage round-trip persistence** — write bookmark list and theme to localStorage, read back, verify equality
    - **Validates: Requirements 12.2, 15.4**

- [x] 10. Transfer Feed
  - [x] 10.1 Implement TransferFeed component
    - Create `packages/frontend/src/components/TransferFeed.tsx`
    - Fetch from GET /transfers, display sorted by publicationDate descending
    - Visually distinguish confirmed transfers vs unconfirmed rumors with distinct USWDS labels/badges
    - Display sourceName and sourceCountry for each item
    - Show "No current transfer activity" when empty
    - _Requirements: 11.3, 11.4, 11.6, 11.7_

  - [ ]* 10.2 Write property tests for Transfer Feed
    - **Property 26: Transfer_Feed sorted by publication date descending** — generate TransferItems, render feed, verify descending date order
    - **Validates: Requirements 11.3**
    - **Property 27: Transfer_Feed distinguishes confirmed from unconfirmed** — generate mix of confirmed/rumor items, render, verify distinct labels present
    - **Validates: Requirements 11.4**
    - **Property 28: Transfer_Feed displays source attribution** — generate TransferItems, render, verify sourceName and sourceCountry visible
    - **Validates: Requirements 11.6**

- [x] 11. Scoreboard and Schedule
  - [x] 11.1 Implement Scoreboard component
    - Create `packages/frontend/src/components/Scoreboard.tsx`
    - Display current score, match minute, team names when match is live/halftime
    - Hidden when no match is in progress
    - Keyboard navigable, screen reader compatible score announcements
    - Show last known score with "Connection lost" indicator on WebSocket disconnect
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 11.2 Write property tests for Scoreboard
    - **Property 15: Scoreboard displays required data when match is live** — generate live MatchStates, render, verify score, minute, team names present
    - **Validates: Requirements 5.1**
    - **Property 16: Scoreboard hidden when no match is live** — generate states with no live match, render, verify Scoreboard not in DOM
    - **Validates: Requirements 5.3**

  - [x] 11.3 Implement ScheduleView component
    - Create `packages/frontend/src/components/ScheduleView.tsx`
    - Fetch from GET /schedule, display up to 10 upcoming matches
    - Show date, kickoff time (converted to user's local timezone), opponent, competition, venue
    - Semantic HTML table markup with proper headers
    - Visually highlight matches within 24 hours of kickoff
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 11.4 Write property tests for ScheduleView
    - **Property 17: Schedule_View displays at most 10 upcoming matches** — generate sets of scheduled matches, verify at most 10 rendered, sorted by earliest kickoffTime
    - **Validates: Requirements 6.1**
    - **Property 18: Schedule_View match entry contains required fields** — generate matches, render, verify date, kickoff time, opponent, competition, venue present
    - **Validates: Requirements 6.2**
    - **Property 19: Schedule_View highlights matches within 24 hours** — generate matches with various kickoff times, verify 24-hour matches have highlight class
    - **Validates: Requirements 6.5**

- [x] 12. Checkpoint — Core frontend components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Match Detail components
  - [x] 13.1 Implement LineupView component
    - Create `packages/frontend/src/components/LineupView.tsx`
    - Display starting eleven (11 players), formation, and substitutes for both home and away teams
    - Semantic HTML and ARIA attributes for screen reader accessibility
    - Show "Lineups have not been announced" when data unavailable
    - _Requirements: 13.1, 13.2, 13.6, 13.7_

  - [ ]* 13.2 Write property test for LineupView
    - **Property 33: Lineup_View renders complete lineup data** — generate Lineup objects, render, verify 11 starters, formation, and subs for both teams
    - **Validates: Requirements 13.1, 13.2**

  - [x] 13.3 Implement MatchTimeline component
    - Create `packages/frontend/src/components/MatchTimeline.tsx`
    - Display MatchEvents in chronological order (ascending by minute) with minute markers
    - Support all 7 event types with appropriate icons/labels
    - Semantic HTML and ARIA attributes
    - _Requirements: 13.3, 13.4, 13.6_

  - [ ]* 13.4 Write property test for MatchTimeline
    - **Property 34: Match_Timeline chronological ordering** — generate random MatchEvent arrays, render, verify ascending minute order
    - **Validates: Requirements 13.3**

  - [x] 13.5 Implement MatchDetail container
    - Create `packages/frontend/src/components/MatchDetail.tsx`
    - Container that fetches match data, lineup, and timeline from API
    - Composes LineupView and MatchTimeline
    - _Requirements: 13.1, 13.3_

- [x] 14. Standings Table
  - [x] 14.1 Implement StandingsTable component
    - Create `packages/frontend/src/components/StandingsTable.tsx`
    - Fetch from GET /standings with competition parameter
    - Display all required columns: position, team name, matches played, W, D, L, GF, GA, GD, points
    - Display last 5 match results as form indicator per team
    - Highlight Arsenal's row with distinct styling
    - Competition selector dropdown to switch between competitions
    - Semantic HTML table with proper header associations
    - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 14.2 Write property tests for StandingsTable
    - **Property 36: Standings_Table displays all required columns** — generate standings entries, render, verify all 10 columns present
    - **Validates: Requirements 14.1**
    - **Property 37: Standings_Table highlights Arsenal** — generate standings including Arsenal, render, verify Arsenal row has highlight class
    - **Validates: Requirements 14.2**
    - **Property 38: Standings_Table competition selection** — generate multi-competition standings, select a competition, verify only matching entries displayed
    - **Validates: Requirements 14.6**
    - **Property 39: Standings_Table form indicator** — generate standings entries, render, verify recentForm shows exactly 5 results
    - **Validates: Requirements 14.7**

- [x] 15. Notification Banner
  - [x] 15.1 Implement NotificationBanner component
    - Create `packages/frontend/src/components/NotificationBanner.tsx`
    - Anchored to bottom of viewport, visible during scrolling
    - Queue multiple notifications, display sequentially (FIFO)
    - Auto-dismiss after 15 seconds unless user interacts
    - Dismissible via keyboard-accessible close button with screen reader label
    - ARIA live region for assistive technology announcements
    - Consume notification stream from WebSocket context
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 15.2 Write property test for notification queue ordering
    - **Property 20: Notification queue preserves order** — generate sequences of NotificationPayloads, verify FIFO display order
    - **Validates: Requirements 7.5**

- [x] 16. Dark mode theming
  - [x] 16.1 Implement USWDS dark mode token application
    - Configure USWDS Sass variables for light and dark theme token sets
    - Apply theme class to document root based on ThemeProvider context
    - Verify all colors, backgrounds, and borders use USWDS design tokens
    - Verify dark mode maintains sufficient contrast ratios for Section 508
    - _Requirements: 15.1, 15.5, 15.7_

- [x] 17. Checkpoint — All frontend components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Infrastructure and deployment
  - [x] 18.1 Create deployment scripts and CI/CD pipeline
    - Create `scripts/deploy.sh` (bash) and `scripts/deploy.ps1` (PowerShell) for CLI deployment
    - **Userspace enforcement:** Scripts must not use `sudo`, must not write to system paths, must not require admin privileges
    - Create `.gitlab-ci.yml` with stages: build, test, security, deploy
    - Build stage: `npm ci`, compile TypeScript, bundle frontend with Vite
    - Test stage: run Vitest with `--run` flag via `npx vitest --run`
    - Security stage:
      - Semgrep: `pip install --user semgrep` or use project `.venv/bin/semgrep` — run with `p/default` and `p/owasp-top-ten` rulesets
      - Syft: install to local `./bin/` via `curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ./bin` — generate SBOM with `./bin/syft`
      - Grype: install to local `./bin/` via `curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ./bin` — scan with `./bin/grype`
    - Deploy stage: deploy via `npx aws-cdk deploy` or `npx @aws-cdk/...` — no globally installed AWS CLI required
    - All environment-specific config via environment variables
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 18.2 Create EventBridge schedule rules
    - Aggregator trigger: daily at 08:00 EST (before 08:30 deadline)
    - Digest trigger: daily at 09:00 EST
    - Match data polling: every 1 minute (enabled only during match windows)
    - Define as part of deployment scripts/IaC
    - _Requirements: 1.5, 3.3, 5.2, 13.5_

  - [x] 18.3 Create DynamoDB table definitions
    - Define all 8 tables with keys and GSIs as specified in design: ContentItems, Subscribers, SourceRegistry, Matches, MatchEvents, Lineups, Standings, WebSocketConnections
    - Include in deployment scripts
    - _Requirements: 8.1, 9.3_

- [x] 19. Accessibility and responsive audit
  - [x] 19.1 Add accessibility attributes and responsive styling across all components
    - Audit all components for: keyboard navigation, ARIA labels, semantic HTML, screen reader compatibility, color contrast
    - Verify responsive rendering across desktop, tablet, and mobile viewports using USWDS grid breakpoints
    - Run jest-axe automated a11y checks on all rendered components
    - _Requirements: 10.4, 10.5, 10.6, 4.3, 5.4, 6.4, 7.6, 7.7, 12.7, 13.6, 14.5, 15.6, 15.7_

- [x] 20. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- **Userspace-only execution:** No task requires admin/sudo/root access. All tools install locally to the project directory or user home
- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (40 properties total)
- Unit tests validate specific examples and edge cases
- TypeScript is used throughout (backend and frontend)
- All 15 requirements are covered across the task list
- fast-check is used for property-based testing, Vitest as the test runner
- Semgrep runs from `.venv/bin/semgrep` (Python venv), Syft/Grype from `./bin/` (local install), Node tools via `npx`
