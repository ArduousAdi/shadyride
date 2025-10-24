import React, { useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 as LoaderCircle, Sun, MapPin } from 'lucide-react';
import MapView from './components/MapView';
import ResultsCard from './components/ResultsCard';
import SunChart from './components/SunChart';
import AutoCompleteInput from './components/AutoCompleteInput';
import ThemeToggle from "./components/ThemeToggle"; // ✅ import toggle

/**
 * Main application component handling user input, calling the API and rendering results.
 */
const App = () => {
  const now = new Date();
  // Prepopulate date and time inputs with local values
  const initialDate = now.toISOString().split('T')[0];
  const pad = (n) => (n < 10 ? `0${n}` : n);
  const initialTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  /**
   * Geocode a human address to {lat, lon}. Uses Nominatim.
   * Returns null on failure.
   */
  const geocode = async (query) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;
    try {
      const resp = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'shade-app-demo' },
      });
      if (!resp.ok) throw new Error('Geocoding failed');
      const data = await resp.json();
      if (data.length === 0) return null;
      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!originQuery.trim() || !destQuery.trim()) {
      setError('Please enter both origin and destination.');
      return;
    }
    setLoading(true);
    try {
      // Determine coordinates: prefer selected suggestion; fallback to geocode free-form text
      let origin;
      let destination;
      if (selectedOrigin && selectedOrigin.lat && selectedOrigin.lon) {
        origin = {
          lat: parseFloat(selectedOrigin.lat),
          lon: parseFloat(selectedOrigin.lon),
        };
      } else {
        origin = await geocode(originQuery);
      }
      if (selectedDest && selectedDest.lat && selectedDest.lon) {
        destination = {
          lat: parseFloat(selectedDest.lat),
          lon: parseFloat(selectedDest.lon),
        };
      } else {
        destination = await geocode(destQuery);
      }
      if (!origin || !destination) {
        setError('Unable to find one or both addresses.');
        setLoading(false);
        return;
      }
      // Construct ISO datetime string
      const isoDateTime = new Date(`${date}T${time}:00`).toISOString();
      const response = await axios.post('/api/shade', {
        origin,
        destination,
        datetime: isoDateTime,
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      {/* ===== Header with Title + Dark Mode Toggle ===== */}
      <header className="flex flex-wrap items-center justify-between max-w-4xl mx-auto p-4 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Sun className="text-yellow-500 w-6 h-6 sm:w-8 sm:h-8" /> Shade Decider
        </h1>
        <ThemeToggle /> {/* ✅ Dark mode toggle button */}
      </header>

      {/* ===== Main Content ===== */}
      <main className="max-w-4xl mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-end"
        >
          <AutoCompleteInput
            label="Origin"
            placeholder="Enter starting address"
            onQueryChange={(val) => setOriginQuery(val)}
            onSelect={(item) => {
              if (item) {
                setSelectedOrigin(item);
                setOriginQuery(item.display_name);
              } else {
                setSelectedOrigin(null);
              }
            }}
          />
          <AutoCompleteInput
            label="Destination"
            placeholder="Enter destination address"
            onQueryChange={(val) => setDestQuery(val)}
            onSelect={(item) => {
              if (item) {
                setSelectedDest(item);
                setDestQuery(item.display_name);
              } else {
                setSelectedDest(null);
              }
            }}
          />
          <div className="flex flex-col">
            <label
              htmlFor="date"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800"
              required
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="time"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800"
              required
            />
          </div>
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Calculating...
                </span>
              ) : (
                <span className="inline-flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> Calculate
                </span>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* ===== Results Section ===== */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="results"
              className="flex flex-col gap-6"
            >
              <ResultsCard result={result} />
              <MapView coordinates={result.coordinates} />
              <SunChart data={result.chartData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
