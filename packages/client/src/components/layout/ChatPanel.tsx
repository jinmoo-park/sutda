import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  /** 모바일 오버레이 모드 — opacity fade 동작 적용 */
  mobile?: boolean;
}

export function ChatPanel({ mobile = false }: ChatPanelProps) {
  const { chatMessages, myPlayerId, sendChat, roomState, socket } = useGameStore();
  const [input, setInput] = useState('');
  const [sendDisabled, setSendDisabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // 모바일 오버레이 opacity 상태
  // idle: 0.05, event: 0.5(3초후 idle), focused: 0.8
  const [mobileOpacity, setMobileOpacity] = useState(0.05);
  const [isFocused, setIsFocused] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMsgCountRef = useRef(chatMessages.length);

  // 새 메시지 이벤트 감지 → opacity 0.5로 올리고 3초 후 fade
  const triggerMobileFade = useCallback(() => {
    if (!mobile || isFocused) return;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setMobileOpacity(0.5);
    fadeTimerRef.current = setTimeout(() => {
      if (!isFocused) setMobileOpacity(0.05);
    }, 3000);
  }, [mobile, isFocused]);

  useEffect(() => {
    if (chatMessages.length > prevMsgCountRef.current) {
      triggerMobileFade();
    }
    prevMsgCountRef.current = chatMessages.length;
  }, [chatMessages.length, triggerMobileFade]);

  // cleanup
  useEffect(() => () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current); }, []);

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

  const handleFocus = () => {
    if (!mobile) return;
    setIsFocused(true);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setMobileOpacity(0.8);
  };

  const handleBlur = () => {
    if (!mobile) return;
    setIsFocused(false);
    fadeTimerRef.current = setTimeout(() => setMobileOpacity(0.05), 1000);
  };

  const handleMobileClick = () => {
    if (!mobile) return;
    if (!isFocused) {
      handleFocus();
    }
  };

  if (mobile) {
    return (
      <div
        className="flex flex-col"
        style={{
          opacity: mobileOpacity,
          transition: 'opacity 0.6s ease-in-out',
          pointerEvents: isFocused ? 'auto' : 'none',
          background: 'rgba(0,0,0,0.7)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={handleMobileClick}
      >
        {/* 메시지 목록 (최근 3개만 표시) */}
        <div className="px-3 py-2 space-y-1 max-h-24 overflow-hidden">
          {chatMessages.slice(-3).map((msg, i) => {
            const isMe = msg.playerId === myPlayerId;
            return (
              <div key={`${msg.timestamp}-${i}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-white/90 truncate max-w-full">
                  <span className="font-bold">{msg.nickname}</span>: {msg.text}
                </span>
              </div>
            );
          })}
        </div>
        {/* 포커스 상태에서만 입력 가능 */}
        {isFocused && (
          <div className="flex items-center gap-1 px-2 pb-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="메시지 입력"
              disabled={!isConnected}
              autoFocus
              className="flex-1 h-8 px-2 rounded border border-white/20 bg-black/50 text-white text-xs placeholder:text-white/40 focus-visible:outline-none"
              style={{ fontSize: '16px' }}
              maxLength={200}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendDisabled || !isConnected}
              className="h-8 w-8 flex items-center justify-center rounded text-white/80 hover:text-white disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

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
          style={{ fontSize: '16px' }}
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
