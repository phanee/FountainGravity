# Daylist — To-do list app

A lightweight, responsive to-do list built with plain HTML, CSS, and JavaScript. No build step, framework, backend, or account required.

## Run locally

Open `index.html` in a modern browser, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Features

- Create, edit, complete, and delete tasks
- Optional due dates and low / medium / high priorities
- All tasks, today, upcoming, and completed views
- Search tasks and sort by due date, priority, or recently added
- Daily completion progress
- Light and dark themes
- Responsive desktop and mobile layout
- Tasks and theme preference saved in browser local storage

## Data and privacy

Tasks are stored locally in the browser using `localStorage`. They are not sent to a server and do not automatically sync across browsers or devices. Clearing browser storage removes locally saved tasks.

## Project structure

- `index.html` — app structure
- `styles.css` — responsive styling and themes
- `app.js` — task operations, filters, sorting, and local persistence

Designed for current versions of Chrome, Firefox, Safari, and Edge.
