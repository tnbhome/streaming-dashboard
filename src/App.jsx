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

const PREFERRED_STORES = [
  { id: 'apple-store', name: 'Apple TV', tmdbId: 2 },
  { id: 'prime-store', name: 'Amazon Video', tmdbId: 9 },
  { id: 'google-store', name: 'Google TV', tmdbId: 10 },
  { id: 'fandango-store', name: 'Fandango at Home', tmdbId: 38 },
]

const PROVIDER_LINKS = {
  8: { name: 'Netflix', url: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}` },
  9: { name: 'Amazon Prime Video', url: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}` },
  2: { name: 'Apple TV', url: (title) => `https://tv.apple.com/search?q=${encodeURIComponent(title)}` },
  387: { name: 'Peacock', url: (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}` },
  15: { name: 'Hulu', url: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}` },
  337: { name: 'Disney+', url: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}` },
  1899: { name: 'Max', url: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}` },
  531: { name: 'Paramount+', url: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}` },
  10: { name: 'Google Play Movies', url: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}` },
  68: { name: 'YouTube', url: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}` },
  38: { name: 'Fandango at Home', url: (title) => `https://www.fandangonow.com/search?q=${encodeURIComponent(title)}` },
}

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
  const [preferredStores, setPreferredStores] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [filterMode, setFilterMode] = useState('all')
  const [subscriptionMatches, setSubscriptionMatches] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('tmdb-subscriptions')
    if (saved) {
      setSubscriptions(JSON.parse(saved))
    }

    const savedStores = localStorage.getItem('tmdb-preferred-stores')
    if (savedStores) {
      setPreferredStores(JSON.parse(savedStores))
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

  const isPreferredStore = (providerId) => {
    const store = PREFERRED_STORES.find((s) => s.tmdbId === providerId)
    return store ? preferredStores.includes(store.id) : false
  }

  const hasSubscriptionMatch = (providers) => {
    if (!providers || providers.length === 0) return false
    return providers.some((provider) => isSubscribed(provider.provider_id))
  }

  const hasPreferredStoreMatch = (providers) => {
    if (!providers || providers.length === 0) return false
    return providers.some((provider) => isPreferredStore(provider.provider_id))
  }

  const toggleSubscription = (serviceId) => {
    const newSubscriptions = subscriptions.includes(serviceId)
      ? subscriptions.filter((id) => id !== serviceId)
      : [...subscriptions, serviceId]
    setSubscriptions(newSubscriptions)
    localStorage.setItem('tmdb-subscriptions', JSON.stringify(newSubscriptions))
  }

  const togglePreferredStore = (storeId) => {
    const newStores = preferredStores.includes(storeId)
      ? preferredStores.filter((id) => id !== storeId)
      : [...preferredStores, storeId]
    setPreferredStores(newStores)
    localStorage.setItem('tmdb-preferred-stores', JSON.stringify(newStores))
  }

  const classifyAvailability = (providers) => {
    if (!providers) return 'unknown'

    const hasStreaming = hasSubscriptionMatch(providers.flatrate || [])
    const hasStore = hasPreferredStoreMatch(providers.rent || []) ||
                    hasPreferredStoreMatch(providers.buy || [])

    if (hasStreaming) return 'included-in-services'
    if (hasStore) return 'available-through-stores'
    if (providers.flatrate?.length || providers.rent?.length || providers.buy?.length) {
      return 'requires-another-subscription'
    }
    return 'unknown'
  }

  const getAvailabilityStatus = () => {
    return classifyAvailability(watchProviders)
  }

  const getAvailabilityMessage = () => {
    const status = getAvailabilityStatus()
    switch (status) {
      case 'included-in-services':
        return '✓ Included In My Services'
      case 'available-through-stores':
        return '🛒 Available Through My Stores'
      case 'requires-another-subscription':
        return '✗ Requires Another Subscription'
      case 'unknown':
        return 'ℹ️ Availability Unknown'
      default:
        return ''
    }
  }

  const groupProviders = () => {
    if (!watchProviders) return []

    const providerMap = new Map()

    const addProvider = (provider, type) => {
      const id = provider.provider_id
      if (!providerMap.has(id)) {
        providerMap.set(id, {
          ...provider,
          types: [],
        })
      }
      providerMap.get(id).types.push(type)
    }

    watchProviders.flatrate?.forEach((p) => addProvider(p, 'stream'))
    watchProviders.rent?.forEach((p) => addProvider(p, 'rent'))
    watchProviders.buy?.forEach((p) => addProvider(p, 'buy'))

    return Array.from(providerMap.values())
  }

  const getProviderLink = (providerId, title) => {
    const providerLink = PROVIDER_LINKS[providerId]
    if (providerLink) {
      const url = providerLink.url(title)
      if (url && url.startsWith('http')) {
        return url
      }
    }
    return null
  }

  const hasProviderLink = (providerId) => {
    return PROVIDER_LINKS.hasOwnProperty(providerId)
  }

  const openProviderLink = (providerId, title) => {
    const link = getProviderLink(providerId, title)
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
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
            matches[item.id] = classifyAvailability(usProviders)
          } else {
            matches[item.id] = 'unknown'
          }
        } catch (err) {
          matches[item.id] = 'unknown'
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

            <h3>Preferred Stores</h3>
            <div className="subscriptions-grid">
              {PREFERRED_STORES.map((store) => (
                <label key={store.id} className="subscription-item">
                  <input
                    type="checkbox"
                    checked={preferredStores.includes(store.id)}
                    onChange={() => togglePreferredStore(store.id)}
                  />
                  <span>{store.name}</span>
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
                  <h2 className="section-title">Included In My Services</h2>
                  {results.filter((item) => subscriptionMatches[item.id] === 'included-in-services').length > 0 ? (
                    <div className="results-grid">
                      {results
                        .filter((item) => subscriptionMatches[item.id] === 'included-in-services')
                        .map((item) => {
                          const posterUrl = getPosterUrl(item.poster_path)
                          return (
                            <div
                              key={item.id}
                              className="result-card"
                              onClick={() => fetchItemDetails(item)}
                            >
                              <div className="subscription-badge included-in-services">
                                ✓ Included In My Services
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
                    <div className="no-results">No titles included in your subscriptions</div>
                  )}
                </div>

                {filterMode === 'all' && (
                  <>
                    <div className="results-section">
                      <h2 className="section-title">Available Through My Stores</h2>
                      {results.filter((item) => subscriptionMatches[item.id] === 'available-through-stores').length > 0 ? (
                        <div className="results-grid">
                          {results
                            .filter((item) => subscriptionMatches[item.id] === 'available-through-stores')
                            .map((item) => {
                              const posterUrl = getPosterUrl(item.poster_path)
                              return (
                                <div
                                  key={item.id}
                                  className="result-card"
                                  onClick={() => fetchItemDetails(item)}
                                >
                                  <div className="subscription-badge available-through-stores">
                                    🛒 Available Through My Stores
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
                        <div className="no-results">No titles available through your stores</div>
                      )}
                    </div>

                    <div className="results-section">
                      <h2 className="section-title">Requires Another Subscription</h2>
                      {results.filter((item) => subscriptionMatches[item.id] === 'requires-another-subscription').length > 0 ? (
                        <div className="results-grid">
                          {results
                            .filter((item) => subscriptionMatches[item.id] === 'requires-another-subscription')
                            .map((item) => {
                              const posterUrl = getPosterUrl(item.poster_path)
                              return (
                                <div
                                  key={item.id}
                                  className="result-card"
                                  onClick={() => fetchItemDetails(item)}
                                >
                                  <div className="subscription-badge requires-another-subscription">
                                    ✗ Requires Another Subscription
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
                        <div className="no-results">No titles requiring another subscription</div>
                      )}
                    </div>

                    <div className="results-section">
                      <h2 className="section-title">Availability Unknown</h2>
                      {results.filter((item) => subscriptionMatches[item.id] === 'unknown').length > 0 ? (
                        <div className="results-grid">
                          {results
                            .filter((item) => subscriptionMatches[item.id] === 'unknown')
                            .map((item) => {
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
                      ) : (
                        <div className="no-results">No titles with unknown availability</div>
                      )}
                    </div>
                  </>
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
                        <div className={`subscription-status ${getAvailabilityStatus()}`}>
                          {getAvailabilityMessage()}
                        </div>

                        {groupProviders().length > 0 && (
                          <>
                            <div className="provider-section">
                              <h4>Available To Me Now</h4>
                              <div className="provider-list">
                                {groupProviders()
                                  .filter((p) => isSubscribed(p.provider_id) || isPreferredStore(p.provider_id))
                                  .map((provider) => {
                                    const hasLink = hasProviderLink(provider.provider_id)
                                    return (
                                      <div
                                        key={provider.provider_id}
                                        className={`provider-item ${
                                          isSubscribed(provider.provider_id) || isPreferredStore(provider.provider_id) ? 'subscribed' : ''
                                        } ${!hasLink ? 'disabled' : ''}`}
                                        onClick={() => hasLink && openProviderLink(provider.provider_id, itemDetails.title || itemDetails.name)}
                                        title={hasLink ? 'Open Provider' : 'Provider link unavailable'}
                                      >
                                        <span className="provider-name">{provider.provider_name}</span>
                                        <img
                                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                          alt={provider.provider_name}
                                          className="provider-logo"
                                        />
                                        <div className="provider-tags">
                                          {provider.types.includes('stream') && (
                                            <span className="provider-tag stream">STREAM</span>
                                          )}
                                          {provider.types.includes('rent') && (
                                            <span className="provider-tag rent">RENT</span>
                                          )}
                                          {provider.types.includes('buy') && (
                                            <span className="provider-tag buy">BUY</span>
                                          )}
                                        </div>
                                        <span className="provider-action">
                                          {hasLink ? 'Open Provider' : 'Provider link unavailable'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                {groupProviders().filter((p) => isSubscribed(p.provider_id) || isPreferredStore(p.provider_id)).length === 0 && (
                                  <div className="no-providers">No providers available through your services</div>
                                )}
                              </div>
                            </div>

                            <div className="provider-section">
                              <h4>Requires Another Service</h4>
                              <div className="provider-list">
                                {groupProviders()
                                  .filter((p) => !isSubscribed(p.provider_id) && !isPreferredStore(p.provider_id))
                                  .map((provider) => {
                                    const hasLink = hasProviderLink(provider.provider_id)
                                    return (
                                      <div
                                        key={provider.provider_id}
                                        className={`provider-item ${!hasLink ? 'disabled' : ''}`}
                                        onClick={() => hasLink && openProviderLink(provider.provider_id, itemDetails.title || itemDetails.name)}
                                        title={hasLink ? 'Open Provider' : 'Provider link unavailable'}
                                      >
                                        <span className="provider-name">{provider.provider_name}</span>
                                        <img
                                          src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                          alt={provider.provider_name}
                                          className="provider-logo"
                                        />
                                        <div className="provider-tags">
                                          {provider.types.includes('stream') && (
                                            <span className="provider-tag stream">STREAM</span>
                                          )}
                                          {provider.types.includes('rent') && (
                                            <span className="provider-tag rent">RENT</span>
                                          )}
                                          {provider.types.includes('buy') && (
                                            <span className="provider-tag buy">BUY</span>
                                          )}
                                        </div>
                                        <span className="provider-action">
                                          {hasLink ? 'Open Provider' : 'Provider link unavailable'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                {groupProviders().filter((p) => !isSubscribed(p.provider_id) && !isPreferredStore(p.provider_id)).length === 0 && (
                                  <div className="no-providers">No other providers available</div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {groupProviders().length === 0 && (
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
