import { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Send } from 'lucide-react';

export function ChatPanel() {
  const { chatMessages, myPlayerId, sendChat, roomState, socket } = useGameStore();
  const [input, setInput] = useState('');
  const [sendDisabled, setSendDisabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // 자동 스크롤 — 맨 아래에 있을 때만 (UI-SPEC 인터랙션 계약)
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !roomState?.roomId || sendDisabled) return;
    sendChat(roomState.roomId, trimmed);
    setInput('');
    setSendDisabled(true);
    setTimeout(() => setSendDisabled(false), 500); // 500ms 스팸 방지
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isConnected = socket?.connected ?? false;

  return (
    <div className="flex flex-col h-full border-t border-border">
      {/* 메시지 목록 */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            아직 메시지가 없습니다
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.playerId === myPlayerId;
            return (
              <div key={`${msg.timestamp}-${i}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-1.5 rounded-lg ${isMe ? 'bg-primary/10' : 'bg-card'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{msg.nickname}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력 필드 */}
      <div className="flex items-center gap-2 p-2 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value.slice(0, 200))}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? '메시지를 입력하세요' : '채팅을 사용할 수 없습니다'}
          disabled={!isConnected}
          className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          maxLength={200}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendDisabled || !isConnected}
          className="h-10 w-10 flex items-center justify-center rounded-md text-primary hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
