import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIChat.css';

const CompareAndChat = () => {
  const [userEmail, setUserEmail] = useState('');
  const [filenames, setFilenames] = useState([]);
  const [selectedFile1, setSelectedFile1] = useState('');
  const [selectedFile2, setSelectedFile2] = useState('');
  const [messages, setMessages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', tags: '', msgContent: '' });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremiumPlan, setIsPremiumPlan] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'am', name: 'Amharic' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'zh', name: 'Chinese' },
    { code: 'co', name: 'Corsican' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Estonian' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'fy', name: 'Frisian' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hmn', name: 'Hmong' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'ig', name: 'Igbo' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'jw', name: 'Javanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'ko', name: 'Korean' },
    { code: 'ku', name: 'Kurdish' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'la', name: 'Latin' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'ny', name: 'Nyanja (Chichewa)' },
    { code: 'or', name: 'Odia (Oriya)' },
    { code: 'ps', name: 'Pashto' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sm', name: 'Samoan' },
    { code: 'gd', name: 'Scots Gaelic' },
    { code: 'sr', name: 'Serbian' },
    { code: 'st', name: 'Sesotho' },
    { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'so', name: 'Somali' },
    { code: 'es', name: 'Spanish' },
    { code: 'su', name: 'Sundanese' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tl', name: 'Tagalog (Filipino)' },
    { code: 'tg', name: 'Tajik' },
    { code: 'ta', name: 'Tamil' },
    { code: 'tt', name: 'Tatar' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'tk', name: 'Turkmen' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ug', name: 'Uyghur' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' },
  ];

  useEffect(() => {
    const handleLoginWithStoredCredentials = async () => {
      try {
        const storedCredentials = localStorage.getItem('rx_chatbot_credentials');
        const storedSubscriptionStatus = localStorage.getItem('isSubscribed');

        if (storedSubscriptionStatus) {
          setIsSubscribed(JSON.parse(storedSubscriptionStatus));
        }
        if (!storedCredentials) {
          throw new Error('No stored credentials found');
        }
        const { email, password } = JSON.parse(storedCredentials);

        const storedPlanStatus = localStorage.getItem('isPremiumPlan');
        console.log(storedPlanStatus);
        if (storedPlanStatus) {
          setIsPremiumPlan(JSON.parse(storedPlanStatus));
        }

        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log('Logged in successfully:', loginData);
          setUserEmail(email);
          setIsLoggedIn(true);

          // Fetch filenames after successful login
          const filenamesResponse = await fetch(`/api/get-filenames?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (filenamesResponse.ok) {
            const filenamesData = await filenamesResponse.json();
            setFilenames(filenamesData.filenames || []);
          } else {
            throw new Error('Failed to fetch filenames');
          }
        } else {
          throw new Error('Failed to login with stored credentials');
        }
      } catch (error) {
        console.error('Error logging in with stored credentials:', error);
      }
    };

    handleLoginWithStoredCredentials();
  }, []);

  useEffect(() => {
    const fetchFilenames = async () => {
      if (userEmail) {
        try {
          const response = await fetch(`/api/get-filenames?email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          const data = await response.json();
          setFilenames(data.filenames);
        } catch (error) {
          console.error('Error fetching filenames:', error);
        }
      }
    };

    fetchFilenames();
  }, [userEmail]);

  const createStreamedCompletion = async (url, formData) => {
    const payload = {
      prompt: formData.get('prompt'),
      filenames: [formData.get('filename1'), formData.get('filename2')],
      language: formData.get('language'),
      user_id: formData.get('user_id')
    };

    return fetch(url, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
    });
  };

  const handleStream = async (url, formData) => {
    try {
      const response = await createStreamedCompletion(url, formData);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let bufferedResponse = '';

      const processText = async ({ done, value }) => {
        if (done) {
          setMessages(prevMessages => {
            if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1].type !== 'bot') {
              return [...prevMessages, { type: 'bot', content: bufferedResponse }];
            } else {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1].content = bufferedResponse;
              return updatedMessages;
            }
          });
          return;
        }
        bufferedResponse = decoder.decode(value, { stream: true });
        await new Promise((resolve) => setTimeout(resolve, 100));
        setMessages(prevMessages => {
          if (prevMessages.length === 0 || prevMessages[prevMessages.length - 1].type !== 'bot') {
            return [...prevMessages, { type: 'bot', content: bufferedResponse }];
          } else {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1].content = bufferedResponse;
            return updatedMessages;
          }
        });
        return reader.read().then(processText);
      };

      return reader.read().then(processText).catch(err => {
        console.error('Error reading stream', err);
      });
    } catch (error) {
      console.error('Error handling stream', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.set('filename1', selectedFile1); // Ensure the selected file1 is included
    formData.set('filename2', selectedFile2); // Ensure the selected file2 is included
    formData.set('language', selectedLanguage); // Ensure the selected language is included

    formData.set('user_id', userEmail);
    
    setMessages(prevMessages => [...prevMessages, { type: 'user', content: formData.get("prompt") }]);

    try {
      await handleStream('/api/chat', formData);
    } catch (error) {
      console.error('Error during handleSubmit:', error);
    }

    event.target.reset();
  };

  const openPopup = (msgContent) => {
    setPopupData({ title: '', tags: '', msgContent });
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handlePopupSave = async () => {
    const summaryData = {
      text: popupData.msgContent,
      title: popupData.title,
      tags: popupData.tags.split(',').map(tag => tag.trim()),
      type: 'chat across papers',
      email: userEmail,
    };

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(summaryData),
      });

      if (!response.ok) {
        throw new Error('Failed to save message.');
      }

      console.log('Message saved successfully!');
      closePopup();
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div> {isLoggedIn && isSubscribed ? (
    <div className="AIChat-container">
      <h1 className="AIChat-heading">Compare Documents And <span>Chat</span></h1>
      <div className="AIChat-chat-container">
        <div className="AIChat-pastMessages">
          {messages.map((msg, index) => (
            <div key={index} className={`AIChat-message ${msg.type}`}>
              <div className="AIChat-message-content">
                {msg.type === 'bot' ? (
                  <ReactMarkdown  remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
                {msg.type === 'bot' && (
                <div><button
                className="AIChat-save-button"
                onClick={() => handleCopy(msg.content)}
              >
                Copy
            </button>
            <button
                  className="AIChat-save-button"
                  onClick={() => openPopup(msg.content)}
                >
                  Save
              </button>
              </div>
              )}
              </div>
              
            </div>
          ))}
        </div>
        <div className="AIChat-form-section">
          <form id="compare-and-chat-form" className="AIChat-chat-form" onSubmit={handleSubmit}>
          <label>Select Documents</label>
            <select
              id="filename1"
              name="filename1"
              className="AIChat-file-select"
              value={selectedFile1}
              onChange={(e) => setSelectedFile1(e.target.value)}
            >
              <option value="">Select first file</option>
              {filenames.map((filename, index) => (
                <option key={index} value={filename}>{filename}</option>
              ))}
            </select>
            <select
              id="filename2"
              name="filename2"
              className="AIChat-file-select"
              value={selectedFile2}
              onChange={(e) => setSelectedFile2(e.target.value)}
            >
              <option value="">Select second file</option>
              {filenames.map((filename, index) => (
                <option key={index} value={filename}>{filename}</option>
              ))}
            </select>
            <label>Select Language</label>
            <select
              id="language"
              name="language"
              className="AIChat-language-select"
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
              className="AIChat-prompt-box"
              placeholder="Enter your message..."
            ></textarea>
            <button type="submit" className="AIChat-button">Submit</button>
          </form>
        </div>
      </div>
      {showPopup && (
        <div className="AIChat-popup">
          <div className="AIChat-popup-content">
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
            <button onClick={handlePopupSave}>Save</button>
            <button onClick={closePopup}>Cancel</button>
          </div>
        </div>
        )}
        </div>
      ) : (
        <div className="AIChat-login-message">
          Please login and subscribe to compare and chat.
        </div>
      )}
    </div>
  );
};

export default CompareAndChat;
