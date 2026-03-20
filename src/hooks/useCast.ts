import { useEffect, useState, useCallback } from 'react'

export const useCast = () => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)

  useEffect(() => {
    console.log('useCast effect running')
    const hasCastApi = 'chrome' in window && 'cast' in window.chrome
    const isLocalhost = window.location.hostname === 'localhost'

    if (hasCastApi) {
      console.log('Cast API detected')
      setIsAvailable(true)

      // Initialize Cast framework
      const castFramework = window.chrome.cast
      const castSessionState = window.chrome.cast.sessionState

      // Initialize the Cast API
      const initializeCastApi = () => {
        console.log('Initializing Cast API')
        const applicationId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID
        const apiConfig = new chrome.cast.ApiConfig(
          new chrome.cast.SessionRequest(applicationId),
          session => {
            console.log('Cast session created:', session)
            setCurrentSession(session)
            setIsConnected(true)

            // Listen for session updates
            session.addUpdateListener(sessionInfo => {
              console.log('Cast session updated:', sessionInfo)
              if (!sessionInfo) {
                setCurrentSession(null)
                setIsConnected(false)
              }
            })
          },
          error => {
            console.error('Cast API initialization error:', error)
            setIsConnected(false)
          },
          'origin_scoped',
        )

        chrome.cast.initialize(
          apiConfig,
          () => {
            console.log('Cast API initialized successfully')
          },
          error => {
            console.error('Cast API initialization failed:', error)
          },
        )
      }

      // Load the Cast API
      const castScript = document.createElement('script')
      castScript.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js'
      castScript.onload = () => {
        console.log('Cast script loaded')
        initializeCastApi()
      }
      castScript.onerror = error => {
        console.error('Failed to load cast script:', error)
      }
      document.head.appendChild(castScript)
    } else if (isLocalhost) {
      console.log('Setting up mock Cast API for localhost')
      setIsAvailable(true)

      // Mock the chrome.cast.media namespace if it doesn't exist
      if (!window.chrome.cast) {
        window.chrome.cast = {}
      }

      // Create mock classes that behave like the real ones
      const mockMediaInfo = function (contentUrl) {
        this.contentUrl = contentUrl
        this.metadata = null
      }

      const mockGenericMediaMetadata = () => {
        // empty
      }

      const mockLoadRequest = function (mediaInfo) {
        this.mediaInfo = mediaInfo
        this.onSuccess = null
        this.onError = null
      }

      window.chrome.cast.media = {
        MediaInfo: mockMediaInfo,
        GenericMediaMetadata: mockGenericMediaMetadata,
        LoadRequest: mockLoadRequest,
        DEFAULT_MEDIA_RECEIVER_APP_ID: 'CC1AD845',
      }

      // Create a mock session that properly handles callbacks
      const mockSession = {
        sessionId: 'mock-session-id',
        loadMedia: request => {
          console.log('Mock cast: loadMedia called with:', request)
          // Simulate async success by calling the onSuccess callback after a short delay
          if (request.onSuccess) {
            setTimeout(() => {
              request.onSuccess()
            }, 100)
          }
          // If there's an error, call onError
          if (request.onError) {
            setTimeout(() => {
              request.onError({ code: 'ERROR', description: 'Mock error' })
            }, 100)
          }
        },
        endSession: (onSuccess, onError) => {
          console.log('Mock cast: endSession called')
          setCurrentSession(null)
          setIsConnected(false)
          // Call the success callback after a short delay
          if (onSuccess) {
            setTimeout(() => {
              onSuccess()
            }, 100)
          }
          // If there's an error, call onError
          if (onError) {
            setTimeout(() => {
              onError({ code: 'ERROR', description: 'Mock error' })
            }, 100)
          }
        },
        addUpdateListener: listener => {
          console.log('Mock cast: addUpdateListener called')
          // Store the listener
          mockSession.listener = listener
          // Call it immediately to simulate being connected with a valid session
          listener({ sessionId: 'mock-session-id', isIdle: false })
          // Also store a way to simulate disconnection
          mockSession.simulateDisconnection = () => {
            if (mockSession.listener) {
              mockSession.listener(null)
            }
          }
        },
      }

      // Set up the mock session
      setCurrentSession(mockSession)
      setIsConnected(true)
    } else {
      console.log('Cast API not available and not localhost')
    }

    return () => {
      console.log('Cleaning up useCast effect')
      // Cleanup: end Cast session if connected
      if (currentSession) {
        try {
          currentSession.endSession(
            () => {
              console.log('Cast session ended')
            },
            error => {
              console.error('Error ending Cast session:', error)
            },
          )
        } catch (error) {
          console.error('Exception ending Cast session:', error)
        }
      }
    }
  }, [])

  const castMedia = useCallback(
    (mediaUrl: string, title: string) => {
      console.log('castMedia called with:', { mediaUrl, title, isConnected, hasSession: !!currentSession })
      if (!isConnected || !currentSession) {
        console.warn('Cannot cast media: not connected to a Cast device')
        return false
      }

      try {
        const mediaInfo = new chrome.cast.media.MediaInfo(mediaUrl)
        mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata()
        mediaInfo.metadata.title = title

        const request = new chrome.cast.media.LoadRequest(mediaInfo)
        currentSession.loadMedia(
          request,
          () => {
            console.log('Media loaded successfully for casting')
          },
          error => {
            console.error('Error loading media for casting:', error)
          },
        )

        return true
      } catch (error) {
        console.error('Exception casting media:', error)
        return false
      }
    },
    [isConnected, currentSession],
  )

  const stopCasting = useCallback(() => {
    console.log('stopCasting called')
    if (currentSession) {
      try {
        currentSession.endSession(
          () => {
            console.log('Cast session ended by user')
            setCurrentSession(null)
            setIsConnected(false)
          },
          error => {
            console.error('Error ending Cast session:', error)
          },
        )
      } catch (error) {
        console.error('Exception ending Cast session:', error)
      }
    }
  }, [currentSession])

  return {
    isAvailable,
    isConnected,
    castMedia,
    stopCasting,
  }
}
