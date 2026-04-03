---
name: extract-component
description: Extract a section from a monolith page into a co-located component file
disable-model-invocation: true
---
Extract a component from: $ARGUMENTS

Follow these steps:

1. Read the target page file to understand its structure
2. Identify the section to extract (by name or description provided)
3. Create a `_components/` directory next to the page if it doesn't exist
4. Create the new component file in `_components/` with:
   - `'use client'` directive (if the parent page has it)
   - All necessary imports moved from the parent
   - Props interface for any data/callbacks passed from parent
   - The extracted JSX and related state/effects
5. Update the parent page to:
   - Import the new component
   - Replace the extracted section with the component
   - Pass necessary props
6. Verify the page still renders correctly

The `_` prefix in `_components/` prevents Next.js from treating it as a route segment.
