"use client"

import { useState, useEffect } from "react"
import "../styles/questions-generator.css"
import { getApiUrl } from "../../../env-config.js"

const QuestionsGenerator = () => {
  const [userEmail, setUserEmail] = useState("")
  const [filenames, setFilenames] = useState([])
  const [selectedFile, setSelectedFile] = useState("")
  const [quiz, setQuiz] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showPopup, setShowPopup] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null)
  const [correctAnswers, setCorrectAnswers] = useState({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)

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
  const checkAuthAndFetchUser = async () => {
    const userId = localStorage.getItem("id")
    if (!userId) {
      setIsLoggedIn(false)
      return
    }

    try {
      // Fetch user by ID
      const response = await fetch(getApiUrl("/api/get-user-by-userid"), {
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

      // Case 1: backend returns JSON string
      if (typeof userData === "string") {
        try {
          userData = JSON.parse(userData)
        } catch (e) {
          console.error("Failed to parse userData string:", e)
          return
        }
      }

      // Case 2: backend returns { payload: "..." } or { payload: {} }
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
            console.error("Failed to parse payload string:", e)
            return
          }
        } else if (payload && typeof payload === "object") {
          userData = payload
        }
      }

      let email =
        userData &&
        typeof userData === "object" &&
        "email" in userData
          ? userData.email
          : undefined

      if (!email) {
        console.error("Email not found in userData:", userData)
        return
      }

      setUserEmail(email)
      setIsLoggedIn(true)

      // Load subscription status
      const storedSubscriptionStatus = localStorage.getItem("isSubscribed")
      if (storedSubscriptionStatus) {
        setIsSubscribed(JSON.parse(storedSubscriptionStatus))
      }

      // Fetch filenames using email
      const filenamesResponse = await fetch(
        getApiUrl(`/api/get-filenames?email=${encodeURIComponent(email)}`),
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
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


  const generateQuiz = async () => {
    const validNumberOfQuestions = Number.parseInt(numberOfQuestions, 10)

    if (isNaN(validNumberOfQuestions) || validNumberOfQuestions <= 0) {
      console.error("Number of questions must be a positive integer.")
      return
    }
    if (selectedFile) {
      setLoading(true)
      try {
        const userId = localStorage.getItem("id")
        const response = await fetch(getApiUrl("/api/get-quiz"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            filename: selectedFile,
            language: selectedLanguage,
            number_of_questions: validNumberOfQuestions,
          }),
        })
        const data = await response.json()
        setQuiz(data.quiz)
      } catch (error) {
        console.error("Error generating quiz:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value)
  }

  const handleOptionClick = (questionIndex, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }))
  }

  const handleSaveQuestion = (questionIndex) => {
    setShowPopup(true)
    setSelectedQuestionIndex(questionIndex)
    const correctAnswer = quiz[questionIndex].answer
    setCorrectAnswers({ [questionIndex]: correctAnswer })
  }

  const handlePopupSave = async () => {
    try {
      if (selectedQuestionIndex !== null) {
        const selectedQuestion = quiz[selectedQuestionIndex]
        const questionData = {
          text: `${selectedQuestionIndex + 1}. ${selectedQuestion.question} Answer: ${correctAnswers[selectedQuestionIndex]}`,
          title: title.trim(),
          tags: tags
            .trim()
            .split(",")
            .map((tag) => tag.trim()),
          type: "question",
          email: userEmail,
        }

        const response = await fetch(getApiUrl("/api/save"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        })

        if (!response.ok) {
          throw new Error("Failed to save question.")
        }

        console.log("Question saved successfully!")
        setShowPopup(false)
      } else {
        console.error("No question selected to save.")
      }
    } catch (error) {
      console.error("Error saving question:", error)
    }
  }

  return (
    <div className="medicoed-questions-container">
      <h1 className="medicoed-questions-title">
        Quiz <span>Generator</span>
      </h1>
      {isLoggedIn && isSubscribed ? (
        <div className="medicoed-questions-form">
          <div className="medicoed-questions-input">
            <label htmlFor="numberOfQuestions" style={{ color: "var(--medicoed-text-secondary)" }}>Number of Questions:</label>
            <input
              type="number"
              id="numberOfQuestions"
              value={numberOfQuestions}
              onChange={(e) => setNumberOfQuestions(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--medicoed-border)",
                marginRight: "16px",
                backgroundColor: "var(--medicoed-bg-tertiary)",
                color: "var(--medicoed-text-primary)",
              }}
              min="1"
            />
          </div>
          <label style={{ marginRight: "16px", color: "var(--medicoed-text-secondary)" }}>Select Document</label>
          <select
            id="filename"
            name="filename"
            className="medicoed-questions-select"
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
          <label style={{ color: "var(--medicoed-text-secondary)" }}>Select Language</label>
          <select
            id="language"
            name="language"
            className="medicoed-questions-select"
            value={selectedLanguage}
            onChange={handleLanguageChange}
          >
            {languages.map((language) => (
              <option key={language.code} value={language.name}>
                {language.name}
              </option>
            ))}
          </select>
          <button
            className="medicoed-questions-button"
            onClick={generateQuiz}
            disabled={loading}
            style={{ marginTop: "24px" }}
          >
            {loading ? "Generating Quiz..." : "Generate Quiz"}
          </button>
        </div>
      ) : (
        <p style={{ color: "var(--medicoed-text-secondary)", textAlign: "center" }}>Please login and subscribe to generate quiz.</p>
      )}
      <div className="medicoed-questions-quiz">
        {quiz.length > 0 &&
          quiz.map((item, index) => (
            <div key={index} className="medicoed-questions-quiz-item">
              <h3 className="medicoed-questions-question">{item.question}</h3>
              <ul className="medicoed-questions-options">
                {item.options.map((option, idx) => (
                  <li
                    key={idx}
                    className={`medicoed-questions-option ${
                      selectedAnswers[index] ? (option === item.answer ? "correct" : "incorrect") : ""
                    }`}
                    onClick={() => handleOptionClick(index, option)}
                  >
                    {option}
                  </li>
                ))}
              </ul>
              {selectedAnswers[index] && (
                <div className="medicoed-questions-answer">
                  <strong>Correct Answer: {item.answer}</strong>
                  <br /> <br />
                  Explanation: {item.explanation}
                </div>
              )}
              <button className="medicoed-questions-save-button" onClick={() => handleSaveQuestion(index)}>
                Save Question
              </button>
            </div>
          ))}
      </div>

      {showPopup && (
        <div className="medicoed-questions-popup-overlay">
          <div className="medicoed-questions-popup">
            <h2>Enter Title and Tags</h2>
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <button onClick={handlePopupSave}>Save Question</button>
            <button onClick={() => setShowPopup(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionsGenerator
