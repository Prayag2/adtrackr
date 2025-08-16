# AdTrackr API Reference

This document describes the available API endpoints for user management and authentication in the AdTrackr backend.

## Authentication

### POST /login
- **Description:** Log in a user and start a session.
- **Body:** `{ "username": string, "password": string }`
- **Response:** `{ success: true, user: { id, username, role } }` on success, or `{ error }` on failure.

### POST /logout
- **Description:** Log out the current user and destroy the session.
- **Response:** `{ success: true }`

## User Management (Admins only)
All endpoints below require the user to be logged in as an admin. Sessions are used for authentication.

### POST /users
- **Description:** Create a new user (admin or manager).
- **Body:** `{ "username": string, "email": string, "password": string, "role": "admin" | "manager" }`
- **Response:** `{ id, username, email, role }` on success, or `{ error }` on failure.

### GET /users
- **Description:** List all users.
- **Response:** `[{ id, username, email, role, created_at }, ...]`

### GET /users/:id
- **Description:** Get details of a single user by ID.
- **Response:** `{ id, username, email, role, created_at }` or `{ error }` if not found.

### PUT /users/:id
- **Description:** Update user details.
- **Body:** Any of `{ "username", "email", "password", "role" }` (all optional)
- **Response:** Updated user object or `{ error }` if not found/invalid.

### DELETE /users/:id
- **Description:** Delete a user by ID.
- **Response:** `{ success: true }` or `{ error }` if not found.


## Client Management (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### POST /clients
- **Description:** Add a new client.
- **Body:** `{ "name": string, "industry"?: string, "contact_email": string }`
- **Response:** The created client object or `{ error }` on failure.

### GET /clients
- **Description:** List all clients.
- **Response:** `[{ id, name, industry, contact_email, created_at }, ...]`

### GET /clients/:id
- **Description:** Get details of a single client by ID.
- **Response:** `{ id, name, industry, contact_email, created_at }` or `{ error }` if not found.

### PUT /clients/:id
- **Description:** Update client details.
- **Body:** Any of `{ "name", "industry", "contact_email" }` (all optional)
- **Response:** Updated client object or `{ error }` if not found/invalid.

### DELETE /clients/:id
- **Description:** Delete a client by ID (cascades to delete campaigns).
- **Response:** `{ success: true }` or `{ error }` if not found.


## Platform Management (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### POST /platforms
- **Description:** Add a new ad platform (e.g., Google Ads, FB Ads).
- **Body:** `{ "name": string }`
- **Response:** The created platform object or `{ error }` on failure.

### GET /platforms
- **Description:** List all ad platforms.
- **Response:** `[{ id, name }, ...]`

### DELETE /platforms/:id
- **Description:** Remove a platform by ID.
- **Response:** `{ success: true }` or `{ error }` if not found.

## Campaign Management (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### POST /campaigns
- **Description:** Create a new campaign.
- **Body:** `{ "client_id": number, "created_by"?: number, "campaign_name": string, "budget"?: number, "start_date": string (YYYY-MM-DD), "end_date": string (YYYY-MM-DD), "status"?: string, "platform_ids"?: number[], "tag_ids"?: number[] }`
- **Response:** The created campaign object, including `platforms`, `tags`, and `client` fields, or `{ error }` on failure.

### GET /campaigns
- **Description:** List all campaigns (with platforms, tags, client).
- **Response:** `[{ ...campaign, platforms: [name, ...], tags: [name, ...], client: { id, name } }, ...]`

### GET /campaigns/:id
- **Description:** Get single campaign details (with platforms, tags, client).
- **Response:** `{ ...campaign, platforms: [name, ...], tags: [name, ...], client: { id, name } }` or `{ error }` if not found.

### PUT /campaigns/:id
- **Description:** Update campaign details.
- **Body:** Any of `{ "client_id", "created_by", "campaign_name", "budget", "start_date", "end_date", "status", "platform_ids", "tag_ids" }` (all optional)
- **Response:** Updated campaign object (with platforms, tags, client) or `{ error }` if not found/invalid.

### DELETE /campaigns/:id
- **Description:** Delete a campaign by ID (cascades to delete metrics).
- **Response:** `{ success: true }` or `{ error }` if not found.

## Tag Management (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### POST /tags
- **Description:** Add a new tag.
- **Body:** `{ "name": string }`
- **Response:** The created tag object or `{ error }` on failure.

### GET /tags
- **Description:** List all tags.
- **Response:** `[{ id, name }, ...]`

### DELETE /tags/:id
- **Description:** Remove a tag by ID.
- **Response:** `{ success: true }` or `{ error }` if not found.

## Metrics Management (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### POST /metrics/upload-csv
- **Description:** Upload a CSV file of metrics for a campaign. The file must be sent as `multipart/form-data` with the field name `file` and a `campaign_id` in the body. The CSV columns must be: `date,impressions,clicks,conversions,cost_per_click,spend`.
- **Response:** `{ success: true, inserted: number, errors: [ { row, error, missing } ] }` or `{ error }` on failure.

### GET /metrics
- **Description:** List metrics, with optional filters and pagination.
- **Query Params:** `campaignId`, `from` (date), `to` (date), `page`, `pageSize`
- **Response:** `{ total, page, pageSize, data: [ ...metrics ] }`

### GET /metrics/:id
- **Description:** Get a single metric by ID.
- **Response:** The metric object or `{ error }` if not found.

### PUT /metrics/:id
- **Description:** Update a metric by ID.
- **Body:** Any of `{ "date", "impressions", "clicks", "conversions", "cost_per_click", "spend" }` (all optional)
- **Response:** Updated metric object or `{ error }` if not found/invalid.

### DELETE /metrics/:id
- **Description:** Delete a metric by ID.
- **Response:** `{ success: true }` or `{ error }` if not found.

## Reports (Managers/Admins only)
All endpoints below require the user to be logged in as a manager or admin. Sessions are used for authentication.

### GET /reports/top-campaigns?by=ctr|conversions&limit=5&from=YYYY-MM-DD&to=YYYY-MM-DD
- **Description:** Get the top campaigns by CTR (click-through rate) or conversions in a date range.
- **Query Params:**
  - `by`: `ctr` (default) or `conversions`
  - `limit`: number of results (default 5)
  - `from`, `to`: date range (YYYY-MM-DD)
- **Response:** Array of campaign stats, each with campaign info and metric.

### GET /reports/summary?clientId=&from=&to=
- **Description:** Get summary stats (totals, averages, CTR, CPC) for a client or all clients in a date range.
- **Query Params:**
  - `clientId`: filter by client
  - `from`, `to`: date range (YYYY-MM-DD)
- **Response:** Object with totals, averages, CTR, CPC.

### GET /reports/export?campaignId=&from=&to=
- **Description:** Download campaign metrics as a CSV file for a date range.
- **Query Params:**
  - `campaignId`: filter by campaign
  - `from`, `to`: date range (YYYY-MM-DD)
- **Response:** CSV file with columns: date, impressions, clicks, conversions, cpc, spend

## Notes
- All requests and responses use JSON.
- You must be logged in as an admin to access `/users` endpoints, or as a manager/admin to access `/clients` and `/platforms` endpoints.
- Sessions are stored in PostgreSQL and managed automatically.
- For production, use HTTPS and set a strong `SESSION_SECRET`.
