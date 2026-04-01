import { useState, useRef } from "react";
import jsPDF from "jspdf";

const callAI = async (prompt) => {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    alert("Set VITE_ANTHROPIC_API_KEY in .env for AI features.");
    throw new Error("Missing API key");
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const msg = data?.error?.message || JSON.stringify(data.error || data);
    throw new Error(msg);
  }
  return data.content?.[0]?.text || "No response";
};

export default function ContinuumROAApp() {
  const [transcript, setTranscript] = useState("");
  const [roaOutput, setRoaOutput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isRoaFixing, setIsRoaFixing] = useState(false);

  const recognitionRef = useRef(null);

  // ================== VOICE RECORDING ==================
  const startListening = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      alert("Speech Recognition not supported. Please use the latest Chrome or Edge browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-ZA";

    recognition.onresult = (event) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(fullTranscript.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event);
      setIsListening(false);
      alert("Speech recognition error. Please check your microphone and try again.");
    };

    recognition.onend = () => setIsListening(false);

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err) {
      alert("Failed to start recording. Make sure microphone permission is granted.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // ================== GENERATE ROA ==================
  const generateROA = async () => {
    if (!transcript.trim()) {
      alert("Please record or type client meeting notes first.");
      return;
    }
    if (!import.meta.env.VITE_ANTHROPIC_API_KEY?.trim()) {
      alert("Set VITE_ANTHROPIC_API_KEY in your environment.");
      return;
    }

    setIsProcessing(true);
    setRoaOutput("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2500,
          system: `You are an expert FAIS-compliant assistant for Denzil Appadu at Continuum Financial Services (FSP 46947). 
Generate a professional Record of Advice based STRICTLY on the transcript provided. 
Use clear section headings. Do not invent any information. Mark anything missing as [MISSING - ADVISOR TO COMPLETE].`,
          messages: [{ 
            role: "user", 
            content: `Client meeting transcript:\n\n${transcript}\n\nGenerate the full Record of Advice.` 
          }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setRoaOutput(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
      } else {
        setRoaOutput(data.content?.[0]?.text || "No response from AI.");
      }
    } catch (err) {
      setRoaOutput(`Error: ${err.message}\n\nCheck your internet and API key.`);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const fixRecommendation = async () => {
    if (!roaOutput) return;

    setIsRoaFixing(true);
    try {
      const improved = await callAI(
        `Improve ONLY the recommendation section of this Record of Advice.
Make it more professional, compliant, and detailed.

${roaOutput}`
      );
      setRoaOutput(improved);
    } catch (err) {
      alert(err.message || "Failed to improve recommendation.");
    } finally {
      setIsRoaFixing(false);
    }
  };

  const fixCompliance = async () => {
    if (!roaOutput) return;

    setIsRoaFixing(true);
    try {
      const improved = await callAI(
        `Review this Record of Advice for compliance.
Fix missing information and strengthen compliance wording.

${roaOutput}`
      );
      setRoaOutput(improved);
    } catch (err) {
      alert(err.message || "Failed to fix compliance.");
    } finally {
      setIsRoaFixing(false);
    }
  };

  // ================== AI CHAT REFINEMENT ==================
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !roaOutput) {
      alert("Generate the ROA first, then ask the AI to refine it.");
      return;
    }

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatting(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: "You are helping refine a Record of Advice for Continuum Financial Services. Give specific, actionable suggestions.",
          messages: [
            { role: "user", content: `Current ROA:\n\n${roaOutput}` },
            { role: "user", content: userMsg },
          ],
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "No reply received.";

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  // ================== DOWNLOAD PDF ==================
  const downloadPDF = () => {
    if (!roaOutput) return;

    const doc = new jsPDF();
    let y = 20;
    const cleanText = roaOutput.replace(/#/g, "").replace(/\*\*/g, "").replace(/---/g, "").trim();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CONTINUUM FINANCIAL SERVICES", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Financial Services Provider | FSP 46947", 105, y, { align: "center" });
    y += 15;

    doc.line(20, y, 190, y);
    y += 15;

    doc.setFontSize(11);
    doc.text("Advisor: Denzil Appadu", 20, y);
    y += 8;
    doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`, 20, y);
    y += 20;

    const sections = cleanText.split(/\n\s*(?=[A-Z][A-Z\s&()/-]+:)/);
    sections.forEach((section) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const lines = section.trim().split("\n");
      const title = lines[0]?.trim();
      const content = lines.slice(1).join("\n").trim();

      if (title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, 20, y);
        y += 8;
        doc.line(20, y, 190, y);
        y += 10;
      }

      if (content) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitLines = doc.splitTextToSize(content, 170);
        splitLines.forEach((line) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, 20, y);
          y += 6;
        });
        y += 8;
      }
    });

    // Signature section
    if (y > 220) doc.addPage();
    y = 40;
    doc.text("Client Signature: _______________________________", 20, y);
    y += 20;
    doc.text("Advisor Signature (Denzil Appadu): _______________________________", 20, y);
    y += 20;
    doc.text("Date: ________________", 20, y);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text("AI-Assisted Draft • Must be reviewed & signed by advisor • FSP 46947", 105, 290, { align: "center" });
    }

    doc.save(`ROA_Continuum_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="text-4xl font-bold text-amber-400">CONTINUUM FINANCIAL SERVICES</div>
          <div className="text-slate-500 mt-2">FSP 46947 • AI Record of Advice Assistant</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Recording Section */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
              <h2 className="text-2xl font-semibold mb-6">1. Record Client Meeting</h2>
              <div className="flex gap-4 mb-6">
                <button
                  onClick={startListening}
                  disabled={isListening}
                  className={`flex-1 py-4 rounded-2xl font-medium transition ${isListening ? "bg-slate-700" : "bg-sky-600 hover:bg-sky-500"}`}
                >
                  {isListening ? "🎙 Listening... Speak now" : "🎙 Start Voice Recording"}
                </button>
                <button
                  onClick={stopListening}
                  disabled={!isListening}
                  className={`flex-1 py-4 rounded-2xl font-medium transition ${!isListening ? "bg-slate-700" : "bg-red-600 hover:bg-red-500"}`}
                >
                  ⏹ Stop Recording
                </button>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Voice transcript appears here... or type manually"
                className="w-full h-52 bg-slate-950 border border-slate-700 rounded-2xl p-6 resize-y focus:border-amber-400"
              />
            </div>

            {/* Generate ROA Button */}
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
              <h2 className="text-2xl font-semibold mb-6">2. Generate Record of Advice</h2>
              <button
                onClick={generateROA}
                disabled={isProcessing || !transcript.trim()}
                className={`w-full py-5 rounded-2xl font-semibold text-lg transition ${isProcessing || !transcript.trim() ? "bg-slate-700" : "bg-emerald-600 hover:bg-emerald-500"}`}
              >
                {isProcessing ? "⏳ Generating ROA..." : "✅ Generate ROA"}
              </button>
            </div>

            {/* ROA Output */}
            {roaOutput && (
              <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Generated ROA</h2>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigator.clipboard.writeText(roaOutput)}
                      className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-xl text-sm"
                    >
                      Copy Text
                    </button>
                    <button 
                      onClick={downloadPDF} 
                      className="bg-amber-500 hover:bg-amber-600 px-6 py-2 rounded-xl font-medium"
                    >
                      📄 Download PDF
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={fixRecommendation}
                    disabled={isRoaFixing || !roaOutput}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
                  >
                    {isRoaFixing ? "Improving..." : "🔧 Improve Recommendation"}
                  </button>
                  <button
                    type="button"
                    onClick={fixCompliance}
                    disabled={isRoaFixing || !roaOutput}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded"
                  >
                    {isRoaFixing ? "Improving..." : "⚠ Fix Compliance"}
                  </button>
                </div>
                <pre className="bg-slate-950 p-6 rounded-2xl text-sm whitespace-pre-wrap max-h-96 overflow-auto border border-slate-700">
                  {roaOutput}
                </pre>
              </div>
            )}
          </div>

          {/* Right Column - AI Chat */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col">
            <h2 className="text-2xl font-semibold mb-6">3. AI Chat (Refine ROA)</h2>
            <p className="text-slate-400 mb-4 text-sm">Ask the AI to improve sections after generating the ROA.</p>

            <div className="flex-1 bg-slate-950 rounded-2xl p-6 mb-4 overflow-auto border border-slate-700 space-y-4 text-sm">
              {chatMessages.length === 0 && (
                <p className="text-slate-500 italic">Generate ROA first, then type e.g. "Strengthen the recommendation" or "Add risk appetite details"</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : ""}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl ${msg.role === "user" ? "bg-amber-600" : "bg-slate-800"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatting && <div className="text-amber-400">Claude is thinking...</div>}
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type refinement request here..."
                disabled={!roaOutput}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
              <button
                onClick={sendChatMessage}
                disabled={isChatting || !chatInput.trim() || !roaOutput}
                className="bg-amber-500 hover:bg-amber-600 px-8 rounded-2xl font-medium disabled:bg-slate-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-600 mt-12">
          AI-assisted draft only • Final responsibility lies with the licensed advisor (Denzil Appadu, FSP 46947)
        </div>
      </div>
    </div>
  );
}
