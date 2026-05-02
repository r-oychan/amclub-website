import { useEffect, useRef, useState } from 'react';
import {
  ConversationProvider,
  useConversation,
} from '@elevenlabs/react';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined;

type Message = {
  role: 'agent' | 'user';
  text: string;
  id: number;
};

function ChatbotPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {},
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Connection error');
    },
    onMessage: ({ source, message }: { source: 'ai' | 'user'; message: string }) => {
      messageIdRef.current += 1;
      setMessages((prev) => [
        ...prev,
        { role: source === 'ai' ? 'agent' : 'user', text: message, id: messageIdRef.current },
      ]);
    },
  });

  const status = conversation.status;
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (conversation.status === 'connected') {
        conversation.endSession();
      }
    };
  }, [conversation]);

  const handleStart = async () => {
    if (!AGENT_ID) {
      setError('Missing VITE_ELEVENLABS_AGENT_ID');
      return;
    }
    try {
      await conversation.startSession({ agentId: AGENT_ID, connectionType: 'webrtc' });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleEnd = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    conversation.sendUserMessage(text);
    messageIdRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text, id: messageIdRef.current },
    ]);
    setInput('');
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/5">
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected
                ? conversation.isSpeaking
                  ? 'bg-accent animate-pulse'
                  : 'bg-green-400'
                : 'bg-white/40'
            }`}
            aria-hidden
          />
          <h2 className="font-body text-sm font-bold">AM Club Assistant</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chatbot"
          className="text-white/80 hover:text-white text-lg leading-none cursor-pointer"
        >
          ×
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-neutral-50">
        {messages.length === 0 && (
          <p className="text-xs text-neutral-500 text-center py-6">
            {isConnected
              ? 'Connected. Speak or type to begin.'
              : 'Tap "Start" to talk with our assistant.'}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-primary text-white rounded-br-sm'
                : 'mr-auto bg-white text-neutral-800 border border-neutral-200 rounded-bl-sm'
            }`}
          >
            {m.text}
          </div>
        ))}
        {error && (
          <p className="text-xs text-accent text-center py-2">{error}</p>
        )}
      </div>

      <div className="border-t border-neutral-200 p-3 space-y-2 bg-white">
        {isConnected ? (
          <>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-full focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 text-sm font-bold rounded-full bg-primary text-white disabled:opacity-40 cursor-pointer"
              >
                Send
              </button>
            </div>
            <button
              onClick={handleEnd}
              className="w-full text-xs text-neutral-500 hover:text-accent cursor-pointer"
            >
              End conversation
            </button>
          </>
        ) : (
          <button
            onClick={handleStart}
            disabled={isConnecting}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-full bg-accent text-white hover:bg-accent/90 disabled:opacity-60 cursor-pointer"
          >
            {isConnecting ? 'Connecting…' : 'Start conversation'}
          </button>
        )}
      </div>
    </div>
  );
}

function FloatingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open chatbot"
      className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden
      >
        <path d="M12 3C6.48 3 2 6.91 2 11.7c0 2.36 1.13 4.5 2.95 6.06L4 22l4.5-2.05c1.07.31 2.22.48 3.5.48 5.52 0 10-3.91 10-8.73S17.52 3 12 3z" />
      </svg>
    </button>
  );
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  if (!AGENT_ID) {
    if (import.meta.env.DEV) {
      console.warn('[ChatbotWidget] VITE_ELEVENLABS_AGENT_ID is not set');
    }
    return null;
  }

  return (
    <ConversationProvider>
      {open ? <ChatbotPanel onClose={() => setOpen(false)} /> : <FloatingButton onOpen={() => setOpen(true)} />}
    </ConversationProvider>
  );
}
