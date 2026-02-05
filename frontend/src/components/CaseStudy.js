"use client"

//CaseStudy.js
import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "../styles/case-study.css"
import historyTakingData from "./CaseStudy/HistoryTaking.json"
import physicalExaminationData from "./CaseStudy/PhysicalExamination.json"
import differentialDiagnosisData from "./CaseStudy/DifferentialDiagnosis.json"
import stabilizationActionsData from "./CaseStudy/StabilizationActions.json"
import interventionsData from "./CaseStudy/Interventions.json"
import investigationsData from "./CaseStudy/Investigations.json"
import communicationsData from "./CaseStudy/Communications.json"
import handOffData from "./CaseStudy/HandOff.json"
import {
  FaHandsWash,
  FaHandPaper,
  FaUserCheck,
  FaLock,
  FaUserShield,
  FaHandshake,
  FaTools,
  FaMask,
} from "react-icons/fa"
import ReactMarkdown from "react-markdown"

const MAX_MESSAGES = 30

const CaseStudy = ({ selectedPanel, addResponse, setIsLoading, responses }) => {
  const [patientInfo, setPatientInfo] = useState(null)
  const [response, setResponse] = useState("")
  const location = useLocation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItems, setSelectedItems] = useState({})
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState({})
  const [showFinalDiagnosis, setShowFinalDiagnosis] = useState(false)
  const [isDiagnosisRecorded, setIsDiagnosisRecorded] = useState(false)
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const [reportPopup, setReportPopup] = useState(false)
  const [reportData, setReportData] = useState("")
  const [isReportGenerating, setIsReportGenerating] = useState(false)
  
  const caseStreamControllerRef = useRef(null)
  const caseStreamRunIdRef = useRef(0)
  const caseLastChunkRef = useRef("")

  const navigate = useNavigate()

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

  if (!isLoggedIn || !isSubscribed) {
    return <div>Please login and subscribe to access case studies.</div>
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category ? null : category)
  }

  // Extract category from URL
  const searchParams = new URLSearchParams(location.search)
  const category = searchParams.get("category") || ""

  const fetchCaseStudy = async () => {
    setIsGenerating(true) // Set loading state to true when generation starts
    const response = await fetch("/api/generate-case-study", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    })
    const data = await response.json()
    setPatientInfo(data.case_study)
    setIsGenerating(false) // Set loading state to false after completion
  }

const fetchSectionResponse = async (section, action) => {
  // Immediately show the user's action in the chat
  addResponse(action)
  setIsLoading(true)

  try {
    const caseInfo = JSON.stringify(patientInfo) // Send the entire case study info

    const response = await fetch("/api/case-study-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ case_info: caseInfo, section, action }),
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const data = await response.json()
    const result = data.response ?? ""

    // Display the bot's response after fetching
    addResponse(null, result)
  } catch (error) {
    console.error("Error fetching case study section response:", error)
    addResponse(null, "Sorry, there was an error generating the response for this section.")
  } finally {
    setIsLoading(false)
  }
}

  const handleCheckboxChange = (item, category) => {
    setSelectedItems((prevSelectedItems) => {
      const categoryItems = prevSelectedItems[category] || []
      if (categoryItems.includes(item)) {
        return {
          ...prevSelectedItems,
          [category]: categoryItems.filter((i) => i !== item),
        }
      } else {
        return {
          ...prevSelectedItems,
          [category]: [...categoryItems, item],
        }
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log("Submitting differential diagnoses...", selectedItems)

    const diagnosesArray = Object.values(selectedItems).flat()

    setDifferentialDiagnoses(diagnosesArray)
    console.log("Updated differential diagnoses:", diagnosesArray)
    setIsDiagnosisRecorded(true)
    setShowFinalDiagnosis(true)
  }

  const handleFinalDiagnosis = (diagnosis) => {
    setAreButtonsDisabled(true)
    fetchSectionResponse("diagnosis", diagnosis)
    setShowPopup(true) // Show popup after final diagnosis is handled
  }

  // Function to close the popup and navigate back
  const closePopupAndNavigate = () => {
    setShowPopup(false)
    navigate("/case-studies") // Navigate back to /case-study
  }

  // Function to disable scrolling
  const disableScroll = () => {
    document.body.style.overflow = "hidden"
  }

  // Function to enable scrolling
  const enableScroll = () => {
    document.body.style.overflow = "auto"
  }

  // Function to handle report generation with streaming
  const generateReport = async () => {
    setIsReportGenerating(true)
    disableScroll() // Disable scroll when the generation starts

    const caseInfo = JSON.stringify(patientInfo)

    const limitedResponses = responses.slice(-MAX_MESSAGES)

    const reportResponse = await fetch("/api/score-case-study", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ case_info: caseInfo, response_window: limitedResponses }),
    })

    const reader = reportResponse.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let result = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result = decoder.decode(value)

      // Update report data dynamically
      setReportData(result)
    }

    setIsReportGenerating(false)
    enableScroll() // Re-enable scroll after generation is complete
    setReportPopup(true) // Show the report popup
  }

  // Function to close report popup
  const closeReportPopup = () => {
    setReportPopup(false)
    navigate("/case-studies") // Navigate back to case studies
  }

  const renderContent = () => {
    switch (selectedPanel) {
      case "patient-information":
        return (
          <div>
            <h2>
              Patient <span style={{ color: "#6f42c1" }}>Information</span>
            </h2>
            <button onClick={fetchCaseStudy} disabled={isGenerating || areButtonsDisabled}>
              {isGenerating ? "Generating..." : "Generate Case Study"} {/* Update button text */}
            </button>
            <br />
            <br />
            {patientInfo && (
              <>
                <p style={{ fontSize: "1rem" }}>
                  <strong>Patient Name:</strong> {patientInfo["Patient Name"]}
                </p>
                <br />
                <p style={{ fontSize: "1rem" }}>
                  <strong>Age:</strong> {patientInfo["Age"]} years
                </p>
                <br />
                <p style={{ fontSize: "1rem" }}>
                  <strong>Gender:</strong> {patientInfo["Gender"]}
                </p>
                <br />
                <p style={{ fontSize: "1rem" }}>
                  <strong>Chief Complaint:</strong> {patientInfo["Chief Complaint"]}
                </p>
                <br />
                <p style={{ fontSize: "1rem" }}>
                  <strong>Case Summary:</strong> {patientInfo["Case Summary"]}
                </p>
              </>
            )}
          </div>
        )
      case "preparation":
        return (
          <div>
            <h2>
              Initial <span style={{ color: "#6f42c1" }}>Preparation</span>
            </h2>
            <div className="card-container">
              <div className="card">
                <FaHandsWash className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Wash Hands</h3>
                <p style={{ textAlign: "center" }} className="card-description">
                  Clean your hands thoroughly using soap and water or an alcohol-based hand sanitizer.
                </p>
              </div>
              <div className="card">
                <FaHandPaper className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Wear Gloves</h3>
                <p style={{ textAlign: "center" }} className="card-description">
                  Put on disposable gloves to protect yourself and prevent contamination.
                </p>
              </div>
              <div className="card">
                {/*<img src={maskIcon || "/placeholder.svg"} alt="Wear Mask" className="mask-icon" />*/}
                <FaMask className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Wear Mask</h3>
                <p style={{ textAlign: "center" }} className="card-description">
                  Use a mask to reduce the risk of spreading or contracting infections.
                </p>
              </div>
              <div className="card">
                <FaTools className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Verify Equipment</h3>
                <p style={{ textAlign: "center" }} className="card-description">
                  Check if all necessary equipment and materials are available in proper working condition.
                </p>
              </div>
            </div>

            <h2>
              Ethical <span style={{ color: "#6f42c1" }}>Considerations</span>
            </h2>
            <div className="card-container">
              <div className="card">
                <FaUserCheck className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Verify Patient Identity</h3>
                <p style={{ textAlign: "center" }}>Confirm patient name, date of birth, and medical record number</p>
              </div>
              <div className="card">
                <FaLock className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Respect Patient Autonomy</h3>
                <p style={{ textAlign: "center" }}>Ensure patient consent is obtained for all procedures</p>
              </div>
              <div className="card">
                <FaUserShield className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Maintain Confidentiality</h3>
                <p style={{ textAlign: "center" }}>Protect patient privacy and keep information confidential</p>
              </div>
              <div className="card">
                <FaHandshake className="card-icon" />
                <h3 style={{ textAlign: "center" }}>Act with Integrity</h3>
                <p style={{ textAlign: "center" }}>Provide honest and accurate information to the patient</p>
              </div>
            </div>
          </div>
        )
      case "history-taking":
        return (
          <div>
            <h2>
              History <span style={{ color: "#6f42c1" }}>Taking</span>
            </h2>
            <ul>
              {Object.entries(historyTakingData.HistoryTaking).map(([category, items]) => (
                <div key={category}>
                  <button
                    disabled={areButtonsDisabled}
                    onClick={() => addResponse(category, String(patientInfo[category]))}
                  >
                    {category}
                  </button>
                  <p>( {items.join(", ")} )</p>
                  <br />
                </div>
              ))}
            </ul>
          </div>
        )
      case "physical-examination":
        return (
          <div>
            <h2>
              Physical <span style={{ color: "#6f42c1" }}>Examination</span>
            </h2>
            <ul>
              {Object.entries(physicalExaminationData.PhysicalExamination).map(([category, items]) => (
                <div key={category}>
                  <button onClick={() => handleCategoryClick(category)}>▸ {category}</button>
                  {selectedCategory === category && (
                    <ul>
                      {items.map((item, index) => (
                        <li key={index}>
                          <button
                            disabled={areButtonsDisabled}
                            style={{ paddingLeft: "50px" }}
                            onClick={() => fetchSectionResponse("physical", item)}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
          </div>
        )
      case "differential-diagnosis":
        return (
          <form onSubmit={handleSubmit}>
            <h2>
              Differential <span style={{ color: "#6f42c1" }}>Diagnosis</span>
            </h2>
            <ul>
              {Object.entries(differentialDiagnosisData.DifferentialDiagnosis).map(([category, items]) => (
                <div key={category}>
                  <button type="button" onClick={() => handleCategoryClick(category)}>
                    ▸ {category}
                  </button>
                  {selectedCategory === category && (
                    <ul>
                      {items.map((item, index) => (
                        <li key={index}>
                          <label>
                            <input
                              type="checkbox"
                              value={item}
                              checked={selectedItems[category]?.includes(item) || false}
                              onChange={() => handleCheckboxChange(item, category)}
                            />
                            {item}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
            <button
              disabled={areButtonsDisabled}
              type="submit"
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                width: "fit-content",
                borderRadius: "20px",
                backgroundColor: "#6f42c1",
                color: "white",
              }}
            >
              Submit Differential Diagnoses
            </button>
            {isDiagnosisRecorded && (
              <p style={{ marginTop: "20px", color: "green" }}>Differential diagnosis has been recorded.</p>
            )}
          </form>
        )
      case "stabilization-actions":
        return (
          <div>
            <h2>
              Stabilization <span style={{ color: "#6f42c1" }}>Actions</span>
            </h2>
            <ul>
              {Object.entries(stabilizationActionsData.StabilizationActions).map(([category, items]) => (
                <div key={category}>
                  <button onClick={() => handleCategoryClick(category)}>▸ {category}</button>
                  {selectedCategory === category && (
                    <ul>
                      {items.map((item, index) => (
                        <li key={index}>
                          <button
                            disabled={areButtonsDisabled}
                            style={{ paddingLeft: "50px" }}
                            onClick={() => fetchSectionResponse("stabilization", item)}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
          </div>
        )
      case "clinical-interventions":
        return (
          <div>
            <h2>Interventions</h2>
            <h3>Medications</h3>
            <ul>
              {Object.entries(interventionsData.Interventions.Medications).map(([category, items]) => (
                <div key={category}>
                  <button onClick={() => handleCategoryClick(category)}>▸ {category}</button>
                  {selectedCategory === category && (
                    <ul>
                      {Array.isArray(items)
                        ? items.map((item, index) => (
                            <li key={index}>
                              <button
                                disabled={areButtonsDisabled}
                                style={{ paddingLeft: "50px" }}
                                onClick={() => fetchSectionResponse("interventions", item)}
                              >
                                {item}
                              </button>
                            </li>
                          ))
                        : Object.entries(items).map(([subCategory, subItems]) => (
                            <div key={subCategory}>
                              <button onClick={() => handleCategoryClick(subCategory)}>{subCategory}</button>
                              {selectedCategory === subCategory && (
                                <ul>
                                  {subItems.map((item, index) => (
                                    <li key={index}>
                                      <button
                                        disabled={areButtonsDisabled}
                                        style={{ paddingLeft: "50px" }}
                                        onClick={() => fetchSectionResponse("interventions", item)}
                                      >
                                        {item}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
            <h3>Procedures</h3>
            <ul>
              {interventionsData.Interventions.Procedures.map((procedure, index) => (
                <li key={index}>
                  <button
                    disabled={areButtonsDisabled}
                    onClick={() => fetchSectionResponse("interventions", procedure)}
                  >
                    {procedure}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      case "investigations":
        return (
          <div>
            <h2>Investigations</h2>
            <ul>
              {Object.entries(investigationsData.Investigations).map(([category, items]) => (
                <div key={category}>
                  <button onClick={() => handleCategoryClick(category)}>▸ {category}</button>
                  {selectedCategory === category && (
                    <ul>
                      {items.map((item, index) => (
                        <li key={index}>
                          <button
                            disabled={areButtonsDisabled}
                            style={{ paddingLeft: "50px" }}
                            onClick={() => fetchSectionResponse("investigations", item)}
                          >
                            {item}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </ul>
          </div>
        )
      case "consultations":
        return (
          <div>
            <h2>Consultations</h2>
            <ul>
              {communicationsData.Communications.Communication.map((consultation, index) => (
                <li key={index}>
                  <button
                    disabled={areButtonsDisabled}
                    onClick={() => fetchSectionResponse("connsultations", consultation)}
                  >
                    {consultation}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      case "patient-handover":
        return (
          <div>
            <h2>
              Patient <span style={{ color: "#6f42c1" }}>Handover</span>
            </h2>
            <div
              style={{
                fontSize: "0.9rem",
                color: "#b0b0b0",
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "rgba(102, 16, 242, 0.1)",
                borderRadius: "4px",
              }}
            >
              Messages: {responses.length} / {MAX_MESSAGES * 2} (Last {MAX_MESSAGES} will be sent for report)
            </div>
            <ul>
              {handOffData.HandOff.Situation.map((item, index) => (
                <li key={index}>
                  <button disabled={areButtonsDisabled} onClick={() => fetchSectionResponse("handover", item)}>
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            {showFinalDiagnosis ? (
              <div>
                <h2>
                  Select <span style={{ color: "#6f42c1" }}>Final Diagnosis</span>
                </h2>
                <ul>
                  {differentialDiagnoses.map((diagnosis, index) => (
                    <li key={index}>
                      <button disabled={areButtonsDisabled} onClick={() => handleFinalDiagnosis(diagnosis)}>
                        {diagnosis}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Submit the Differential Diagnoses and then select the Final Diagnosis</p>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="case-study">
      {renderContent()}
      {/* Popup for final diagnosis */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Diagnosis Recorded</h3>
            <button onClick={generateReport} disabled={isReportGenerating}>
              {isReportGenerating ? "Generating Report..." : "Generate Report"}
            </button>
          </div>
        </div>
      )}

      {reportPopup && (
        <div className="cs-report-popup-overlay">
          <div className="cs-report-popup-modal">
            <div className="cs-report-popup-header">
              <h3>Medical Case Report</h3>
            </div>
            <div className="cs-report-popup-body">
              <div className="cs-report-content-wrapper">
                <ReactMarkdown>{reportData}</ReactMarkdown>
              </div>
            </div>
            <div className="cs-report-popup-footer">
              <button className="cs-report-close-button" onClick={closeReportPopup}>
                Return to Case Studies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaseStudy
