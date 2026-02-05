"use client"

import { useState, useEffect } from "react"
import "../styles/summary-generator.css"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getApiUrl } from "../../../env-config.js"

const SummaryGenerator = () => {
  const [filenames, setFilenames] = useState([])
  const [selectedFile, setSelectedFile] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [chatMessages, setChatMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [summaryTitle, setSummaryTitle] = useState("")
  const [summaryTags, setSummaryTags] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isPremiumPlan, setIsPremiumPlan] = useState(false)

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
    const handleLoginWithStoredCredentials = async () => {
      try {
        const storedCredentials = localStorage.getItem("rx_chatbot_credentials")
        const storedSubscriptionStatus = localStorage.getItem("isSubscribed")

        if (storedSubscriptionStatus) {
          setIsSubscribed(JSON.parse(storedSubscriptionStatus))
        }
        if (!storedCredentials) {
          throw new Error("No stored credentials found")
        }
        const { email, password } = JSON.parse(storedCredentials)

        const storedPlanStatus = localStorage.getItem("isPremiumPlan")
        console.log(storedPlanStatus)
        if (storedPlanStatus) {
          setIsPremiumPlan(JSON.parse(storedPlanStatus))
        }

        const loginResponse = await fetch(getApiUrl("/api/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        })

        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          console.log("Logged in successfully:", loginData)
          setIsLoggedIn(true)
          setUserEmail(email)

          // Fetch filenames if login is successful
          const filenamesResponse = await fetch(getApiUrl(`/api/get-filenames?email=${encodeURIComponent(email)}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })
          const filenamesData = await filenamesResponse.json()
          setFilenames(filenamesData.filenames || [])
        } else {
          throw new Error("Failed to login with stored credentials")
        }
      } catch (error) {
        console.error("Error logging in with stored credentials:", error)
        // Optionally handle login failure (e.g., clear local storage)
        // localStorage.removeItem('rx_chatbot_credentials');
      }
    }

    // Attempt login with stored credentials when component mounts
    handleLoginWithStoredCredentials()
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Clear any previous messages before starting a new request
    setChatMessages([])

    try {
      const response = await fetch(getApiUrl("/api/individual-summary"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFile,
          language: selectedLanguage,
          user_id: userEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Network response was not ok.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Create a single bot message that we'll update
      setChatMessages([{ type: "bot", content: "" }])

      // Process the stream
      const completeResponse = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log("Stream complete")
          break
        }

        // Decode the current chunk
        const chunk = decoder.decode(value, { stream: true })

        await new Promise((resolve) => setTimeout(resolve, 100));
        // This is the key change - we're not accumulating or appending
        setChatMessages([{ type: "bot", content: chunk }])
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setIsLoading(false)
      setChatMessages([{ type: "bot", content: "An error occurred while generating the summary." }])
    }
  }

  const handleInputChange = (e) => {
    setSelectedFile(e.target.value)
  }

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value)
  }

  const handleShowSavePopup = () => {
    setShowSavePopup(true)
  }

  const closePopup = () => {
    setShowSavePopup(false)
  }

  const handleSaveSummary = async () => {
    const summaryData = {
      text: chatMessages[chatMessages.length - 1].content, // Assuming you want to save the last received summary
      title: summaryTitle,
      tags: summaryTags.split(",").map((tag) => tag.trim()), // Split tags by comma and trim whitespace
      type: "summary", // Fixed type as 'summary'
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
        throw new Error("Failed to save summary.")
      }

      console.log("Summary saved successfully!")
      // Optionally update UI or show success message
      setShowSavePopup(false) // Close the popup after successful save
    } catch (error) {
      console.error("Error saving summary:", error)
      // Optionally handle error (e.g., show error message) && isPremiumPlan
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="SummaryGenerator-container">
      <h1 className="SummaryGenerator-heading">
        Generate <span>Summary</span>
      </h1>
      {isLoggedIn && isSubscribed ? (
        <div className="SummaryGenerator-chat-container">
          <div className="SummaryGenerator-chat">
            {chatMessages.map((message, index) => (
              <div key={index} className={`SummaryGenerator-message ${message.type}`}>
                <div className="SummaryGenerator-message-content">
                  {message.type === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  )}
                  <button className="SummaryGenerator-save-button" onClick={() => handleCopy(message.content)}>
                    Copy
                  </button>
                  <button className="SummaryGenerator-save-button" onClick={handleShowSavePopup}>
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showSavePopup && (
            <div className="SummaryGenerator-popup">
              <div className="SummaryGenerator-popup-content">
                <h2>Save Summary</h2>
                <input
                  type="text"
                  placeholder="Enter title"
                  value={summaryTitle}
                  onChange={(e) => setSummaryTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Enter tags (comma-separated)"
                  value={summaryTags}
                  onChange={(e) => setSummaryTags(e.target.value)}
                />
                <button className="SummaryGenerator-button" onClick={handleSaveSummary}>
                  Save
                </button>
                <button className="SummaryGenerator-button" style={{ marginLeft: "10px" }} onClick={closePopup}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="SummaryGenerator-form-section">
            <form
              id="chat-individual-summ-form"
              onSubmit={handleFormSubmit}
              style={{ display: "flex", alignItems: "center" }}
            >
              <label>Select Document</label>
              <select
                id="filename"
                name="filename"
                className="SummaryGenerator-select"
                value={selectedFile}
                onChange={handleInputChange}
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
                className="SummaryGenerator-select"
                value={selectedLanguage}
                onChange={handleLanguageChange}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.name}>
                    {language.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="SummaryGenerator-button" disabled={isLoading}>
                {isLoading ? "Loading..." : "Generate Summary"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p>Please login and subscribe to generate summaries.</p>
      )}
    </div>
  )
}

export default SummaryGenerator

