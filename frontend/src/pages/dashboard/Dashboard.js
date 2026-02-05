"use client"

import { useState, useEffect } from "react"
import { Link, Route, Routes, useLocation } from "react-router-dom"
import { FiUpload, FiMessageCircle, FiClipboard, FiLayers, FiGitMerge, FiMenu, FiBook } from "react-icons/fi"
import "./styles/dashboard.css"
import UploadPapers from "./pages/UploadPapers"
import SummaryGenerator from "./pages/SummaryGenerator"
import ComparisonTool from "./pages/CompareSummaries"
import AIChat from "./pages/AIChat"
import QuestionsGenerator from "./pages/QuestionsGenerator"
import MindMaps from "./pages/MindMaps"
import ResearchLibrary from "./pages/ResearchLibrary"
import CompareAndChat from "./pages/CompareAndChat"
import UploadDashboard from "./pages/UploadDashboard"
import Notes from "./pages/NotesGenerator"
import Flashcards from "./pages/FlashCards"

function Dashboard({ handleLogout }) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(location.pathname)
  const [showNotes, setShowNotes] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showInfoText, setShowInfoText] = useState(true)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setSidebarCollapsed(false)
      } else {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInfoText(false)
    }, 20000)

    return () => clearTimeout(timer)
  }, [])

  const handleTabClick = (path) => {
    setActiveTab(path)
    setShowNotes(false)
    setSidebarCollapsed(true)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleNotes = () => {
    setShowNotes(!showNotes)
  }

  const renderSidebar = () => (
    <aside className={`wl-sidebar-dark ${sidebarCollapsed ? "collapsed" : ""}`}>
      <ul>
        <li>
          <Link
            to="/dashboard/upload-papers"
            className={activeTab === "/dashboard/upload-papers" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/upload-papers")}
          >
            <FiUpload className="icon" />
            <span className="label">Upload Documents</span>
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/ai-chat"
            className={activeTab === "/dashboard/ai-chat" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/ai-chat")}
          >
            <FiMessageCircle className="icon" />
            <span className="label">Chat with Document</span>
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/questions-generator"
            className={activeTab === "/dashboard/questions-generator" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/questions-generator")}
          >
            <FiClipboard className="icon" />
            <span className="label">Questions Generator</span>
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/mind-maps"
            className={activeTab === "/dashboard/mind-maps" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/mind-maps")}
          >
            <FiGitMerge className="icon" />
            <span className="label">Mind Maps</span>
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/flashcards"
            className={activeTab === "/dashboard/flashcards" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/flashcards")}
          >
            <FiBook className="icon" />
            <span className="label">Flashcards</span>
          </Link>
        </li>
        <li>
          <Link
            to="/dashboard/research-library"
            className={activeTab === "/dashboard/research-library" ? "active" : ""}
            onClick={() => handleTabClick("/dashboard/research-library")}
          >
            <FiLayers className="icon" />
            <span className="label">Notes</span>
          </Link>
        </li>
      </ul>
    </aside>
  )

  return (
    <div className="wl-dashboard-dark">
      {isMobile && (
        <button className="wl-toggle-sidebar-button-dark" onClick={toggleSidebar}>
          <FiMenu />
        </button>
      )}

      {renderSidebar()}

      <main className="wl-main-content-dark">
        <Routes>
          <Route path="upload-papers" element={<UploadPapers />} />
          <Route path="summary-generator" element={<SummaryGenerator />} />
          <Route path="comparison-tool" element={<ComparisonTool />} />
          <Route path="ai-chat" element={<AIChat />} />
          <Route path="questions-generator" element={<QuestionsGenerator />} />
          <Route path="mind-maps" element={<MindMaps />} />
          <Route path="research-library" element={<ResearchLibrary />} />
          <Route path="compare-and-chat" element={<CompareAndChat />} />
          <Route path="upload-dashboard" element={<UploadDashboard />} />
          <Route path="flashcards" element={<Flashcards />} />

          <Route
            path="/"
            element={
              <div className="wl-welcome-section-dark">
                <h1>Welcome to your Dashboard</h1>
                <p>Select an option from the sidebar to get started.</p>
              </div>
            }
          />
        </Routes>
      </main>

      <button className={`wl-toggle-notes-button-dark ${showNotes ? "shifted" : ""}`} onClick={toggleNotes}>
        Notes
      </button>
      {showInfoText && (
        <span className="wl-info-text-dark">
          You can paste your content as prompt and generate notes simultaneously <span className="arrow">→</span>
        </span>
      )}

      {showNotes && <Notes showNotes={showNotes} />}
    </div>
  )
}

export default Dashboard
