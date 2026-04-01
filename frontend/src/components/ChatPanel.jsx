/* eslint-disable react/prop-types */
export default function ChatPanel({
  chatInput,
  setChatInput,
  chatMessages,
  isChatting,
  onSend,
  onApplyLatest,
  disabled,
}) {
  return (
    <div className="panel">
      <h3>AI Chat Refinement</h3>
      <div className="chat-box">
        {chatMessages.map((message, index) => (
          <div key={index} className={`chat-message ${message.role}`}>
            {message.content}
          </div>
        ))}
        {!chatMessages.length && <div className="chat-placeholder">Ask AI to refine your ROA.</div>}
        {isChatting && <div className="chat-placeholder">Processing...</div>}
      </div>

      <div className="row">
        <input
          className="input"
          value={chatInput}
          disabled={disabled}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSend()}
          placeholder="e.g. tighten suitability language"
        />
        <button className="button" disabled={disabled || !chatInput.trim() || isChatting} onClick={onSend}>
          Send
        </button>
      </div>
      <button className="button secondary" disabled={disabled || !chatMessages.length} onClick={onApplyLatest}>
        Apply Latest AI Response To ROA
      </button>
    </div>
  );
}
