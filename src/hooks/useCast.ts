import { useEffect, useState, useCallback } from 'react'

export const useCast = () => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)

  useEffect(() => {
    // Check if Google Cast API is available
    if ('chrome' in window && 'cast' in window.chrome) {
      setIsAvailable(true)

      // Initialize Cast framework
      const castFramework = window.chrome.cast
      const castSessionState = window.chrome.cast.sessionState

      // Initialize the Cast API
      const initializeCastApi = () => {
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
      castScript.onload = initializeCastApi
      document.head.appendChild(castScript)
    }

    return () => {
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
  }, [currentSession])

  const castMedia = useCallback(
    (mediaUrl: string, title: string) => {
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
