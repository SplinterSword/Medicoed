"use client"

import { useState, useEffect, useRef } from "react"
import "../styles/upload-papers.css"
import { AiOutlineDelete } from "react-icons/ai"
import { FiUpload } from "react-icons/fi"
import { Link } from "react-router-dom"
import noDeleteFiles from "../noDeleteFiles.json"
import { getStoredUser, isValidStoredUser } from "../../../utils/userStorage"

const UploadPapers = () => {
  const [attachedFiles, setAttachedFiles] = useState([])
  const [bulkAttachedFiles, setBulkAttachedFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bulkUploadFilename, setBulkUploadFilename] = useState("")
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const individualFileInputRef = useRef(null)
  const bulkFileInputRef = useRef(null)

  const [summaryDisabled, setSummaryDisabled] = useState(true)
  const [allSummaryDisabled, setAllSummaryDisabled] = useState(true)
  const [indexDisabled, setIndexDisabled] = useState(true)
  const [allIndexDisabled, setAllIndexDisabled] = useState(true)

  const [shouldPollButtons, setShouldPollButtons] = useState(false)

  const [isDraggingIndividual, setIsDraggingIndividual] = useState(false)
  const [isDraggingBulk, setIsDraggingBulk] = useState(false)

  const NO_DELETE_SET = new Set(noDeleteFiles?.filenames || [])
  const canShowDelete = (filename) => !NO_DELETE_SET.has(filename)
  const getUserId = () => {
    const storedUser = getStoredUser()
    return isValidStoredUser(storedUser) ? storedUser.id : null
  }

  useEffect(() => {
  const checkAuthAndFetchFiles = async () => {
    const userId = getUserId()
    if (!userId) {
      setIsLoggedIn(false)
      return
    }

    setIsLoggedIn(true)

    try {
      // 1) Get user by ID (same as AI Chat page)
      const response = await fetch("/api/get-user-by-userid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!response.ok) {
        console.error("Failed to fetch user")
        return
      }

      let userData = await response.json()

      // 🔧 If backend returns a JSON string, parse it
      if (typeof userData === "string") {
        try {
          userData = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse userData string:", e)
          return
        }
      }

      // 🔧 If backend wraps it like { payload: "..." }
      if (userData?.payload && typeof userData.payload === "string") {
        try {
          userData = JSON.parse(userData.payload)
        } catch (e) {
          console.error("Failed to parse userData.payload:", e)
          return
        }
      }

      const email = userData?.email
      if (!email) {
        console.error("Email not found on userData:", userData)
        return
      }

      // 2) Fetch filenames using the user's email (same as AI Chat page logic)
      const fileRes = await fetch(`/api/get-filenames?email=${email}`)
      if (!fileRes.ok) return

      const fileData = await fileRes.json()
      setUploadedFiles(fileData.filenames || [])
    } catch (error) {
      console.error("Error fetching filenames:", error)
    }
  }

  checkAuthAndFetchFiles()
}, [])

  useEffect(() => {
    if (!isLoggedIn) return

    let intervalId
    let timeoutId

    const fetchDisabledButtons = async () => {
      try {
        const userId = getUserId()
        if (!userId) {
          return
        }
        const response = await fetch("/api/get-disabled-buttons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filenames: uploadedFiles, user_id: userId }),
        })
        const data = await response.json()
        setSummaryDisabled(data.summary_disabled)
        setAllSummaryDisabled(data.all_summary_disabled)
        setIndexDisabled(data.index_disabled)
        setAllIndexDisabled(data.all_index_disabled)

        // If ALL buttons are enabled, stop polling
        const allEnabled =
          !data.summary_disabled && !data.all_summary_disabled && !data.index_disabled && !data.all_index_disabled

        if (allEnabled) {
          clearInterval(intervalId)
          setShouldPollButtons(false)
        }
      } catch (error) {
        console.error("Error fetching button states:", error)
      }
    }

    // Wait 30 seconds before hitting the API
    timeoutId = setTimeout(() => {
      // After the initial 30s delay, start polling every 5s
      intervalId = setInterval(fetchDisabledButtons, 5000)
      // Also do one fetch immediately after the delay
      fetchDisabledButtons()
    }, 30000)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [uploadedFiles, isLoggedIn, shouldPollButtons])

  const handleIndividualFileChange = (e) => {
    const files = e.target.files
    const names = []
    for (let i = 0; i < files.length; i++) {
      names.push(files[i].name)
    }
    setAttachedFiles(names)
  }

  const handleBulkFileChange = (e) => {
    setBulkUploadFilename(e.target.value)
    const files = e.target.files
    const names = []
    for (let i = 0; i < files.length; i++) {
      names.push(files[i].name)
    }
    setBulkAttachedFiles(names)
  }

  const handleIndividualDragOver = (e) => {
    e.preventDefault()
    setIsDraggingIndividual(true)
  }

  const handleIndividualDragLeave = (e) => {
    e.preventDefault()
    setIsDraggingIndividual(false)
  }

  const handleIndividualDrop = (e) => {
    e.preventDefault()
    setIsDraggingIndividual(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      individualFileInputRef.current.files = files
      handleIndividualFileChange({ target: { files } })
    }
  }

  const handleBulkDragOver = (e) => {
    e.preventDefault()
    setIsDraggingBulk(true)
  }

  const handleBulkDragLeave = (e) => {
    e.preventDefault()
    setIsDraggingBulk(false)
  }

  const handleBulkDrop = (e) => {
    e.preventDefault()
    setIsDraggingBulk(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      bulkFileInputRef.current.files = files
      handleBulkFileChange({ target: { files } })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = getUserId()
      if (!userId) {
        throw new Error("User ID not found")
      }

      const formData = new FormData()
      const files = individualFileInputRef.current?.files || []

      if (files.length === 0) {
        throw new Error("No files selected")
      }

      const userResponse = await fetch("/api/get-user-by-userid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!userResponse.ok) {
        console.error("Failed to fetch user")
        return
      }

      let userData = await userResponse.json()

      // 🔧 If backend returns a JSON string, parse it
      if (typeof userData === "string") {
        try {
          userData = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse userData string:", e)
          return
        }
      }

      // 🔧 If backend wraps it like { payload: "..." }
      if (userData?.payload && typeof userData.payload === "string") {
        try {
          userData = JSON.parse(userData.payload)
        } catch (e) {
          console.error("Failed to parse userData.payload:", e)
          return
        }
      }

      const email = userData?.email
      if (!email) {
        console.error("Email not found on userData:", userData)
        return
      }

      for (let i = 0; i < files.length; i++) {
        formData.append("files[]", files[i])
      }
      formData.append("email", email)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const filenamesResponse = await fetch(`/api/get-filenames?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (filenamesResponse.ok) {
        const filenamesData = await filenamesResponse.json()
        setUploadedFiles(filenamesData.filenames || [])
        setAttachedFiles([])
      }

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error("Error uploading files:", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileDelete = async (filename) => {
    try {
      const userId = getUserId()
      if (!userId) {
        return
      }
      const response = await fetch("/api/delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId, filename }),
      })

      if (!response.ok) {
        throw new Error("Delete request failed")
      }

      const data = await response.json()
      if (data.success) {
        const updatedFilenames = uploadedFiles.filter((name) => name !== filename)
        setUploadedFiles(updatedFilenames)
        setDeleteSuccess(true)
        setTimeout(() => setDeleteSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Error deleting file:", error.message)
    }
  }

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = getUserId()
      if (!userId) {
        throw new Error("User ID not found")
      }

      const formData = new FormData()
      const files = bulkFileInputRef.current?.files || []

      if (files.length === 0) {
        throw new Error("No files selected")
      }

      for (let i = 0; i < files.length; i++) {
        formData.append("files[]", files[i])
      }

      const userResponse = await fetch("/api/get-user-by-userid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      })

      if (!userResponse.ok) {
        console.error("Failed to fetch user")
        return
      }

      let userData = await userResponse.json()

      // 🔧 If backend returns a JSON string, parse it
      if (typeof userData === "string") {
        try {
          userData = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse userData string:", e)
          return
        }
      }

      // 🔧 If backend wraps it like { payload: "..." }
      if (userData?.payload && typeof userData.payload === "string") {
        try {
          userData = JSON.parse(userData.payload)
        } catch (e) {
          console.error("Failed to parse userData.payload:", e)
          return
        }
      }

      const email = userData?.email
      if (!email) {
        console.error("Email not found on userData:", userData)
        return
      }

      formData.append("email", email)
      formData.append("group_name", bulkUploadFilename)

      const response = await fetch("/api/upload-files-bulk", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorResponse = await response.json()
        throw new Error(errorResponse.error)
      }

      const filenamesResponse = await fetch(`/api/get-filenames?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (filenamesResponse.ok) {
        const filenamesData = await filenamesResponse.json()
        setUploadedFiles(filenamesData.filenames || [])
        setBulkAttachedFiles([])
      }

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error("Error uploading files:", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="medicoed-upload-container">
      <h1 className="medicoed-upload-heading">
        Upload Your <span style={{ color: "var(--medicoed-accent-cyan)" }}>Files</span>
      </h1>
      <div className="medicoed-upload-bigbox">
        <form id="UploadPapers-upload-form" className="medicoed-upload-form" onSubmit={handleSubmit}>
          <div className="medicoed-upload-upload-box">
            <div
              className="medicoed-upload-drag-box"
              onDragOver={handleIndividualDragOver}
              onDragLeave={handleIndividualDragLeave}
              onDrop={handleIndividualDrop}
            >
              <input
                id="individual-file-upload"
                type="file"
                accept=".pdf"
                multiple
                onChange={handleIndividualFileChange}
                style={{ display: "none" }}
                ref={individualFileInputRef}
              />
              <label htmlFor="individual-file-upload" className="medicoed-upload-uicon">
                <FiUpload />
                <br />
                <p>Click here or drag and drop files to select them</p>
                <p>Then click Upload to upload your files</p>
              </label>
            </div>
            {loading && (
              <div className="medicoed-upload-loader">
                <div className="medicoed-upload-dot"></div>
                <div className="medicoed-upload-dot"></div>
                <div className="medicoed-upload-dot"></div>
              </div>
            )}
          </div>
          <div className="medicoed-upload-uploads-container">
            <div id="UploadPapers-upload-form" className="medicoed-upload-form">
              {attachedFiles.length > 0 && (
                <>
                  <h3 className="medicoed-upload-hhh">Attached Files</h3>
                  <ul className="medicoed-upload-file-list">
                    {attachedFiles.map((file, index) => (
                      <li key={index}>
                        <span>{file}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
          <input className="medicoed-upload-button" type="submit" value="Upload" style={{ marginTop: "20px" }} />
        </form>

        <div className="bulk-upload-text">
          <p className="medicoed-upload-bulk-p">
            or{" "}
            <span className="clickable-text" onClick={() => setShowBulkUpload(!showBulkUpload)}>
              click to upload multiple files as a single combined file
            </span>
            .
          </p>
        </div>
        {showBulkUpload && (
          <form id="UploadPapers-bulk-upload-form" className="medicoed-upload-form" onSubmit={handleBulkUploadSubmit}>
            <div className="medicoed-upload-upload-box">
              <div
                className="medicoed-upload-drag-box"
                onDragOver={handleBulkDragOver}
                onDragLeave={handleBulkDragLeave}
                onDrop={handleBulkDrop}
              >
                <input
                  id="bulk-file-upload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleBulkFileChange}
                  style={{ display: "none" }}
                  ref={bulkFileInputRef}
                />
                <label htmlFor="bulk-file-upload" className="medicoed-upload-uicon">
                  <FiUpload />
                  <br />
                  <p>Click here or drag and drop files to select them</p>
                  <p>Then click Bulk Upload to upload your files</p>
                </label>
              </div>
              {loading && (
                <div className="medicoed-upload-loader">
                  <div className="medicoed-upload-dot"></div>
                  <div className="medicoed-upload-dot"></div>
                  <div className="medicoed-upload-dot"></div>
                </div>
              )}
            </div>
            <div className="medicoed-upload-uploads-container">
              <div id="UploadPapers-upload-form" className="medicoed-upload-form">
                {bulkAttachedFiles.length > 0 && (
                  <>
                    <h3 className="medicoed-upload-hhh">Attached Files</h3>
                    <ul className="medicoed-upload-file-list">
                      {bulkAttachedFiles.map((file, index) => (
                        <li key={index}>
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
            <div className="medicoed-upload-upload-box">
              <input
                type="text"
                placeholder="Enter bulk upload filename"
                onChange={(e) => setBulkUploadFilename(e.target.value)}
                required
                className="medicoed-upload-bulk-input" // Add this class for styling
              />
              <input className="medicoed-upload-button" type="submit" value="Bulk Upload" />
            </div>
          </form>
        )}

        {uploadSuccess && <div className="medicoed-upload-alert medicoed-upload-success">File uploaded successfully.</div>}

        {deleteSuccess && <div className="medicoed-upload-alert medicoed-upload-success">File deleted successfully.</div>}

        {isLoggedIn ? (
          <div className="medicoed-upload-uploads-container">
            <div id="UploadPapers-upload-form" className="medicoed-upload-form">
              {uploadedFiles.length > 0 && (
                <>
                  <h3 className="medicoed-upload-hhh">Uploaded Files</h3>
                  <ul className="medicoed-upload-file-list">
                    {uploadedFiles.map((file, index) => (
                      <li key={index}>
                        <span>{file}</span>

                        {canShowDelete(file) && (
                          <AiOutlineDelete
                            className="medicoed-upload-delete-icon"
                            onClick={() => handleFileDelete(file)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="medicoed-upload-not-logged-in">
            <p>You need to be logged in to view and upload files.</p>
          </div>
        )}
      </div>

      <div className="medicoed-upload-buttons-container">
        <Link to="/dashboard/ai-chat" className="medicoed-upload-button-link">
          <button disabled={indexDisabled}>Chat with Document</button>
        </Link>
        <Link to="/dashboard/questions-generator" className="medicoed-upload-button-link">
          <button disabled={indexDisabled}>Generate Quiz</button>
        </Link>
        <Link to="/dashboard/mind-maps" className="medicoed-upload-button-link">
          <button disabled={indexDisabled}>Generate Mind Maps</button>
        </Link>
        <Link to="/dashboard/flashcards" className="medicoed-upload-button-link">
          <button disabled={indexDisabled}>Generate Flashcards</button>
        </Link>
      </div>
    </div>
  )
}

export default UploadPapers
