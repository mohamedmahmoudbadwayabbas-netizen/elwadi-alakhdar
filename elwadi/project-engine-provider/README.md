# Project Engine Provider

This is the real filesystem provider for the Project Engine boundary. It is deliberately separate from the Supabase Edge Function and must be deployed behind HTTPS.

## Source identity

`PROJECT_ENGINE_SOURCE_ID` is the SHA-256 of the exact Sources ZIP used for this release. The provider rejects every request whose source ID differs.

## Storage model

- `versions/<version>` contains immutable workspace versions.
- `current` is the active symlink.
- `staging/<changeSetHash>` is a prepared change set.
- Apply creates a new version only after validation and switches the active symlink.

This makes multi-file activation a versioned pointer swap rather than a sequence of independent file writes.

## Required secrets

- `PROJECT_ENGINE_PROVIDER_TOKEN`
- `PROJECT_ENGINE_SOURCE_ID`
- TLS key/certificate

Never expose these to React/browser code.

## Git

Git operations remain explicitly unavailable until a separate server-side Git adapter is configured. The provider never fabricates commit hashes.
