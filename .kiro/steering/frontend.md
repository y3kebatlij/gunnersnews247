---
inclusion: always
---

# Frontend Standards

## Framework

- Use **React** as the frontend framework.
- Use a compiled/built React setup (Vite + React is preferred). Do not use CDN-loaded React via script tags.
- All React code must be compiled/bundled before serving. No runtime JSX transformation in the browser.

## U.S. Web Design System (USWDS)

- All user-facing applications must use the **U.S. Web Design System (USWDS)** for styling and components.
- Reference: https://designsystem.digital.gov/
- Install USWDS via npm (`@uswds/uswds`). Do not link to external CDN-hosted USWDS assets.
- Use USWDS design tokens for spacing, color, and typography. Do not create custom design tokens that duplicate what USWDS provides.
- Follow USWDS component patterns for forms, navigation, alerts, tables, and layout grids.

## No External CDNs

- **All assets must be local.** Do not reference external CDNs for JavaScript, CSS, fonts, or images.
- Install all dependencies via npm/yarn and bundle them into the build output.
- This includes fonts (e.g., install Google Fonts locally or use USWDS-bundled fonts), icon libraries, and any third-party CSS.
- Rationale: Government environments often restrict external network access. Applications must function fully in air-gapped or restricted network environments.

## Accessibility

- Follow USWDS accessibility guidance and Section 508 requirements.
- All interactive elements must be keyboard navigable.
- All images must have meaningful alt text (or empty alt="" for decorative images).
- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<button>`) instead of generic `<div>` with click handlers.
- Form inputs must have associated `<label>` elements.
- Color must not be the only means of conveying information.
- Test with screen readers when possible.

## General Frontend Practices

- Use TypeScript for all React projects. Avoid `any` types.
- Keep components small and focused. One component per file.
- Separate presentational components from container/logic components.
- Use CSS Modules or USWDS utility classes for styling. Avoid inline styles and global CSS where possible.
- Do not store sensitive data in frontend code, localStorage, or sessionStorage.
