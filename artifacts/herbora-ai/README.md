# HERBORA AI frontend

## Setup

From this directory, run `pnpm install`, then `pnpm dev`. For a production build, use `pnpm build`; `pnpm typecheck` checks the TypeScript project.

## Local data and service contract

The current app is frontend-only. `src/lib/herb-data.ts` contains a deliberately small sample dataset and the typed record shapes. The replaceable functions in `src/lib/herb-service.ts` are:

- `getHerbs(filters)`, `getHerbById(id)`, `searchHerbs(query)`
- `getRecommendations(herbId)` (shared explicit family / plant-part metadata only)
- `getEvidence(herbId)`, `getSafetyInformation(herbId)`
- `identifyHerb(imageFile)` (currently returns `model-not-connected`)

For a Python API, preserve these UI contracts and replace the local functions with an API client. Suggested contracts: `GET /herbs` with filters and field-level provenance; `GET /herbs/{id}`; `GET /search?q=...`; `GET /herbs/{id}/related` with shared feature explanations; `GET /evidence` and `/safety`; and `POST /identify` as `multipart/form-data` with an image. The identify response should be an explicit unavailable state until a trained, evaluated model exists. Only present calibrated, documented model scores if a future model supports them. Define consent and retention behavior before uploading images.

Sample records do not contain scientific references or safety records. Empty values are intentional. Traditional knowledge and scientific evidence must remain distinct. This educational prototype is not medical advice.
