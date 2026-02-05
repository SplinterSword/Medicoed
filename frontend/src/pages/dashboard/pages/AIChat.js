"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import "../styles/ai-chat.css"
import { getApiUrl } from "../../../env-config.js"

const AIChat = () => {
  const [userId, setUserId] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [filenames, setFilenames] = useState([])
  const [selectedFile, setSelectedFile] = useState("")
  const [messages, setMessages] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [savedMessages, setSavedMessages] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPremiumPlan, setIsPremiumPlan] = useState(false)

  const [showPopup, setShowPopup] = useState(false)
  const [popupData, setPopupData] = useState({ title: "", tags: "", msgContent: "" })

  const streamControllerRef = useRef(null)
  const streamRunIdRef = useRef(0)
  const streamUpdateRef = useRef("")          // stores latest streamed text
  const lastStreamUpdateTimeRef = useRef(0)   // throttles updates
  const lastRenderedRef = useRef("") 

  const languages = [
    { code: "en", name: "English" },
    { code: "af", name: "Afrikaans" },
    { code: "sq", name: "Albanian" },
    { code: "am", name: "Amharic" },
    { code: "ar", name: "Arabic" },
    { code: "hy", name: "Armenian" },
    { code: "az", name: "Azerbaijani" },
    { code: "eu", name: "Basque" },
    { code: "be", name: "Belarusian" },
    { code: "bn", name: "Bengali" },
    { code: "bs", name: "Bosnian" },
    { code: "bg", name: "Bulgarian" },
    { code: "ca", name: "Catalan" },
    { code: "ceb", name: "Cebuano" },
    { code: "zh", name: "Chinese" },
    { code: "co", name: "Corsican" },
    { code: "hr", name: "Croatian" },
    { code: "cs", name: "Czech" },
    { code: "da", name: "Danish" },
    { code: "nl", name: "Dutch" },
    { code: "eo", name: "Esperanto" },
    { code: "et", name: "Estonian" },
    { code: "fi", name: "Finnish" },
    { code: "fr", name: "French" },
    { code: "fy", name: "Frisian" },
    { code: "gl", name: "Galician" },
    { code: "ka", name: "Georgian" },
    { code: "de", name: "German" },
    { code: "el", name: "Greek" },
    { code: "gu", name: "Gujarati" },
    { code: "ht", name: "Haitian Creole" },
    { code: "ha", name: "Hausa" },
    { code: "haw", name: "Hawaiian" },
    { code: "he", name: "Hebrew" },
    { code: "hi", name: "Hindi" },
    { code: "hmn", name: "Hmong" },
    { code: "hu", name: "Hungarian" },
    { code: "is", name: "Icelandic" },
    { code: "ig", name: "Igbo" },
    { code: "id", name: "Indonesian" },
    { code: "ga", name: "Irish" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "jw", name: "Javanese" },
    { code: "kn", name: "Kannada" },
    { code: "kk", name: "Kazakh" },
    { code: "km", name: "Khmer" },
    { code: "rw", name: "Kinyarwanda" },
    { code: "ko", name: "Korean" },
    { code: "ku", name: "Kurdish" },
    { code: "ky", name: "Kyrgyz" },
    { code: "lo", name: "Lao" },
    { code: "la", name: "Latin" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "lb", name: "Luxembourgish" },
    { code: "mk", name: "Macedonian" },
    { code: "mg", name: "Malagasy" },
    { code: "ms", name: "Malay" },
    { code: "ml", name: "Malayalam" },
    { code: "mt", name: "Maltese" },
    { code: "mi", name: "Maori" },
    { code: "mr", name: "Marathi" },
    { code: "mn", name: "Mongolian" },
    { code: "my", name: "Myanmar (Burmese)" },
    { code: "ne", name: "Nepali" },
    { code: "no", name: "Norwegian" },
    { code: "ny", name: "Nyanja (Chichewa)" },
    { code: "or", name: "Odia (Oriya)" },
    { code: "ps", name: "Pashto" },
    { code: "fa", name: "Persian" },
    { code: "pl", name: "Polish" },
    { code: "pt", name: "Portuguese" },
    { code: "pa", name: "Punjabi" },
    { code: "ro", name: "Romanian" },
    { code: "ru", name: "Russian" },
    { code: "sm", name: "Samoan" },
    { code: "gd", name: "Scots Gaelic" },
    { code: "sr", name: "Serbian" },
    { code: "st", name: "Sesotho" },
    { code: "sn", name: "Shona" },
    { code: "sd", name: "Sindhi" },
    { code: "si", name: "Sinhala" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "so", name: "Somali" },
    { code: "es", name: "Spanish" },
    { code: "su", name: "Sundanese" },
    { code: "sw", name: "Swahili" },
    { code: "sv", name: "Swedish" },
    { code: "tl", name: "Tagalog (Filipino)" },
    { code: "tg", name: "Tajik" },
    { code: "ta", name: "Tamil" },
    { code: "tt", name: "Tatar" },
    { code: "te", name: "Telugu" },
    { code: "th", name: "Thai" },
    { code: "tr", name: "Turkish" },
    { code: "tk", name: "Turkmen" },
    { code: "uk", name: "Ukrainian" },
    { code: "ur", name: "Urdu" },
    { code: "ug", name: "Uyghur" },
    { code: "uz", name: "Uzbek" },
    { code: "vi", name: "Vietnamese" },
    { code: "cy", name: "Welsh" },
    { code: "xh", name: "Xhosa" },
    { code: "yi", name: "Yiddish" },
    { code: "yo", name: "Yoruba" },
    { code: "zu", name: "Zulu" },
  ]

  useEffect(() => {
    const handleLoginWithStoredId = async () => {
      try {
        const storedUserId = localStorage.getItem("id")

        if (!storedUserId) {
          setIsLoggedIn(false)
          return
        }

        setUserId(storedUserId)
        setIsLoggedIn(true)

        const userDetailsResponse = await fetch(getApiUrl("/api/get-user-by-userid"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: storedUserId }),
        })

        if (userDetailsResponse.ok) {
          const userDetails = await userDetailsResponse.json()
          const parsed = JSON.parse(userDetails)

          setUserEmail(parsed?.email)

          const storedSubscriptionStatus = localStorage.getItem("isSubscribed")
          if (storedSubscriptionStatus) {
            setIsSubscribed(JSON.parse(storedSubscriptionStatus))
          }

          const storedPlanStatus = localStorage.getItem("isPremiumPlan")
          if (storedPlanStatus) {
            setIsPremiumPlan(JSON.parse(storedPlanStatus))
          }

          const filenamesResponse = await fetch(getApiUrl(`/api/get-filenames?email=${encodeURIComponent(parsed?.email)}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (filenamesResponse.ok) {
            const filenamesData = await filenamesResponse.json()
            setFilenames(filenamesData.filenames || [])
          }
        } else {
          setIsLoggedIn(false)
          localStorage.removeItem("id")
        }
      } catch (error) {
        console.error("Error logging in with stored id:", error)
        setIsLoggedIn(false)
      }
    }

    handleLoginWithStoredId()
  }, [])

  const handleStream = async (url, formData) => {
    let myRunId
    try {
      // Abort any previous stream
      if (streamControllerRef.current) {
        try {
          streamControllerRef.current.abort()
        } catch {}
      }

      const controller = new AbortController()
      streamControllerRef.current = controller
      myRunId = ++streamRunIdRef.current

      const payload = {
        prompt: formData.get("prompt"),
        filename: formData.get("filename"),
        language: formData.get("language"),
        user_id: formData.get("user_id"),
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")

      // Add a bot message placeholder ONCE
      setMessages((prev) => [...prev, { type: "bot", content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // If a newer request started, stop updating this one
        if (myRunId !== streamRunIdRef.current) return

        const chunkText = decoder.decode(value, { stream: true })
        if (!chunkText) continue

        // 🔑 Each chunk is the new delta – append it to the last bot message
        setMessages((prevMessages) => {
          const updated = [...prevMessages]
          if (updated.length === 0) return updated

          const lastIndex = updated.length - 1
          const lastMsg = updated[lastIndex]

          if (lastMsg.type === "bot") {
            updated[lastIndex] = {
              ...lastMsg,
              content: (lastMsg.content || "") + chunkText,
            }
          }

          return updated
        })
      }

      // Flush any remaining buffered text from the decoder
      const remaining = decoder.decode()
      if (remaining) {
        setMessages((prevMessages) => {
          const updated = [...prevMessages]
          if (updated.length === 0) return updated

          const lastIndex = updated.length - 1
          const lastMsg = updated[lastIndex]

          if (lastMsg.type === "bot") {
            updated[lastIndex] = {
              ...lastMsg,
              content: (lastMsg.content || "") + remaining,
            }
          }

          return updated
        })
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Error handling stream", error)
      }
    } finally {
      if (myRunId === streamRunIdRef.current) {
        streamControllerRef.current = null
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.target)
    formData.set("filename", selectedFile)
    formData.set("language", selectedLanguage)
    formData.set("user_id", userId)

    setMessages((prevMessages) => [...prevMessages, { type: "user", content: formData.get("prompt") }])

    try {
      await handleStream(getApiUrl("/api/chat_paper"), formData)
    } catch (error) {
      console.error("Error during handleSubmit:", error)
    }

    event.target.reset()
  }

  const openPopup = (msgContent) => {
    setPopupData({ title: "", tags: "", msgContent })
    setShowPopup(true)
  }

  const closePopup = () => {
    setShowPopup(false)
  }

  const handlePopupSave = async () => {
    const summaryData = {
      text: popupData.msgContent,
      title: popupData.title,
      tags: popupData.tags.split(",").map((tag) => tag.trim()),
      type: "chat with paper",
      email: userEmail,
    }

    try {
      const response = await fetch(getApiUrl("/api/save"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(summaryData),
      })

      if (!response.ok) {
        throw new Error("Failed to save message.")
      }

      console.log("Message saved successfully!")
      closePopup()
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div>
      {isLoggedIn && isSubscribed ? (
        <div className="medicoed-aichat-container">
          <h1 className="medicoed-aichat-heading">
            Chat With <span>Document</span>
          </h1>
          <div className="medicoed-aichat-chat-container">
            <div className="medicoed-aichat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`medicoed-aichat-message ${msg.type}`}>
                  <div className="medicoed-aichat-message-content">
                    {msg.type === "bot" ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                    {msg.type === "bot" && (
                      <div>
                        <button className="medicoed-aichat-secondary-button" onClick={() => handleCopy(msg.content)}>
                          Copy
                        </button>
                        <button className="medicoed-aichat-secondary-button" onClick={() => openPopup(msg.content)}>
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="medicoed-aichat-input-section">
              <form id="chat-with-paper-form" className="medicoed-aichat-form" onSubmit={handleSubmit}>
                <label>Select Document</label>
                <select
                  id="filename"
                  name="filename"
                  className="medicoed-aichat-select"
                  value={selectedFile}
                  onChange={(e) => setSelectedFile(e.target.value)}
                >
                  <option value="">Select a file</option>
                  {filenames.map((filename, index) => (
                    <option key={index} value={filename}>
                      {filename}
                    </option>
                  ))}
                </select>
                <label>Select Language</label>
                <select
                  id="language"
                  name="language"
                  className="medicoed-aichat-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.name}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <textarea
                  id="paper-prompt"
                  name="prompt"
                  className="medicoed-aichat-input"
                  placeholder="Enter your message..."
                ></textarea>
                <button type="submit" className="medicoed-aichat-button">
                  Submit
                </button>
              </form>
            </div>
          </div>

          {showPopup && (
            <div className="medicoed-aichat-popup-overlay">
              <div className="medicoed-aichat-popup">
                <h2>Save Message</h2>
                <input
                  type="text"
                  placeholder="Title"
                  value={popupData.title}
                  onChange={(e) => setPopupData({ ...popupData, title: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={popupData.tags}
                  onChange={(e) => setPopupData({ ...popupData, tags: e.target.value })}
                />
                <button onClick={handlePopupSave}>Save Message</button>
                <button onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="medicoed-aichat-login-message">Please login and subscribe to chat with paper.</div>
      )}
    </div>
  )
}

export default AIChat
