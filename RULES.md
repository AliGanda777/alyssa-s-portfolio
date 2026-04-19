# Workflow Rules for Portfolio Website

Follow these rules every time you work on the website.

## 1. Keep the server running
- Start a local web server from the workspace root:
  ```bash
  python3 -m http.server 8000
  ```
- Do not close the terminal while you want the website available.
- If the terminal stops, restart the server and reload the page.

## 2. Website access link
- Open the portfolio in your browser at:
  ```
  http://localhost:8000
  ```
- If you use a VS Code Live Server extension, use the URL it provides instead.

## 3. Auto-update workflow
- When code changes are saved, refresh the browser page.
- If using Live Server, the page should update automatically.
- If using `python3 -m http.server`, manual reload is required.

## 4. What I will do for you
- When I update the code, I will tell you the website link to open.
- I will remind you to keep the terminal running so the site stays live.

## 5. Helpful commands
- Start the server:
  ```bash
  cd /workspaces/codespaces-blank
  python3 -m http.server 8000
  ```
- Stop the server: press `Ctrl+C` in the terminal.
- Refresh the page after saving code changes.

## 6. Notes
- The website only stays available while the server is running.
- If you want a live preview experience, use the VS Code Live Server extension.
