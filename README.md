# Shade Decider Web App

This repository contains a full‑stack web application that predicts which side of a moving vehicle will be shaded during a trip. It uses map data and solar geometry to estimate whether the sun will be on the left or right side of the vehicle and provides a simple chart visualising the exposure along the route.

The project is intentionally designed to be lightweight yet feature rich. It uses a Node/Express backend with optional calls to the OpenRouteService API and a modern React frontend built with Vite, Tailwind CSS, Framer Motion and Recharts.

## Features

* **Route analysis** – Given an origin, destination and departure time the API calculates headings along the route and uses the current sun position to determine which side of the vehicle will be illuminated.
* **Daylight awareness** – The backend checks local sunrise and sunset times; if the trip occurs in darkness it returns an appropriate message.
* **Interactive UI** – Users can enter addresses, pick a date and time and receive an animated result card describing the recommended side. A map with the route polyline and a chart of sun exposure make the results easy to understand.
* **No login** – The application is entirely stateless and does not require authentication or persistent storage.

## Project structure

```
shade-app/
│   README.md           – This file
│
├── backend/            – Node/Express API
│   ├── index.js        – Main server file with API routes
│   ├── package.json    – Backend dependencies and scripts
│   └── .env.example    – Sample environment variables
│
└── frontend/           – React/Vite frontend
    ├── index.html      – HTML template
    ├── package.json    – Frontend dependencies and scripts
    ├── vite.config.js  – Vite configuration (with API proxy)
    ├── postcss.config.cjs
    ├── tailwind.config.cjs
    └── src/
        ├── main.jsx    – React entry point
        ├── App.jsx     – Root component with UI logic
        ├── index.css   – Tailwind base imports
        └── components/
            ├── MapView.jsx  – Leaflet map component
            ├── ResultsCard.jsx – Animated results card
            └── SunChart.jsx – Chart component for exposure
```

## Getting started

These instructions assume you have [Node.js](https://nodejs.org/) installed locally. The project uses PNPM, NPM or Yarn interchangeably—use whichever you prefer.

1. **Clone the repository** and change into the project directory:

   ```bash
   git clone <this-repo>
   cd shade-app
   ```

2. **Backend setup**

   ```bash
   cd backend
   cp .env.example .env  # add your OpenRouteService API key here
   npm install
   npm start
   ```

   The backend listens on port `4000` by default and exposes a single endpoint at `/api/shade`. You can adjust the port via the `PORT` environment variable.

3. **Frontend setup** (in a new terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   This starts Vite’s development server (usually on port `5173`). It proxies API requests beginning with `/api` to the backend, so your frontend and backend can run concurrently during development.

4. **Production build**

   To generate a production build of the frontend and serve it from the backend you could build the client and copy the `dist` folder into the backend’s static folder. A simplified example:

   ```bash
   # from the frontend directory
   npm run build
   # copy build into backend
   cp -r dist ../backend/public
   ```

   Modify `backend/index.js` to serve static files from `public` in production if desired.

## Environment variables

The API requires an OpenRouteService API key for optimal accuracy. Without one, the server falls back to a simple straight–line route between the start and end coordinates.

```
ORS_API_KEY=your_api_key_here
PORT=4000
WEATHER_API_KEY=your_openweathermap_api_key_here
```

## How it works

1. The frontend collects the origin, destination and date/time from the user. It geocodes the addresses using OpenStreetMap’s Nominatim service on the client.
2. These coordinates are sent to the backend’s `/api/shade` endpoint along with the desired departure time.
3. The backend attempts to fetch a polyline from OpenRouteService (driving directions). If that fails (for example when running offline), it falls back to a simple two–point route.
4. The server uses the [SunCalc](https://github.com/mourner/suncalc) library to compute the sun’s azimuth and elevation at multiple points along the route and at the given time. From that, it determines whether the sun is on the left or right relative to the vehicle’s heading.
5. A JSON response is returned containing the recommended **shade_side**, the **sun_side**, sunrise/sunset times, the route coordinates and per–segment analysis data.
6. The frontend animates a results card, draws the route on a map and shows a bar chart of sun exposure along the trip.

Enjoy exploring comfortable seats on your journeys! ✨🚌