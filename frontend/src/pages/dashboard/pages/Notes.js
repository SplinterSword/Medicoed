"use client"

import { useState, useEffect } from "react"
import "../styles/notes.css"
import { getStoredUser, isValidStoredUser } from "../../../utils/userStorage"

const NotesPage = ({ showNotes, setShowNotes }) => {
  const [userEmail, setUserEmail] = useState("")
  const [filenames, setFilenames] = useState([])
  const [selectedFilename, setSelectedFilename] = useState("")
  const [noteText, setNoteText] = useState("")
  const [notes, setNotes] = useState([])
  const [message, setMessage] = useState("")

  useEffect(() => {
  const checkAuthAndFetchUser = async () => {
    const storedUser = getStoredUser()
    if (!isValidStoredUser(storedUser)) {
      return
    }
    const userId = storedUser.id

    try {
      // Fetch user by ID
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

      // Case 1 — backend returns a JSON string
      if (typeof userData === "string") {
        try {
          userData = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse userData string:", e)
          return
        }
      }

      // Case 2 — backend wraps data as { payload: "..." } or { payload: {...} }
      if (
        userData &&
        typeof userData === "object" &&
        "payload" in userData
      ) {
        const payload = userData.payload

        if (typeof payload === "string") {
          try {
            userData = JSON.parse(payload)
          } catch (e) {
            console.error("Failed to parse userData.payload string:", e)
            return
          }
        } else if (payload && typeof payload === "object") {
          userData = payload
        }
      }

      // Extract email
      let email =
        userData &&
        typeof userData === "object" &&
        "email" in userData
          ? userData.email
          : undefined

      if (!email) {
        console.error("Email not found on userData:", userData)
        return
      }

      // Save email to state
      setUserEmail(email)

      // Fetch filenames **using correct email**
      const filenamesResponse = await fetch(
        `/api/get-filenames?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      if (filenamesResponse.ok) {
        const filenamesData = await filenamesResponse.json()
        setFilenames(filenamesData.filenames || [])
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  checkAuthAndFetchUser()
}, [])


const fetchNotes = async () => {
  const storedUser = getStoredUser()
  if (!isValidStoredUser(storedUser)) return

  // Use the email we already got from /api/get-user-by-userid
  if (!userEmail) {
    console.error("Cannot fetch notes — email is missing.")
    return
  }

  try {
    const response = await fetch("/api/get-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: userEmail }),
    })

    if (response.ok) {
      const data = await response.json()
      setNotes(data.notes || [])
    }
  } catch (error) {
    console.error("Error fetching notes:", error)
  }
}

  useEffect(() => {
  if (showNotes && userEmail) {
    fetchNotes()
  }
}, [showNotes, userEmail])


  const handleAddNote = async (event) => {
    event.preventDefault()
    const storedUser = getStoredUser()
    if (!isValidStoredUser(storedUser)) return

    try {
      const response = await fetch("/api/add-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFilename,
          note: noteText,
          email: userEmail,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage("Note added successfully")
          fetchNotes()
        }
      }
    } catch (error) {
      console.error("Error adding note:", error)
    }
  }

  const handleDeleteNote = async (filename, note) => {
    const storedUser = getStoredUser()
    if (!isValidStoredUser(storedUser)) return

    try {
      const response = await fetch("/api/delete-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename, note, email: userEmail }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessage("Note deleted successfully")
          fetchNotes()
        }
      }
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  const handleNoteSelect = (filename, note) => {
    setSelectedFilename(filename)
    setNoteText(note)
  }

  const toggleNotes = () => {
    setShowNotes(!showNotes)
  }

  return (
    <div className={`wl-notes-page-container-dark ${showNotes ? "show" : ""}`}>
      <div className="wl-notes-toggle-dark" onClick={toggleNotes}>
        <span className="wl-notes-label-dark">Notes</span>
      </div>

      <h1 className="wl-notes-page-title-dark">Notes</h1>

      <form className="wl-notes-add-form-dark" onSubmit={handleAddNote}>
        <select
          id="filename"
          className="wl-notes-form-select-dark"
          value={selectedFilename}
          onChange={(e) => setSelectedFilename(e.target.value)}
        >
          <option value="">Select a filename</option>
          {filenames.map((filename, index) => (
            <option key={index} value={filename}>
              {filename}
            </option>
          ))}
        </select>
        <textarea
          id="note-text"
          className="wl-notes-form-textarea-dark"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Enter your note..."
          required
        />
        <button type="submit" className="wl-notes-btn-primary-dark">
          Add Note
        </button>
      </form>

      {message && <div className="wl-notes-message-dark">{message}</div>}

      <table className="wl-notes-table-dark">
        <thead>
          <tr>
            <th className="wl-notes-table-header-dark">Filename</th>
            <th className="wl-notes-table-header-dark">Note</th>
            <th className="wl-notes-table-header-dark">Actions</th>
          </tr>
        </thead>
        <tbody>
          {notes.map((note, index) => (
            <tr key={index}>
              <td>{note.filename}</td>
              <td>{note.note}</td>
              <td>
                <button
                  className="wl-notes-btn-secondary-dark"
                  onClick={() => handleNoteSelect(note.filename, note.note)}
                >
                  Edit
                </button>
                <button className="wl-notes-btn-danger-dark" onClick={() => handleDeleteNote(note.filename, note.note)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default NotesPage
