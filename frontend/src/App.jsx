import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';

function App() {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [language, setLanguage] = useState('en');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Fetch History Logs from Backend
  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/history');
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Generate Content via Gemini API
  const handleGenerate = async () => {
    if (!title || !prompt) {
      alert("Please enter both Title and Prompt!");
      return;
    }
    setLoading(true);
    setStatusMessage('');
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        title,
        prompt,
        language
      });
      setGeneratedText(response.data.generatedText);
    } catch (error) {
      alert("Error generating content. Check backend console.");
    } finally {
      setLoading(false);
    }
  };

  // Save to MongoDB
  const handleSaveToRepository = async () => {
    if (!generatedText) {
      alert("No content available to save!");
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/save', {
        title: title || 'Untitled Automation',
        generatedText: generatedText, 
        status: 'Draft'
      });
      showToast('Repository Transaction Successful!');
      fetchHistory(); 
    } catch (error) {
      console.error("Failed to save:", error);
      showToast('Failed to save transaction data.');
    }
  };

  // Delete Log
  const handleDeleteLog = async (id) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      try {
        await axios.delete(`http://localhost:5000/api/history/${id}`);
        fetchHistory();
        showToast('Record deleted successfully.');
      } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete log from database.");
      }
    }
  };

  // Download PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(generatedText, 180);
    doc.text(splitText, 10, 10);
    doc.save(`${title || 'AI_Content'}.pdf`);
  };

  // Speak Features (Tamil & English Fixed)
  const speakText = () => {
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(generatedText);
    if (language === 'ta') {
      speech.lang = 'ta-IN';
      const voices = window.speechSynthesis.getVoices();
      const tamilVoice = voices.find(v => v.lang.includes('ta') || v.name.toLowerCase().includes('tamil'));
      if (tamilVoice) speech.voice = tamilVoice;
    } else {
      speech.lang = 'en-US';
    }
    window.speechSynthesis.speak(speech);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  // EXTRA FEATURE 1: COPY TO CLIPBOARD
  const copyToClipboard = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    showToast("📋 Copied to Clipboard successfully!");
  };

  // EXTRA FEATURE 2: CLEAR TERMINAL BOX
  const clearTerminal = () => {
    setGeneratedText('');
    showToast("🧹 Terminal Cleared.");
  };

  // EXTRA FEATURE 3: HELPER FOR TOAST ALERTS
  const showToast = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000); // 3 நொடிகள் கழித்து தானாக மறையும்
  };

  // EXTRA FEATURE 4: WORD COUNTER LOGIC
  const getWordCount = () => {
    return generatedText.trim() === '' ? 0 : generatedText.trim().split(/\s+/).length;
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      
      {/* Title */}
      <h1 style={{ textAlign: 'center', color: '#1A365D', fontWeight: 'bold', fontSize: '32px', marginBottom: '5px' }}>
        AI-POWERED CONTENT MANAGER
      </h1>
      <h4 style={{ textAlign: 'center', color: '#718096', fontWeight: 'normal', marginTop: '0', marginBottom: '35px' }}>
        Enterprise Content Automation System Terminal Cluster
      </h4>
      
      {/* Show/Hide History */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          style={{ padding: '10px 20px', backgroundColor: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {showHistory ? "📁 HIDE REPOSITORY HISTORY" : "📜 SHOW REPOSITORY HISTORY"}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '30px' }}>
        {/* Left Control Panel */}
        <div style={{ flex: 1, border: '1px solid #dcdde1', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '8px', marginTop: '0' }}>System Control Panel</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label><b>Output Language Target:</b></label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '10px', width: '100%', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="en">English (US)</option>
              <option value="ta">Tamil (தமிழ்)</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label><b>Document Header Title:</b></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Data Structures Introduction" style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label><b>Execution Logic Prompt Structure:</b></label>
            <textarea rows="5" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Provide prompt instructions here..." style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          <button onClick={handleGenerate} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? "GENERATING REPOSITORY..." : "EXECUTE AUTOMATION"}
          </button>
        </div>

        {/* Right Output Terminal */}
        <div style={{ flex: 1, border: '1px solid #dcdde1', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #2ecc71', paddingBottom: '8px', marginBottom: '15px' }}>
            <h3 style={{ color: '#2c3e50', margin: 0 }}>System Output Terminal</h3>
            {/* Live Counters */}
            <span style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: 'bold' }}>
              Words: {getWordCount()} | Chars: {generatedText.length}
            </span>
          </div>
          
          <textarea 
            value={generatedText} 
            onChange={(e) => setGeneratedText(e.target.value)} 
            placeholder="Output terminal code block data stream..." 
            style={{ width: '100%', height: '320px', padding: '15px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f8f9fa', fontFamily: 'Courier New, monospace', fontSize: '15px', boxSizing: 'border-box', resize: 'vertical', lineHeight: '1.6' }} 
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleSaveToRepository} style={{ flex: 1.2, padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f1f2f6' }}>SAVE TO DB</button>
            <button onClick={downloadPDF} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📥 PDF</button>
            <button onClick={speakText} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#eccc68', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔊 Speak</button>
            <button onClick={stopSpeech} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#ff7675', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>⏹️ Stop</button>
            
            {/* New Added Extra Feature Buttons */}
            <button onClick={copyToClipboard} disabled={!generatedText} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#34495e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📋 Copy</button>
            <button onClick={clearTerminal} disabled={!generatedText} style={{ flex: 1, padding: '8px', fontSize: '12px', backgroundColor: '#bdc3c7', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🧹 Clear</button>
          </div>

          {/* Toast Notification Style Message */}
          {statusMessage && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#2ecc71', color: 'white', fontWeight: 'bold', borderRadius: '4px', textAlign: 'center', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {statusMessage}
            </div>
          )}
        </div>
      </div>

      {/* History Table */}
      {showHistory && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #dcdde1', marginTop: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px', marginTop: '0' }}>📜 Repository History Dashboard</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f2f6', textAlign: 'left', borderBottom: '2px solid #dcdde1' }}>
                <th style={{ padding: '12px' }}>Document Title</th>
                <th style={{ padding: '12px' }}>Output Log</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} style={{ borderBottom: '1px solid #f1f2f6' }}>
                  <td style={{ padding: '12px' }}><b>{item.title}</b></td>
                  <td style={{ padding: '12px' }}><div style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '13px', fontFamily: 'monospace' }}>{item.generatedText || item.content}</div></td>
                  <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#ffeaa7', color: '#d63031', padding: '3px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{item.status || 'Saved'}</span></td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(item.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteLog(item._id)} style={{ padding: '5px 10px', backgroundColor: '#d63031', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️ Delete</button>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#a4b0be' }}>No active repository logs verified inside database transaction cluster.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;