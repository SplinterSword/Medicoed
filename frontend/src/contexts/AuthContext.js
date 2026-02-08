import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import LoginModal from "../components/LoginModal"

const AuthContext = createContext(null)

const parseStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user")
    if (!rawUser) {
      return null
    }
    return JSON.parse(rawUser)
  } catch (error) {
    return null
  }
}

const isValidStoredUser = (user) => {
  if (!user || typeof user !== "object") {
    return false
  }

  const requiredStringFields = ["id", "email", "partner_user_id", "subscription_status", "fullName"]
  const hasRequiredStrings = requiredStringFields.every(
    (field) => typeof user[field] === "string" && user[field].trim().length > 0
  )

  return hasRequiredStrings && typeof user.isSubscribed === "boolean"
}

const getInitialAuthState = () => isValidStoredUser(parseStoredUser())

export const AuthProvider = ({ children, requireAuth = false }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(requireAuth && !getInitialAuthState())

  const refreshAuth = useCallback(() => {
    setIsLoggedIn(isValidStoredUser(parseStoredUser()))
  }, [])

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
  }, [])

  const handleAuthSuccess = useCallback(() => {
    refreshAuth()
    closeLoginModal()
  }, [refreshAuth, closeLoginModal])

  useEffect(() => {
    if (requireAuth && !isLoggedIn) {
      setIsLoginModalOpen(true)
      return
    }

    setIsLoginModalOpen(false)
  }, [requireAuth, isLoggedIn])

  const contextValue = useMemo(
    () => ({
      isLoggedIn,
      refreshAuth,
      openLoginModal,
      closeLoginModal,
      requireAuth,
    }),
    [isLoggedIn, refreshAuth, openLoginModal, closeLoginModal, requireAuth]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} onAuthSuccess={handleAuthSuccess} />
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
