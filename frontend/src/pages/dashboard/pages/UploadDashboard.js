"use client"

import { useState, useEffect } from "react"
import "../styles/upload-dashboard.css"

function UploadDashboard() {
  const [filenames, setFilenames] = useState([])

  useEffect(() => {
    const init = async () => {
      try {
        const storedCredentials = localStorage.getItem("rx_chatbot_credentials")
        if (!storedCredentials) return
        const { email } = JSON.parse(storedCredentials)
        const filenamesResponse = await fetch(`/api/dashboard?email=${email}`, {
          method: "GET",
          credentials: "include",
        })
        if (filenamesResponse.ok) {
          const data = await filenamesResponse.json()
          setFilenames(data.filenames || [])
        }
      } catch (e) {
        console.error("Error fetching filenames:", e)
      }
    }
    init()
  }, [])

  const handleFileDelete = (filename) => {
    console.log("Deleting file:", filename)
    fetch(`/api/delete_file/${filename}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filename }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("File deleted successfully:", filename)
          setFilenames((prevFilenames) => prevFilenames.filter((name) => name !== filename))
        } else {
          console.error("Error deleting file:", data.error)
        }
      })
      .catch((error) => {
        console.error("Error deleting file:", error)
      })
  }

  return (
    <div className="wl-upload-dashboard-dark">
      <h1>Dashboard</h1>
      <div id="wl-upload-form-dark">
        <h5>Current files</h5>
        {filenames && filenames.length > 0 ? (
          <ul className="wl-file-list-dark">
            {filenames.map((file, index) => (
              <li key={index}>
                <span>{file}</span>
                <i
                  className="fas fa-trash-alt wl-delete-icon-dark"
                  data-filename={file}
                  onClick={() => handleFileDelete(file)}
                ></i>
              </li>
            ))}
          </ul>
        ) : (
          <p>No files found.</p>
        )}
        <form action="/upload" method="post" encType="multipart/form-data">
          <input type="file" name="files[]" multiple />
          <button id="wl-btnUploadMore-dark">Upload more files</button>
        </form>
      </div>
    </div>
  )
}

export default UploadDashboard
