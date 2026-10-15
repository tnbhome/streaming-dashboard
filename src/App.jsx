import { useState, useEffect } from 'react'
import './App.css'

const SUPPORTED_SERVICES = [
  { id: 'netflix', name: 'Netflix', tmdbId: 8 },
  { id: 'prime', name: 'Prime Video', tmdbId: 9 },
  { id: 'apple', name: 'Apple TV+', tmdbId: 350 },
  { id: 'peacock', name: 'Peacock', tmdbId: 387 },
  { id: 'hulu', name: 'Hulu', tmdbId: 15 },
  { id: 'max', name: 'Max', tmdbId: 1899 },
  { id: 'paramount', name: 'Paramount+', tmdbId: 531 },
  { id: 'disney', name: 'Disney+', tmdbId: 337 },
]

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
  const [subscriptions, setSubscriptions] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [filterMode, setFilterMode] = useState('all')
  const [subscriptionMatches, setSubscriptionMatches] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('tmdb-subscriptions')
    if (saved) {
      setSubscriptions(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedItem])

  const isSubscribed = (providerId) => {
    const service = SUPPORTED_SERVICES.find((s) => s.tmdbId === providerId)
    return service ? subscriptions.includes(service.id) : false
  }

  const hasSubscriptionMatch = (providers) => {
    if (!providers || providers.length === 0) return false
    return providers.some((provider) => isSubscribed(provider.provider_id))
  }

  const toggleSubscription = (serviceId) => {
    const newSubscriptions = subscriptions.includes(serviceId)
      ? subscriptions.filter((id) => id !== serviceId)
      : [...subscriptions, serviceId]
    setSubscriptions(newSubscriptions)
    localStorage.setItem('tmdb-subscriptions', JSON.stringify(newSubscriptions))
  }

  const getSubscriptionStatus = () => {
    if (!watchProviders) return null
    const hasMatch = hasSubscriptionMatch(watchProviders.flatrate || [])
    return hasMatch ? 'available' : 'not-available'
  }

  const searchTMDB = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])
    setSubscriptionMatches({})

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

      const matches = {}
      for (const item of filteredResults) {
        try {
          const mediaType = item.media_type === 'tv' ? 'tv' : 'movie'
          const providerResponse = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${item.id}/watch/providers?api_key=${apiKey}`
          )
          if (providerResponse.ok) {
            const providerData = await providerResponse.json()
            const usProviders = providerData.results?.US
            if (usProviders && usProviders.flatrate) {
              matches[item.id] = hasSubscriptionMatch(usProviders.flatrate)
            } else {
              matches[item.id] = false
            }
          }
        } catch (err) {
          matches[item.id] = false
        }
      }
      setSubscriptionMatches(matches)
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
      console.log('Raw TMDb watch provider response:', data)
      const usProviders = data.results?.US
      if (usProviders) {
        console.log('Provider counts:', {
          streaming: usProviders.flatrate?.length || 0,
          rent: usProviders.rent?.length || 0,
          buy: usProviders.buy?.length || 0,
        })
      }
      setWatchProviders(usProviders || null)
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
        <button
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ Settings
        </button>
        {showSettings && (
          <div className="settings-panel">
            <h3>My Subscriptions</h3>
            <div className="subscriptions-grid">
              {SUPPORTED_SERVICES.map((service) => (
                <label key={service.id} className="subscription-item">
                  <input
                    type="checkbox"
                    checked={subscriptions.includes(service.id)}
                    onChange={() => toggleSubscription(service.id)}
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
            <div className="filter-toggle">
              <label>
                <input
                  type="radio"
                  value="all"
                  checked={filterMode === 'all'}
                  onChange={(e) => setFilterMode(e.target.value)}
                />
                Show All Providers
              </label>
              <label>
                <input
                  type="radio"
                  value="subscriptions"
                  checked={filterMode === 'subscriptions'}
                  onChange={(e) => setFilterMode(e.target.value)}
                />
                Show Only My Services
              </label>
            </div>
          </div>
        )}
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
          <>
            {subscriptions.length > 0 && (
              <>
                <div className="results-section">
                  <h2 className="section-title">Available On My Services</h2>
                  {results.filter((item) => subscriptionMatches[item.id]).length > 0 ? (
                    <div className="results-grid">
                      {results
                        .filter((item) => subscriptionMatches[item.id])
                        .map((item) => {
                          const posterUrl = getPosterUrl(item.poster_path)
                          return (
                            <div
                              key={item.id}
                              className="result-card"
                              onClick={() => fetchItemDetails(item)}
                            >
                              <div className="subscription-badge available">
                                ✅ Available Now
                              </div>
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
                  ) : (
                    <div className="no-results">No titles available on your subscriptions</div>
                  )}
                </div>

                {filterMode === 'all' && (
                  <div className="results-section">
                    <h2 className="section-title">Available Elsewhere</h2>
                    {results.filter((item) => !subscriptionMatches[item.id]).length > 0 ? (
                      <div className="results-grid">
                        {results
                          .filter((item) => !subscriptionMatches[item.id])
                          .map((item) => {
                            const posterUrl = getPosterUrl(item.poster_path)
                            return (
                              <div
                                key={item.id}
                                className="result-card"
                                onClick={() => fetchItemDetails(item)}
                              >
                                <div className="subscription-badge not-available">
                                  ❌ Not In My Services
                                </div>
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
                    ) : (
                      <div className="no-results">No other titles available</div>
                    )}
                  </div>
                )}
              </>
            )}

            {subscriptions.length === 0 && (
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
          </>
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

                    {watchProviders === null && (
                      <div className="watch-providers">
                        <div className="no-provider-data">
                          <div className="no-provider-icon">ℹ️</div>
                          <div className="no-provider-title">
                            No watch provider information is currently available for this title from TMDb.
                          </div>
                          <div className="no-provider-explanation">
                            This title may not currently have streaming availability information, may be region-specific, or provider data may not yet be available.
                          </div>
                        </div>
                      </div>
                    )}

                    {watchProviders && (
                      <div className="watch-providers">
                        {getSubscriptionStatus() === 'available' && (
                          <div className="subscription-status available">
                            ✓ Available with My Subscriptions
                          </div>
                        )}
                        {getSubscriptionStatus() === 'not-available' && (
                          <>
                            <div className="subscription-status not-available">
                              ✗ Not Included in My Subscriptions
                            </div>
                            <div className="available-elsewhere-header">Available Elsewhere</div>
                          </>
                        )}

                        <div className="debug-info">
                          <div>Provider Count: {watchProviders ? Object.keys(watchProviders).length : 0}</div>
                          <div>Streaming: {watchProviders?.flatrate?.length || 0}</div>
                          <div>Rent: {watchProviders?.rent?.length || 0}</div>
                          <div>Buy: {watchProviders?.buy?.length || 0}</div>
                        </div>

                        {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                          <div className="provider-section">
                            <h4>Streaming</h4>
                            <div className="provider-list">
                              {watchProviders.flatrate.map((provider) => (
                                <div
                                  key={provider.provider_id}
                                  className={`provider-item ${
                                    isSubscribed(provider.provider_id) ? 'subscribed' : ''
                                  }`}
                                >
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
                                <div
                                  key={provider.provider_id}
                                  className={`provider-item ${
                                    isSubscribed(provider.provider_id) ? 'subscribed' : ''
                                  }`}
                                >
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
                                <div
                                  key={provider.provider_id}
                                  className={`provider-item ${
                                    isSubscribed(provider.provider_id) ? 'subscribed' : ''
                                  }`}
                                >
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
