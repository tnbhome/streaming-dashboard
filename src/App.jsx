import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const searchTMDB = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    searchTMDB()
  }

  const getPosterUrl = (posterPath) => {
    if (!posterPath) return null
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getReleaseDate = (item) => {
    return item.release_date || item.first_air_date || 'N/A'
  }

  const getRating = (item) => {
    return item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
  }

  return (
    <div className="app">
      <header className="header">
        <h1>TMDb Search</h1>
        <form className="search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies and TV shows..."
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </header>

      <main className="main">
        {error && <div className="error">{error}</div>}

        {loading && <div className="loading">Loading...</div>}

        {!loading && !error && results.length === 0 && query && (
          <div className="no-results">No results found</div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="results-grid">
            {results.map((item) => {
              const posterUrl = getPosterUrl(item.poster_path)
              return (
                <div key={item.id} className="result-card">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={item.title || item.name}
                      className="poster"
                    />
                  ) : (
                    <div className="poster-placeholder">No Image</div>
                  )}
                  <div className="card-content">
                    <h3 className="title">{item.title || item.name}</h3>
                    <div className="meta">
                      <span className="media-type">
                        {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                      </span>
                      <span className="release-date">
                        {getReleaseDate(item)}
                      </span>
                    </div>
                    <div className="rating">★ {getRating(item)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
