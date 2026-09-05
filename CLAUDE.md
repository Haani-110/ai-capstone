# AI Assistant Instructions

## Stack

- Node.js
- Git

## Conventions

- Use Conventional Commits.
- Prefer modern JavaScript.
- Keep code readable.
- Explain changes before implementing them.

## Best Practices

- Write clear documentation.
- Keep commits small and descriptive.

## Project-Specific Rules

- Treat server-side validation as authoritative. Client-side validation is for user experience only and must never be the sole protection for API input.
- Keep settings validation consistent between client and server by using the shared validation module instead of duplicating validation rules.
- Form controls must have accessible labels and validation feedback must be programmatically associated with the relevant field using appropriate ARIA attributes.
- Any behavioral change to the settings form or API should include automated tests, and `npm test` must be run before considering the change complete.
