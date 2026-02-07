import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import LoginModal from "../components/LoginModal"

const AuthContext = createContext(null)

const getInitialAuthState = () => Boolean(localStorage.getItem("id"))

export const AuthProvider = ({ children, requireAuth = false }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(getInitialAuthState)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(requireAuth && !getInitialAuthState())

  const refreshAuth = useCallback(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("id")))
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
    }
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
