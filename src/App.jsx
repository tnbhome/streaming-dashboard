import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [itemDetails, setItemDetails] = useState(null)
  const [watchProviders, setWatchProviders] = useState(null)

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
      const filteredResults = (data.results || []).filter(
        (item) =>
          item.media_type === 'movie' ||
          item.media_type === 'tv'
      ).filter(
        (item) =>
          item.poster_path &&
          (item.title || item.name) &&
          item.overview
      )
      setResults(filteredResults)
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

  const fetchItemDetails = async (item) => {
    if (item.media_type !== 'movie' && item.media_type !== 'tv') {
      return
    }

    setSelectedItem(item)
    setModalLoading(true)
    setModalError(null)
    setItemDetails(null)
    setWatchProviders(null)

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${item.id}?api_key=${apiKey}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch details')
      }

      const data = await response.json()
      setItemDetails(data)

      fetchWatchProviders(mediaType, item.id)
    } catch (err) {
      setModalError(err.message)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedItem(null)
    setItemDetails(null)
    setWatchProviders(null)
    setModalError(null)
  }

  const fetchWatchProviders = async (mediaType, itemId) => {
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${itemId}/watch/providers?api_key=${apiKey}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch watch providers')
      }

      const data = await response.json()
      setWatchProviders(data.results?.US || null)
    } catch (err) {
      console.error('Error fetching watch providers:', err)
      setWatchProviders(null)
    }
  }

  const getBackdropUrl = (backdropPath) => {
    if (!backdropPath) return null
    return `https://image.tmdb.org/t/p/w1280${backdropPath}`
  }

  const getLargePosterUrl = (posterPath) => {
    if (!posterPath) return null
    return `https://image.tmdb.org/t/p/w780${posterPath}`
  }

  const getRuntime = (details) => {
    if (details.runtime) return `${details.runtime} min`
    if (details.episode_run_time && details.episode_run_time[0]) {
      return `${details.episode_run_time[0]} min`
    }
    return 'N/A'
  }

  const getYear = (item) => {
    const date = item.release_date || item.first_air_date
    return date ? date.split('-')[0] : 'N/A'
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
                <div
                  key={item.id}
                  className="result-card"
                  onClick={() => fetchItemDetails(item)}
                >
                  <img
                    src={posterUrl}
                    alt={item.title || item.name}
                    className="poster"
                  />
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

      {selectedItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            {modalLoading && <div className="modal-loading">Loading...</div>}

            {modalError && <div className="modal-error">{modalError}</div>}

            {itemDetails && (
              <div className="modal-body">
                {getBackdropUrl(itemDetails.backdrop_path) && (
                  <div className="modal-backdrop">
                    <img
                      src={getBackdropUrl(itemDetails.backdrop_path)}
                      alt=""
                      className="backdrop-image"
                    />
                  </div>
                )}

                <div className="modal-info">
                  <div className="modal-poster">
                    {getLargePosterUrl(itemDetails.poster_path) ? (
                      <img
                        src={getLargePosterUrl(itemDetails.poster_path)}
                        alt={itemDetails.title || itemDetails.name}
                        className="modal-poster-image"
                      />
                    ) : (
                      <div className="modal-poster-placeholder">No Image</div>
                    )}
                  </div>

                  <div className="modal-details">
                    <h2 className="modal-title">
                      {itemDetails.title || itemDetails.name}
                    </h2>
                    <div className="modal-meta">
                      <span className="modal-year">{getYear(itemDetails)}</span>
                      <span className="modal-runtime">
                        {getRuntime(itemDetails)}
                      </span>
                      <span className="modal-rating">
                        ★ {itemDetails.vote_average?.toFixed(1) || 'N/A'}
                      </span>
                    </div>

                    {itemDetails.genres && itemDetails.genres.length > 0 && (
                      <div className="modal-genres">
                        {itemDetails.genres.map((genre) => (
                          <span key={genre.id} className="genre-tag">
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {itemDetails.overview && (
                      <div className="modal-overview">
                        <h3>Overview</h3>
                        <p>{itemDetails.overview}</p>
                      </div>
                    )}

                    {watchProviders && (
                      <div className="watch-providers">
                        {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                          <div className="provider-section">
                            <h4>Streaming</h4>
                            <div className="provider-list">
                              {watchProviders.flatrate.map((provider) => (
                                <div key={provider.provider_id} className="provider-item">
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="provider-logo"
                                  />
                                  <span className="provider-name">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {watchProviders.rent && watchProviders.rent.length > 0 && (
                          <div className="provider-section">
                            <h4>Rent</h4>
                            <div className="provider-list">
                              {watchProviders.rent.map((provider) => (
                                <div key={provider.provider_id} className="provider-item">
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="provider-logo"
                                  />
                                  <span className="provider-name">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {watchProviders.buy && watchProviders.buy.length > 0 && (
                          <div className="provider-section">
                            <h4>Buy</h4>
                            <div className="provider-list">
                              {watchProviders.buy.map((provider) => (
                                <div key={provider.provider_id} className="provider-item">
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                    alt={provider.provider_name}
                                    className="provider-logo"
                                  />
                                  <span className="provider-name">{provider.provider_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!watchProviders.flatrate?.length &&
                          !watchProviders.rent?.length &&
                          !watchProviders.buy?.length && (
                            <div className="no-providers">No watch providers available</div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
