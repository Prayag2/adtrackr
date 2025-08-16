
# AdTrackr

Read [API docs](./API.md) for information about the API.

## Testing Instructions

> If using nix, you can use devenv to setup the dev environment

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up PostgreSQL:**
   - Ensure PostgreSQL is running and accessible.
   - Update the connection string in `src/index.js` if needed.
   - The dev shell (via Nix) provides `postgresql` if using flakes.

3. **Start the server:**
   ```sh
   npm start
   ```

4. **Create an admin user:**
   - Manually insert an admin into the `users` table (see API.md for instructions), or add a temporary registration endpoint.

5. **Log in:**
   - Use the `/login` endpoint to obtain a session.
   - Use a tool like Postman or curl with cookie support:
     ```sh
     curl -X POST http://localhost:3000/login \
       -H "Content-Type: application/json" \
       -c cookie.txt \
       -d '{"username":"admin","password":"yourpassword"}'
     ```

6. **Test endpoints:**
   - Use the session cookie (`-b cookie.txt` with curl) for all further requests.
   - Refer to `API.md` for endpoint details, required fields, and response formats.

7. **CSV Upload:**
   - Use `/metrics/upload-csv` with `multipart/form-data` (field name: `file`, plus `campaign_id` in the body).

8. **Run reports:**
   - Use `/reports/top-campaigns`, `/reports/summary`, and `/reports/export` as described in `API.md`.

9. **Stop the server:**
   - Press `Ctrl+C` in the terminal running the server.

---

For more details on endpoints and usage, see the [API.md](./API.md) file.
