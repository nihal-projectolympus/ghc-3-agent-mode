# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-specific React components responsible for rendering API data and for loading, empty, and accessible error states. Use the shared client with relative `/api` paths.
- Logic tier decision: Keep Express routes thin and place validation, persistence, aggregation, and recommendation decisions in the service layer. Translate invalid requests and missing resources into deliberate 4xx responses.
- Data tier decision: Define required Mongoose fields and defaults in the models, preserve ObjectId relationships between users, teams, and activities, and keep seeding idempotent.
- Activity tracking approach: Validate the request shape and referenced user and team before creating an activity with the submitted relationships, type, minutes, a computed point total, and an occurrence date.
- Team management approach: Require a name and mascot, default members to an empty array, and persist submitted member ObjectIds for list and create responses.
- Leaderboard approach: Aggregate activity points by team, join team names, sort descending by total points, and assign 1-based ranks.
- Workout suggestions approach: Find the requested user, use their fitness goal and recent activity type to prioritize matching workouts, and attach a human-readable reason to each suggestion.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
	- Current result: 4 failures for missing required model fields; the idempotent seed test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend`
	- Current result: 4 failures. Activity and team creation return `501`, the leaderboard is empty, and workout suggestions ignore the requested user.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
	- Current result: 15 failures because every capability view is a placeholder without API rendering or loading, empty, and accessible error states.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
	- Pending after the backend contract tests pass.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
	- Pending after the frontend contract tests pass.
