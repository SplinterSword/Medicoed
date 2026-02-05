"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaHeartbeat, FaLungs, FaSyringe, FaStethoscope, FaBone, FaPlus } from "react-icons/fa"
import "../styles/case-study-page.css"
import Header from "./Header"
import LoginModal from "./LoginModal"

const CaseStudyPage = () => {
  const navigate = useNavigate()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      const userId = localStorage.getItem("id")
      if (!userId) {
        setIsLoggedIn(false)
        return
      }

      try {
        const response = await fetch("/api/get-user-by-userid", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        })

        if (response.ok) {
          const userData = await response.json()
          setIsLoggedIn(true)
          const storedSubscriptionStatus = localStorage.getItem("isSubscribed")
          if (storedSubscriptionStatus) {
            setIsSubscribed(JSON.parse(storedSubscriptionStatus))
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    checkAuthAndFetchUser()
  }, [])

  const handleNavigate = (category) => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    navigate(`/simulator?category=${category}`)
  }

  const cardData = [
    {
      title: "Cardiovascular",
      description: "Explore interactive case studies on cardiovascular health.",
      icon: <FaHeartbeat className="case-page-card-icon" />,
    },
    {
      title: "Respiratory",
      description: "Engage with respiratory case studies and scenarios.",
      icon: <FaLungs className="case-page-card-icon" />,
    },
    {
      title: "Gastrointestinal",
      description: "Interactive studies focusing on gastrointestinal conditions.",
      icon: <FaSyringe className="case-page-card-icon" />,
    },
    {
      title: "Hematology",
      description: "Dive into hematology with interactive case studies.",
      icon: <FaStethoscope className="case-page-card-icon" />,
    },
    {
      title: "Musculoskeletal",
      description: "Study musculoskeletal disorders through interactive cases.",
      icon: <FaBone className="case-page-card-icon" />,
    },
    {
      title: "All Categories",
      description: "Access interactive case study from all categories.",
      icon: <FaPlus className="case-page-card-icon" />,
    },
  ]

  return (
    <div>
      <Header />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <div className="case-page">
        <h1 className="case-page-heading">
          Interactive Medical <span style={{ color: "#6f42c1" }}>Case Studies</span>
        </h1>
        {isSubscribed ? (
          <div className="case-page-card-container">
            {cardData.map((card) => (
              <div className="case-page-card" key={card.title}>
                <div className="case-page-card-icon-container">{card.icon}</div>
                <div className="case-page-card-content">
                  <h2 className="case-page-card-title">{card.title}</h2>
                  <p className="case-page-card-description">{card.description}</p>
                  <button className="case-page-card-button" onClick={() => handleNavigate(card.title.toLowerCase())}>
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Please login and subscribe to access interactive case studies.</p>
        )}
      </div>
    </div>
  )
}

export default CaseStudyPage
