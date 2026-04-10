# Requirements Document

## Introduction

The Arsenal News Aggregator is a web-based platform that collects, curates, and delivers daily Arsenal Football Club news from global sources. The system aggregates articles, blog posts, newspaper stories, podcasts, and video highlights from top soccer websites worldwide, providing subscribers with a comprehensive daily digest. The platform includes live match scoreboards, upcoming game schedules, and real-time breaking news notifications. The system is built with TypeScript, React (Vite), AWS serverless architecture, USWDS styling, and follows 12-Factor App, AWS Well-Architected, OWASP Top 10, and Section 508 accessibility standards.

## Glossary

- **Aggregator**: The backend service responsible for crawling, fetching, and collecting Arsenal-related content from global news sources
- **Content_Item**: A single piece of aggregated content, which may be an article, blog post, newspaper story, podcast episode, or video highlight
- **Daily_Digest**: The curated collection of Content_Items compiled and delivered to subscribers each day
- **Subscriber**: A registered user who has opted in to receive the Daily_Digest via email
- **Notification_Banner**: A persistent UI element anchored to the bottom of the viewport that displays real-time breaking news and live score updates
- **Scoreboard**: A UI component that displays live match scores and game status for ongoing Arsenal matches
- **Schedule_View**: A UI component that displays upcoming Arsenal match dates, opponents, and competition details
- **Content_Duration_Label**: A label appended to the end of a Content_Item title indicating estimated reading time (for text) or listening/viewing duration (for audio/video)
- **Source_Registry**: A configurable list of global soccer news websites, blogs, podcast feeds, and video channels that the Aggregator crawls
- **Frontend**: The React-based single-page application served to users via a web browser
- **Delivery_Service**: The backend service responsible for sending the Daily_Digest to Subscribers at the scheduled time
- **Video_Embed**: An embedded video player within the Frontend that plays highlights and video content inline
- **Transfer_Item**: A content entry representing a transfer rumor, confirmed signing, loan deal, or contract update related to Arsenal FC
- **Transfer_Feed**: A dedicated section of the Frontend that displays Transfer_Items organized by transfer window status and reliability tier
- **Bookmark_List**: A per-user collection of saved Content_Items that the user has marked for later reading or reference
- **Match_Event**: A discrete in-match occurrence such as a goal, substitution, yellow card, red card, or penalty
- **Match_Timeline**: A chronological UI component displaying all Match_Events for a given match with minute markers
- **Lineup_View**: A UI component displaying the starting eleven, formation, and substitutes for both teams in a match
- **Standings_Table**: A UI component displaying league or competition standings including position, points, wins, draws, losses, goal difference, and form
- **Theme_Preference**: A user-configurable setting that controls the visual appearance of the Frontend, supporting light mode and dark mode

## Requirements

### Requirement 1: Global News Aggregation

**User Story:** As a reader, I want Arsenal news collected from top soccer websites globally, so that I receive a comprehensive international perspective on Arsenal FC.

#### Acceptance Criteria

1. THE Aggregator SHALL collect Content_Items from all sources defined in the Source_Registry
2. THE Source_Registry SHALL include sources from at least five distinct countries to ensure international coverage
3. THE Aggregator SHALL categorize each Content_Item as one of: article, blog, newspaper, podcast, or video
4. WHEN the Aggregator collects a Content_Item, THE Aggregator SHALL store the source URL, title, summary, publication date, source name, source country, content type, and estimated duration
5. THE Aggregator SHALL execute a full aggregation cycle once per day before 08:30 EST
6. IF the Aggregator fails to reach a source in the Source_Registry, THEN THE Aggregator SHALL log the failure and continue processing remaining sources
7. THE Aggregator SHALL generate a text summary of no more than 200 words for each Content_Item

### Requirement 2: Content Duration Labeling

**User Story:** As a reader, I want to see how long each article or podcast is, so that I can plan my reading or listening time.

#### Acceptance Criteria

1. THE Frontend SHALL display a Content_Duration_Label at the end of each Content_Item title
2. WHEN a Content_Item is of type article, blog, or newspaper, THE Aggregator SHALL estimate reading duration based on word count using a rate of 200 words per minute
3. WHEN a Content_Item is of type podcast, THE Aggregator SHALL extract the audio duration from the podcast feed metadata
4. WHEN a Content_Item is of type video, THE Aggregator SHALL extract the video duration from the source metadata
5. THE Content_Duration_Label SHALL display duration in the format "X min read" for text content and "X min listen" or "X min watch" for audio and video content respectively
6. IF the Aggregator cannot determine the duration of a Content_Item, THEN THE Aggregator SHALL display "Duration unknown" as the Content_Duration_Label

### Requirement 3: Subscriber Daily Digest Delivery

**User Story:** As a subscriber, I want to receive a daily email digest of Arsenal news at 9:00 AM EST, so that I can start my day informed.

#### Acceptance Criteria

1. THE Frontend SHALL provide a subscription form that collects an email address from the user
2. WHEN a user submits a valid email address, THE Delivery_Service SHALL add the email address to the subscriber list
3. THE Delivery_Service SHALL send the Daily_Digest to all Subscribers at 09:00 EST each day
4. THE Daily_Digest SHALL contain all Content_Items aggregated in the most recent aggregation cycle, each with title, summary, Content_Duration_Label, and source URL
5. IF the Delivery_Service fails to send the Daily_Digest to a Subscriber, THEN THE Delivery_Service SHALL retry delivery up to three times with exponential backoff
6. WHEN a Subscriber requests to unsubscribe, THE Delivery_Service SHALL remove the Subscriber from the subscriber list and cease all future deliveries
7. THE subscription form SHALL validate email format before submission and display a descriptive error message for invalid input
8. THE Delivery_Service SHALL include an unsubscribe link in every Daily_Digest email


### Requirement 4: Video and Highlight Embedding

**User Story:** As a reader, I want to watch embedded videos and match highlights directly on the platform, so that I do not need to navigate to external sites.

#### Acceptance Criteria

1. WHEN a Content_Item is of type video, THE Frontend SHALL render a Video_Embed inline within the content feed
2. THE Video_Embed SHALL support playback controls including play, pause, volume, and fullscreen
3. THE Video_Embed SHALL include accessible labels and keyboard navigation for all playback controls
4. THE Video_Embed SHALL display a descriptive text alternative when video playback is unavailable
5. IF a video source becomes unavailable, THEN THE Frontend SHALL display a message indicating the video is no longer available

### Requirement 5: Live Scoreboard

**User Story:** As a fan, I want to see live scores for ongoing Arsenal matches, so that I can follow the game in real time.

#### Acceptance Criteria

1. WHILE an Arsenal match is in progress, THE Scoreboard SHALL display the current score, match minute, and team names
2. WHILE an Arsenal match is in progress, THE Scoreboard SHALL update the displayed score within 60 seconds of a goal being scored
3. WHEN no Arsenal match is in progress, THE Frontend SHALL hide the Scoreboard component
4. THE Scoreboard SHALL be accessible via keyboard navigation and provide screen reader compatible score announcements
5. IF the Scoreboard loses connection to the live data source, THEN THE Scoreboard SHALL display the last known score with a "Connection lost" indicator

### Requirement 6: Upcoming Match Schedule

**User Story:** As a fan, I want to see a schedule of upcoming Arsenal matches, so that I can plan when to watch.

#### Acceptance Criteria

1. THE Schedule_View SHALL display the next 10 upcoming Arsenal matches
2. THE Schedule_View SHALL display the date, kickoff time (in the user's local timezone), opponent name, competition name, and venue for each match
3. THE Schedule_View SHALL update match data at least once per day
4. THE Schedule_View SHALL use semantic HTML table markup for accessibility compliance
5. WHEN a scheduled match is within 24 hours of kickoff, THE Schedule_View SHALL visually highlight that match entry

### Requirement 7: Real-Time Breaking News Notifications

**User Story:** As a reader, I want to receive real-time notifications for breaking news and live scores, so that I am immediately informed of important events.

#### Acceptance Criteria

1. THE Notification_Banner SHALL be anchored to the bottom of the viewport and remain visible during scrolling
2. WHEN a breaking news event occurs, THE Frontend SHALL display the event summary in the Notification_Banner within 30 seconds
3. WHILE an Arsenal match is in progress, THE Notification_Banner SHALL display goal alerts and final score updates
4. THE Notification_Banner SHALL auto-dismiss each notification after 15 seconds unless the user interacts with the notification
5. THE Notification_Banner SHALL queue multiple notifications and display them sequentially
6. THE Notification_Banner SHALL be dismissible via a close button that is keyboard accessible and labeled for screen readers
7. THE Notification_Banner SHALL use ARIA live regions to announce notification content to assistive technologies

### Requirement 8: Source Registry Configuration

**User Story:** As an administrator, I want to configure the list of news sources the system crawls, so that I can add or remove sources without code changes.

#### Acceptance Criteria

1. THE Source_Registry SHALL be stored as a configuration resource external to the application code
2. THE Source_Registry SHALL define for each source: name, URL, country of origin, content type (article, blog, newspaper, podcast, video), and crawl priority
3. WHEN the Source_Registry is updated, THE Aggregator SHALL use the updated configuration on the next aggregation cycle without requiring a redeployment
4. THE Source_Registry SHALL support a minimum of 50 configured sources
5. IF a Source_Registry entry contains an invalid URL, THEN THE Aggregator SHALL log a validation error and skip that entry

### Requirement 9: Deployment and Infrastructure

**User Story:** As a DevOps engineer, I want to deploy the system via command line and CI/CD pipeline, so that deployments are automated and repeatable.

#### Acceptance Criteria

1. THE system SHALL be deployable via bash or PowerShell command line scripts
2. THE system SHALL be deployable via GitLab Runner CI/CD pipeline
3. THE system SHALL use AWS serverless services for all backend compute and storage
4. THE system SHALL store all environment-specific configuration in environment variables
5. THE system SHALL produce a Software Bill of Materials (SBOM) as part of each build
6. THE system SHALL pass Semgrep static analysis with the default and OWASP Top 10 rulesets before deployment

### Requirement 10: Frontend Presentation and Accessibility

**User Story:** As a reader, I want a clean, accessible interface styled with USWDS, so that the platform is usable by all audiences including those using assistive technologies.

#### Acceptance Criteria

1. THE Frontend SHALL be built with React and Vite using TypeScript
2. THE Frontend SHALL use USWDS components and design tokens for all styling
3. THE Frontend SHALL load all assets (fonts, icons, CSS, JavaScript) from local bundles with no external CDN dependencies
4. THE Frontend SHALL meet Section 508 accessibility requirements including keyboard navigation, screen reader compatibility, and sufficient color contrast
5. THE Frontend SHALL use semantic HTML elements for all structural content
6. THE Frontend SHALL render responsively across desktop, tablet, and mobile viewports
7. WHEN a Content_Item link is activated, THE Frontend SHALL open the source URL in a new browser tab with appropriate rel="noopener noreferrer" attributes

### Requirement 11: Transfer News and Rumors

**User Story:** As an Arsenal fan, I want a dedicated section for transfer news, rumors, and confirmed signings, so that I can stay informed during and between transfer windows.

#### Acceptance Criteria

1. THE Aggregator SHALL collect and categorize Transfer_Items separately from general Content_Items
2. THE Aggregator SHALL classify each Transfer_Item by type: rumor, confirmed signing, loan, contract extension, or departure
3. THE Transfer_Feed SHALL display Transfer_Items sorted by publication date with the most recent first
4. THE Transfer_Feed SHALL visually distinguish between confirmed transfers and unconfirmed rumors using distinct labels or styling
5. WHEN a transfer window is open, THE Frontend SHALL display a prominent link to the Transfer_Feed in the main navigation
6. THE Transfer_Feed SHALL display the source name and country of origin for each Transfer_Item to help readers assess reliability
7. IF no Transfer_Items are available, THEN THE Transfer_Feed SHALL display a message indicating no current transfer activity

### Requirement 12: Content Personalization and Bookmarking

**User Story:** As a reader, I want to save articles for later and personalize my content feed, so that I can prioritize the content most relevant to me.

#### Acceptance Criteria

1. THE Frontend SHALL provide a bookmark button on each Content_Item that adds the item to the user's Bookmark_List
2. THE Frontend SHALL persist the Bookmark_List in the user's browser local storage so bookmarks survive page refreshes
3. THE Frontend SHALL provide a dedicated Bookmark_List view where users can see all saved Content_Items
4. WHEN a user removes a Content_Item from the Bookmark_List, THE Frontend SHALL immediately remove it from the saved view
5. THE Frontend SHALL allow users to filter the content feed by content type (article, blog, newspaper, podcast, video)
6. THE Frontend SHALL allow users to filter the content feed by source country
7. THE bookmark button SHALL be keyboard accessible and include an ARIA label indicating the bookmark state

### Requirement 13: Match Lineups and Events Timeline

**User Story:** As a fan, I want to see pre-match lineups and a minute-by-minute timeline of match events, so that I can follow the full context of a match.

#### Acceptance Criteria

1. WHEN a match lineup is announced, THE Lineup_View SHALL display the starting eleven and formation for both teams
2. THE Lineup_View SHALL display the substitutes bench for both teams
3. WHILE an Arsenal match is in progress, THE Match_Timeline SHALL display all Match_Events in chronological order with the event minute
4. THE Match_Timeline SHALL support the following Match_Event types: goal, own goal, substitution, yellow card, red card, penalty awarded, and penalty missed
5. THE Match_Timeline SHALL update within 60 seconds of a Match_Event occurring
6. THE Lineup_View and Match_Timeline SHALL use semantic HTML and ARIA attributes for screen reader accessibility
7. IF lineup data is not yet available for an upcoming match, THEN THE Frontend SHALL display a message indicating lineups have not been announced

### Requirement 14: League Table and Standings

**User Story:** As a fan, I want to see current league standings and competition tables, so that I can track Arsenal's position throughout the season.

#### Acceptance Criteria

1. THE Standings_Table SHALL display the current Premier League standings including position, team name, matches played, wins, draws, losses, goals for, goals against, goal difference, and points
2. THE Standings_Table SHALL visually highlight Arsenal's row in the table
3. THE Standings_Table SHALL update at least once per day
4. THE Standings_Table SHALL support displaying standings for additional competitions Arsenal participates in (e.g., Champions League, FA Cup, League Cup)
5. THE Standings_Table SHALL use semantic HTML table markup with proper header associations for accessibility
6. WHEN a user selects a different competition, THE Standings_Table SHALL display the standings for the selected competition
7. THE Standings_Table SHALL display the last five match results as a form indicator for each team

### Requirement 15: Dark Mode and Theme Support

**User Story:** As a reader, I want to switch between light and dark mode, so that I can use the platform comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Frontend SHALL support two Theme_Preferences: light mode and dark mode
2. THE Frontend SHALL default to the user's operating system theme preference on first visit
3. THE Frontend SHALL provide a toggle control in the site header to switch between light and dark mode
4. WHEN a user changes the Theme_Preference, THE Frontend SHALL persist the selection in browser local storage and apply it on subsequent visits
5. THE Frontend SHALL apply USWDS design tokens appropriate to the active theme for all colors, backgrounds, and borders
6. THE theme toggle control SHALL be keyboard accessible and include an ARIA label indicating the current theme state
7. THE dark mode theme SHALL maintain sufficient color contrast ratios to meet Section 508 accessibility requirements
