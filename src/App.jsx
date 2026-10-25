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
  'Netflix': {
    url: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `nflx://com.netflix.mediaclient/router?route=/search&searchTerm=${encodeURIComponent(title)}`
  },
  'Amazon Prime Video': {
    url: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    deepLink: (title) => `intent://www.amazon.com/s?k=${encodeURIComponent(title)}#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end`
  },
  'Amazon Video': {
    url: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    deepLink: (title) => `intent://www.amazon.com/s?k=${encodeURIComponent(title)}#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end`
  },
  'Amazon': {
    url: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}`,
    deepLink: (title) => `intent://www.amazon.com/s?k=${encodeURIComponent(title)}#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end`
  },
  'Apple TV': {
    url: (title) => `https://tv.apple.com/us/search?term=${encodeURIComponent(title)}`,
    deepLink: (title) => `https://tv.apple.com/us/search?term=${encodeURIComponent(title)}`
  },
  'Apple TV+': {
    url: (title) => `https://tv.apple.com/us/search?term=${encodeURIComponent(title)}`,
    deepLink: (title) => `https://tv.apple.com/us/search?term=${encodeURIComponent(title)}`
  },
  'Peacock': {
    url: (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `peacock://search?q=${encodeURIComponent(title)}`
  },
  'Hulu': {
    url: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `hulu://search?q=${encodeURIComponent(title)}`
  },
  'Disney+': {
    url: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `disneyplus://search?q=${encodeURIComponent(title)}`
  },
  'Disney Plus': {
    url: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `disneyplus://search?q=${encodeURIComponent(title)}`
  },
  'Max': {
    url: (title) => `https://www.max.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `max://search?q=${encodeURIComponent(title)}`
  },
  'Paramount+': {
    url: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `paramountplus://search?q=${encodeURIComponent(title)}`
  },
  'Paramount Plus': {
    url: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `paramountplus://search?q=${encodeURIComponent(title)}`
  },
  'Google Play Movies': {
    url: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`,
    deepLink: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`
  },
  'Google Play': {
    url: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`,
    deepLink: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=movies`
  },
  'YouTube': {
    url: (title) => `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`,
    deepLink: (title) => `vnd.youtube://search?query=${encodeURIComponent(title)}`
  },
  'Fandango at Home': {
    url: (title) => `https://www.fandangonow.com/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `vudu://search?q=${encodeURIComponent(title)}`
  },
  'Vudu': {
    url: (title) => `https://www.vudu.com/content/movies/search?q=${encodeURIComponent(title)}`,
    deepLink: (title) => `vudu://search?q=${encodeURIComponent(title)}`
  },
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
  const [searchHistory, setSearchHistory] = useState([])
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false)
  const [watchlist, setWatchlist] = useState([])
  const [showWatchlist, setShowWatchlist] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('tmdb-subscriptions')
    if (saved) {
      setSubscriptions(JSON.parse(saved))
    }

    const savedStores = localStorage.getItem('tmdb-preferred-stores')
    if (savedStores) {
      setPreferredStores(JSON.parse(savedStores))
    }

    const savedHistory = localStorage.getItem('media-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }

    const savedWatchlist = localStorage.getItem('media-watchlist')
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSettings) {
        const settingsPanel = document.querySelector('.settings-panel')
        const settingsButton = document.querySelector('.settings-button')
        if (settingsPanel && !settingsPanel.contains(event.target) && !settingsButton.contains(event.target)) {
          setShowSettings(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSettings])

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
        return '✓ Included'
      case 'available-through-stores':
        return '🛒 Available'
      case 'requires-another-subscription':
        return '✗ Subscription'
      case 'unknown':
        return 'ℹ️ Unknown'
      default:
        return ''
    }
  }

  const calculateRankScore = (item, searchQuery) => {
    let score = 0
    const title = (item.title || item.name || '').toLowerCase()
    const query = searchQuery.toLowerCase()

    // Exact title match bonus
    if (title === query) {
      score += 100
    } else if (title.includes(query)) {
      score += 50
    }

    // Popularity score (normalized)
    if (item.popularity) {
      score += Math.min(item.popularity / 10, 50)
    }

    // Vote count score (normalized)
    if (item.vote_count) {
      score += Math.min(item.vote_count / 100, 30)
    }

    // Vote average score
    if (item.vote_average) {
      score += item.vote_average * 5
    }

    // Metadata completeness
    if (item.poster_path) score += 10
    if (item.overview) score += 10
    if (item.release_date || item.first_air_date) score += 10

    // Penalties
    if (item.vote_count && item.vote_count < 10) score -= 20
    if (!item.release_date && !item.first_air_date) score -= 15
    if (!item.overview) score -= 10
    if (item.popularity && item.popularity < 5) score -= 15

    // Penalize specials if not searching for special
    if (item.media_type === 'tv' && !query.includes('special')) {
      score -= 10
    }

    return score
  }

  const isInWatchlist = (itemId) => {
    return watchlist.some((item) => item.id === itemId)
  }

  const addToWatchlist = (item) => {
    if (isInWatchlist(item.id)) return

    const watchlistItem = {
      id: item.id,
      title: item.title || item.name,
      poster: item.poster_path,
      mediaType: item.media_type,
      releaseYear: (item.release_date || item.first_air_date || '').split('-')[0],
      addedAt: Date.now(),
    }

    const newWatchlist = [watchlistItem, ...watchlist]
    setWatchlist(newWatchlist)
    localStorage.setItem('media-watchlist', JSON.stringify(newWatchlist))
  }

  const removeFromWatchlist = (itemId) => {
    const newWatchlist = watchlist.filter((item) => item.id !== itemId)
    setWatchlist(newWatchlist)
    localStorage.setItem('media-watchlist', JSON.stringify(newWatchlist))
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

  const getProviderLink = (providerName, title) => {
    const providerLink = PROVIDER_LINKS[providerName]
    if (providerLink) {
      const url = providerLink.url(title)
      if (url && url.startsWith('http')) {
        return url
      }
    }
    return null
  }

  const getProviderDeepLink = (providerName, title) => {
    const providerLink = PROVIDER_LINKS[providerName]
    if (providerLink && providerLink.deepLink) {
      return providerLink.deepLink(title)
    }
    return null
  }

  const hasProviderLink = (providerName) => {
    return PROVIDER_LINKS.hasOwnProperty(providerName)
  }

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const isInIframe = () => {
    try {
      return window.self !== window.top
    } catch (e) {
      return true
    }
  }

  const isHomeAssistant = () => {
    return window.location.hostname === 'homeassistant.local' ||
           window.location.pathname.includes('hassio') ||
           window.location.search.includes('hass')
  }

  const openProviderLink = (providerName, title) => {
    const webLink = getProviderLink(providerName, title)
    if (!webLink) return

    const mobile = isMobile()
    const iframe = isInIframe()
    const homeAssistant = isHomeAssistant()
    const deepLink = getProviderDeepLink(providerName, title)

    const hasSearchTerm = webLink.includes(encodeURIComponent(title)) || webLink.includes('q=') || webLink.includes('term=') || webLink.includes('search_query=')

    if (!hasSearchTerm) {
      return
    }

    if (iframe || homeAssistant) {
      window.open(webLink, '_blank', 'noopener,noreferrer')
    } else if (mobile) {
      if (deepLink) {
        window.location.href = deepLink
        setTimeout(() => {
          window.open(webLink, '_blank', 'noopener,noreferrer')
        }, 2500)
      } else {
        window.open(webLink, '_blank', 'noopener,noreferrer')
      }
    } else {
      window.open(webLink, '_blank', 'noopener,noreferrer')
    }
  }

  const searchTMDB = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setResults([])
    setSubscriptionMatches({})

    if (query.trim()) {
      const newHistory = [query.trim(), ...searchHistory.filter((q) => q !== query.trim())].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem('media-search-history', JSON.stringify(newHistory))
    }

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

      const rankedResults = filteredResults.map((item) => ({
        ...item,
        rankScore: calculateRankScore(item, query),
      })).sort((a, b) => b.rankScore - a.rankScore)

      setResults(rankedResults)

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
    if (posterPath.startsWith('http')) return posterPath
    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const getReleaseDate = (item) => {
    return item.release_date || item.first_air_date || 'N/A'
  }

  const getRating = (item) => {
    return item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
  }

  const fetchItemDetails = async (item) => {
    const mediaType = item.mediaType || item.media_type
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return
    }

    setSelectedItem(item)
    setModalLoading(true)
    setModalError(null)
    setItemDetails(null)
    setWatchProviders(null)

    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY
      const apiMediaType = mediaType === 'tv' ? 'tv' : 'movie'
      const response = await fetch(
        `https://api.themoviedb.org/3/${apiMediaType}/${item.id}?api_key=${apiKey}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch details')
      }

      const data = await response.json()
      setItemDetails(data)

      fetchWatchProviders(apiMediaType, item.id)
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
        <h1>Media Search</h1>
        <div className="header-buttons">
          <button
            className="watchlist-button"
            onClick={() => setShowWatchlist(!showWatchlist)}
          >
            ★
          </button>
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
        </div>
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
          <div className="search-input-wrapper">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowHistoryDropdown(true)}
              onBlur={() => setTimeout(() => setShowHistoryDropdown(false), 200)}
              placeholder="Search movies and TV shows..."
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {showHistoryDropdown && searchHistory.length > 0 && (
          <div className="search-history-dropdown">
            <div className="history-list">
              {searchHistory.map((historyItem, index) => (
                <button
                  key={index}
                  className="history-item"
                  onClick={() => {
                    setQuery(historyItem)
                    setShowHistoryDropdown(false)
                    searchTMDB()
                  }}
                >
                  {historyItem}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {showWatchlist && (
        <div className="watchlist-section">
          <h2 className="section-title">Watchlist</h2>
          {watchlist.length === 0 ? (
            <div className="no-results">Your watchlist is empty</div>
          ) : (
            <div className="results-grid">
              {watchlist.map((item) => {
                const posterUrl = item.poster ? `https://image.tmdb.org/t/p/w500${item.poster}` : null
                return (
                  <div key={item.id} className="result-card">
                    <button
                      className="watchlist-remove"
                      onClick={() => removeFromWatchlist(item.id)}
                      title="Remove from watchlist"
                    >
                      ×
                    </button>
                    {posterUrl && (
                      <img
                        src={posterUrl}
                        alt={item.title}
                        className="poster"
                        onClick={() => {
                          setSelectedItem(item)
                          fetchItemDetails(item)
                        }}
                      />
                    )}
                    <div className="card-content">
                      <h3 className="title">{item.title}</h3>
                      <div className="meta">
                        <span className="media-type">
                          {item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                        </span>
                        <span className="release-date">{item.releaseYear}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
                              <button
                                className="watchlist-toggle"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isInWatchlist(item.id)) {
                                    removeFromWatchlist(item.id)
                                  } else {
                                    addToWatchlist(item)
                                  }
                                }}
                                title={isInWatchlist(item.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                              >
                                {isInWatchlist(item.id) ? '★' : '☆'}
                              </button>
                              <div className="subscription-badge included-in-services">
                                ✓ Included
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
                              <button
                                className="watchlist-toggle"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isInWatchlist(item.id)) {
                                    removeFromWatchlist(item.id)
                                  } else {
                                    addToWatchlist(item)
                                  }
                                }}
                                title={isInWatchlist(item.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                              >
                                {isInWatchlist(item.id) ? '★' : '☆'}
                              </button>
                              <div className="subscription-badge available-through-stores">
                                🛒 Available
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

                {filterMode === 'all' && (
                  <>
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
                                  <button
                                    className="watchlist-toggle"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isInWatchlist(item.id)) {
                                        removeFromWatchlist(item.id)
                                      } else {
                                        addToWatchlist(item)
                                      }
                                    }}
                                    title={isInWatchlist(item.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                                  >
                                    {isInWatchlist(item.id) ? '★' : '☆'}
                                  </button>
                                  <div className="subscription-badge requires-another-subscription">
                                    ✗ Subscription
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
                                  <button
                                    className="watchlist-toggle"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isInWatchlist(item.id)) {
                                        removeFromWatchlist(item.id)
                                      } else {
                                        addToWatchlist(item)
                                      }
                                    }}
                                    title={isInWatchlist(item.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                                  >
                                    {isInWatchlist(item.id) ? '★' : '☆'}
                                  </button>
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
                                  .filter((p) => (isSubscribed(p.provider_id) || isPreferredStore(p.provider_id)) && hasProviderLink(p.provider_name))
                                  .map((provider) => (
                                    <div
                                      key={provider.provider_id}
                                      className={`provider-item ${
                                        isSubscribed(provider.provider_id) || isPreferredStore(provider.provider_id) ? 'subscribed' : ''
                                      }`}
                                      onClick={() => openProviderLink(provider.provider_name, itemDetails.title || itemDetails.name)}
                                      title="Open Provider"
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
                                      <span className="provider-action">Open Provider</span>
                                    </div>
                                  ))}
                                {groupProviders().filter((p) => (isSubscribed(p.provider_id) || isPreferredStore(p.provider_id)) && hasProviderLink(p.provider_name)).length === 0 && (
                                  <div className="no-providers">No providers available through your services</div>
                                )}
                              </div>
                            </div>

                            <div className="provider-section">
                              <h4>Requires Another Service</h4>
                              <div className="provider-list">
                                {groupProviders()
                                  .filter((p) => !isSubscribed(p.provider_id) && !isPreferredStore(p.provider_id) && hasProviderLink(p.provider_name))
                                  .map((provider) => (
                                    <div
                                      key={provider.provider_id}
                                      className="provider-item"
                                      onClick={() => openProviderLink(provider.provider_name, itemDetails.title || itemDetails.name)}
                                      title="Open Provider"
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
                                      <span className="provider-action">Open Provider</span>
                                    </div>
                                  ))}
                                {groupProviders().filter((p) => !isSubscribed(p.provider_id) && !isPreferredStore(p.provider_id) && hasProviderLink(p.provider_name)).length === 0 && (
                                  <div className="no-providers">No other providers available</div>
                                )}
                              </div>
                            </div>
                          </>
                        )}

                        {groupProviders().length === 0 && (
                          <div className="no-providers">No watch providers available</div>
                        )}

                        {groupProviders().length > 0 && (
                          <div className="provider-disclaimer">
                            Provider availability is supplied by TMDb and may occasionally be out of date.
                          </div>
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
