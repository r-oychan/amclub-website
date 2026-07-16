import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ConversationProvider, useConversation } from '@elevenlabs/react';

interface ChatbotConfig {
  agentId: string | null;
  chatbotEnabled: boolean;
  voiceVisible: boolean;
  bubblePosition: 'bottom-right' | 'bottom-left';
  accentColor: string;
  panelTitle: string;
}

type Message = {
  role: 'agent' | 'user';
  text: string;
  id: number;
};

type Mode = 'text' | 'voice';

// Matches, in order: markdown links [label](target), bare http(s) URLs
// (trimmed so trailing sentence punctuation stays outside the link), and
// email addresses. Agent replies cite knowledge-base sources as links —
// render all three as tappable anchors instead of plain text.
const LINKIFY_PATTERN =
  /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"])|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function MessageLink({ href, label, onUser }: { href: string; label: string; onUser: boolean }) {
  const isMailto = href.startsWith('mailto:');
  const external = !isMailto && !href.startsWith('/');
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={`underline underline-offset-2 break-all hover:no-underline ${
        onUser ? 'text-white' : 'text-accent'
      }`}
    >
      {label}
    </a>
  );
}

function linkifyMessage(text: string, onUser: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  LINKIFY_PATTERN.lastIndex = 0;
  for (let m = LINKIFY_PATTERN.exec(text); m; m = LINKIFY_PATTERN.exec(text)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      const target = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(m[2]) ? `mailto:${m[2]}` : m[2];
      nodes.push(<MessageLink key={key++} href={target} label={m[1]} onUser={onUser} />);
    } else if (m[3]) {
      nodes.push(<MessageLink key={key++} href={m[3]} label={m[3]} onUser={onUser} />);
    } else if (m[4]) {
      nodes.push(<MessageLink key={key++} href={`mailto:${m[4]}`} label={m[4]} onUser={onUser} />);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Agent-message footnote citations ──────────────────────────────────
// Agent replies cite sources ("More details: <url>" lines and inline URLs).
// Instead of printing raw URLs we lift them out as numbered footnotes: a
// superscript marker in the text plus a source chip under the bubble.
// Internal links (this site or amclub.org.sg) open in the page BEHIND the
// chat panel — the widget lives outside <Routes>, so it stays open.

interface ChatSource { href: string; label: string }

const SOURCE_LINE_RE =
  /^\s*(?:>\s*)?(?:more details?|more info(?:rmation)?|sources?|read more|learn more|details)\s*[:\-–—]\s*(\S.*)$/i;
const BARE_URL_RE = /https?:\/\/[^\s<>()]*[^\s<>().,;:!?'"]/;
// KB Source lines are titled markdown links: "More details: [The 2nd Floor](https://…)".
const SOURCE_MD_LINK_RE = /\[([^\]]+)\]\(\s*(https?:\/\/[^\s)]+|\/[^\s)]*)\s*\)/;

function toInternalPath(href: string): string | null {
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  try {
    const u = new URL(href);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (u.hostname === window.location.hostname || u.hostname === 'amclub.org.sg' || u.hostname.endsWith('.amclub.org.sg')) {
      return u.pathname + u.search + u.hash;
    }
  } catch { /* not a URL */ }
  return null;
}

function sourceChipLabel(href: string): string {
  // Fallback when the agent cited a bare URL: humanize the last path segment
  // ("/dining/the-2nd-floor" → "The 2nd Floor"). Titled citations from the KB
  // override this via refNumber's label argument.
  const internal = toInternalPath(href);
  if (internal) {
    const seg = internal.split(/[?#]/)[0].split('/').filter(Boolean).pop();
    if (!seg) return 'Home';
    return seg
      .split('-')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  }
  // Uploaded documents (blob storage / /uploads/ paths): label with the
  // humanized filename, not the storage hostname.
  try {
    const u = new URL(href, window.location.origin);
    const fileMatch = u.pathname.match(/\/([^/]+)\.(pdf|docx?|xlsx?|pptx?)$/i);
    if (fileMatch) {
      const base = fileMatch[1].replace(/[_-][0-9a-f]{8,}$/i, '');
      const words = base
        .split(/[_-]+/)
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
      return `${words} (${fileMatch[2].toUpperCase()})`;
    }
    return u.hostname;
  } catch { return href; }
}

function ArrowOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
         strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

function AgentMessage({ text, onOpen }: { text: string; onOpen: (href: string) => void }) {
  const sources: ChatSource[] = [];
  const refNumber = (href: string, label?: string): number => {
    let idx = sources.findIndex((s) => s.href === href);
    if (idx === -1) {
      sources.push({ href, label: label ?? sourceChipLabel(href) });
      idx = sources.length - 1;
    } else if (label && sources[idx].label === sourceChipLabel(href)) {
      // Upgrade an auto-derived label with the real page title once we see one.
      sources[idx] = { ...sources[idx], label };
    }
    return idx + 1;
  };

  // 1. Lift dedicated source lines ("More details: <url>") out of the body.
  const kept: string[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(SOURCE_LINE_RE);
    if (m) {
      const md = m[1].match(SOURCE_MD_LINK_RE);
      if (md) { refNumber(md[2], md[1]); continue; }
      const url = m[1].match(BARE_URL_RE);
      if (url) { refNumber(url[0]); continue; }
    }
    kept.push(line);
  }
  const body = kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // 2. Tokenize the remaining text: emails stay inline; markdown links and
  //    bare URLs become footnotes with a superscript marker.
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const sup = (href: string, label?: string) => {
    // "…on our page: ¹" reads badly — drop a trailing colon before the marker.
    const prev = nodes[nodes.length - 1];
    if (typeof prev === 'string') nodes[nodes.length - 1] = prev.replace(/[\s:]+$/, '');
    nodes.push(
      <sup key={key++}>
        <button onClick={() => onOpen(href)} aria-label={`Open source ${refNumber(href, label)}`}
                className="text-accent font-bold cursor-pointer hover:underline px-0.5">
          {refNumber(href, label)}
        </button>
      </sup>,
    );
  };
  LINKIFY_PATTERN.lastIndex = 0;
  for (let m = LINKIFY_PATTERN.exec(body); m; m = LINKIFY_PATTERN.exec(body)) {
    if (m.index > last) nodes.push(body.slice(last, m.index));
    const [, mdLabel, mdTarget, bareUrl, email] = m;
    if (mdLabel && mdTarget) {
      if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(mdTarget) || mdTarget.startsWith('mailto:')) {
        const addr = mdTarget.replace(/^mailto:/, '');
        nodes.push(<MessageLink key={key++} href={`mailto:${addr}`} label={mdLabel} onUser={false} />);
      } else {
        nodes.push(
          <button key={key++} onClick={() => onOpen(mdTarget)}
                  className="text-accent underline underline-offset-2 hover:no-underline cursor-pointer text-left">
            {mdLabel}
          </button>,
        );
        sup(mdTarget, mdLabel);
      }
    } else if (bareUrl) {
      sup(bareUrl);
    } else if (email) {
      nodes.push(<MessageLink key={key++} href={`mailto:${email}`} label={email} onUser={false} />);
    }
    last = m.index + m[0].length;
  }
  if (last < body.length) nodes.push(body.slice(last));

  return (
    <>
      <span>{nodes}</span>
      {sources.length > 0 && (
        <span className="mt-2 pt-2 border-t border-neutral-200 flex flex-col gap-1">
          {sources.map((s, i) => (
            <button key={s.href} onClick={() => onOpen(s.href)}
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline cursor-pointer text-left max-w-full">
              <span className="shrink-0 w-4 h-4 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="truncate">{s.label}</span>
              <ArrowOutIcon />
            </button>
          ))}
        </span>
      )}
    </>
  );
}

// ── Waiting indicator + typewriter reveal ─────────────────────────────
// The ElevenLabs SDK delivers each agent reply as one complete message, so
// "streaming" is simulated: a three-dot bubble while waiting, then a
// word-by-word reveal. Markdown links, URLs and whole source lines are
// atomic reveal units so raw `[label](url)` syntax never flashes mid-type.

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" role="status" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

function revealOffsets(text: string): number[] {
  const offsets: number[] = [];
  let pos = 0;
  for (const line of text.split('\n')) {
    if (SOURCE_LINE_RE.test(line)) {
      // A source line converts to a footnote chip — reveal it in one go so
      // "More details:" never appears as half-typed text.
      pos += line.length + 1;
      offsets.push(Math.min(pos, text.length));
      continue;
    }
    const token = /\[[^\]]*\]\([^)\s]*\)|https?:\/\/\S+|\S+/g;
    for (let m = token.exec(line); m; m = token.exec(line)) {
      offsets.push(pos + m.index + m[0].length);
    }
    pos += line.length + 1;
  }
  return offsets.length > 0 ? offsets : [text.length];
}

const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function AnimatedAgentMessage({
  text,
  onOpen,
  onGrow,
}: {
  text: string;
  onOpen: (href: string) => void;
  onGrow: () => void;
}) {
  const offsets = useMemo(() => revealOffsets(text), [text]);
  const [step, setStep] = useState(PREFERS_REDUCED_MOTION ? offsets.length : 0);
  const done = step >= offsets.length;

  useEffect(() => {
    if (done) return;
    // Scale the per-tick stride so even long replies finish in ~2.5s.
    const stride = Math.max(1, Math.ceil(offsets.length / 70));
    const timer = setInterval(() => {
      setStep((s) => Math.min(s + stride, offsets.length));
      onGrow();
    }, 35);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, offsets.length]);

  const visible = done ? text : text.slice(0, step > 0 ? offsets[step - 1] : 0);
  return <AgentMessage text={visible} onOpen={onOpen} />;
}

function ChatbotPanel({
  cfg,
  positionClasses,
  onClose,
}: {
  cfg: ChatbotConfig;
  positionClasses: { panel: string };
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('text');
  const [awaitingReply, setAwaitingReply] = useState(false);
  const messageIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // Citation chips: internal pages open BEHIND the chat panel (SPA navigation
  // keeps the widget mounted and open); external links open a new tab.
  const openSource = (href: string) => {
    if (href.startsWith('mailto:')) {
      window.location.href = href;
      return;
    }
    const internal = toInternalPath(href);
    if (internal) navigate(internal);
    else window.open(href, '_blank', 'noopener,noreferrer');
  };

  const conversation = useConversation({
    textOnly: mode === 'text',
    onConnect: () => setError(null),
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ChatbotWidget]', err);
      setError(msg || 'Connection error');
      setAwaitingReply(false);
    },
    onDisconnect: () => setAwaitingReply(false),
    onMessage: ({ source, message }: { source: 'ai' | 'user'; message: string }) => {
      messageIdRef.current += 1;
      if (source === 'ai') setAwaitingReply(false);
      setMessages((prev) => [
        ...prev,
        { role: source === 'ai' ? 'agent' : 'user', text: message, id: messageIdRef.current },
      ]);
    },
  });

  const status = conversation.status;
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const isVoice = mode === 'voice';

  useEffect(() => {
    scrollToBottom();
  }, [messages, awaitingReply]);

  // Cleanup ref so the unmount effect doesn't tear down sessions on every re-render.
  const conversationRef = useRef(conversation);
  useEffect(() => {
    conversationRef.current = conversation;
  });
  useEffect(() => {
    return () => {
      if (conversationRef.current.status === 'connected') {
        conversationRef.current.endSession();
      }
    };
  }, []);

  const startSession = async (nextMode: Mode) => {
    if (!cfg.agentId) {
      setError('Missing agent ID in chatbot config');
      return;
    }
    setMode(nextMode);
    // Defer to next tick so useConversation picks up the new textOnly value.
    setTimeout(async () => {
      try {
        await conversationRef.current.startSession({
          agentId: cfg.agentId as string,
          dynamicVariables: getSingaporeContext(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    }, 0);
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
    setMessages((prev) => [...prev, { role: 'user', text, id: messageIdRef.current }]);
    setInput('');
    setAwaitingReply(true);
  };

  const handleToggleMute = () => {
    conversation.setMuted(!conversation.isMuted);
  };

  const accent = cfg.accentColor;

  return (
    <div
      className={`fixed z-50 bg-white shadow-2xl flex flex-col overflow-hidden border border-black/5
        inset-x-0 bottom-0 w-full h-[min(85dvh,640px)] rounded-t-2xl
        md:inset-x-auto ${positionClasses.panel} md:bottom-24 md:w-[380px] md:h-[560px] md:max-h-[calc(100vh-8rem)] md:rounded-2xl`}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-white">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-white/40'
            }`}
            aria-hidden
          />
          <h2 className="font-body text-sm font-bold">{cfg.panelTitle}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chatbot"
          className="text-white/80 hover:text-white text-lg leading-none cursor-pointer"
        >
          ×
        </button>
      </div>

      {isConnected && isVoice && (
        <VoiceOrb
          isSpeaking={conversation.isSpeaking}
          isMuted={conversation.isMuted}
          onToggleMute={handleToggleMute}
          accent={accent}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-neutral-50">
        {messages.length === 0 && (
          <p className="text-xs text-neutral-500 text-center py-6">
            {isConnected
              ? isVoice
                ? 'Speak naturally — or type below.'
                : 'Type a message to begin.'
              : cfg.voiceVisible
                ? 'How would you like to chat?'
                : 'Tap "Start chat" to begin.'}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={m.role === 'user' ? { backgroundColor: accent } : undefined}
            className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
              m.role === 'user'
                ? 'ml-auto text-white rounded-br-sm'
                : 'mr-auto bg-white text-neutral-800 border border-neutral-200 rounded-bl-sm'
            }`}
          >
            {m.role === 'user'
              ? linkifyMessage(m.text, true)
              : <AnimatedAgentMessage text={m.text} onOpen={openSource} onGrow={scrollToBottom} />}
          </div>
        ))}
        {awaitingReply && (
          <div className="max-w-[85%] px-3 py-2 rounded-2xl mr-auto bg-white border border-neutral-200 rounded-bl-sm">
            <TypingDots />
          </div>
        )}
        {error && <p className="text-xs text-accent text-center py-2">{error}</p>}
      </div>

      <div className="border-t border-neutral-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3 space-y-2 bg-white">
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
                className="flex-1 min-w-0 text-base md:text-sm px-3 py-2 border border-neutral-300 rounded-full focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 text-sm font-bold rounded-full bg-primary text-white disabled:opacity-40 cursor-pointer"
              >
                Send
              </button>
            </div>
            <button onClick={handleEnd} className="w-full text-xs text-neutral-500 hover:text-accent cursor-pointer">
              End {isVoice ? 'voice chat' : 'chat'}
            </button>
          </>
        ) : cfg.voiceVisible ? (
          <div className="flex gap-2">
            <button
              onClick={() => startSession('text')}
              disabled={isConnecting}
              style={{ backgroundColor: accent }}
              className="flex-1 px-4 py-2.5 text-sm font-bold rounded-full text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {isConnecting ? 'Connecting…' : 'Start chat'}
            </button>
            <button
              onClick={() => startSession('voice')}
              disabled={isConnecting}
              className="px-4 py-2.5 text-sm font-bold rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-60 cursor-pointer flex items-center gap-2"
              aria-label="Start voice chat"
            >
              <MicIcon className="w-4 h-4" />
              <span>Voice</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => startSession('text')}
            disabled={isConnecting}
            style={{ backgroundColor: accent }}
            className="w-full px-4 py-2.5 text-sm font-bold rounded-full text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            {isConnecting ? 'Connecting…' : 'Start chat'}
          </button>
        )}
      </div>
    </div>
  );
}

function getSingaporeContext(): Record<string, string> {
  const now = new Date();
  const tz = 'Asia/Singapore';
  const dateTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(now);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(now);
  return {
    current_datetime: dateTime,
    current_date: date,
    current_time: time,
    current_day_of_week: dayOfWeek,
    current_timezone: 'Asia/Singapore (UTC+8)',
  };
}

function VoiceOrb({
  isSpeaking,
  isMuted,
  onToggleMute,
  accent,
}: {
  isSpeaking: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-3 bg-gradient-to-b from-primary to-primary-dark text-white">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <span
          style={{ backgroundColor: accent, opacity: 0.3 }}
          className={`absolute inset-0 rounded-full ${isSpeaking ? 'animate-ping' : ''}`}
          aria-hidden
        />
        <span
          style={{ backgroundColor: accent, opacity: 0.5 }}
          className={`absolute inset-2 rounded-full ${isSpeaking ? 'animate-pulse' : ''}`}
          aria-hidden
        />
        <span
          style={{ backgroundColor: accent }}
          className={`relative w-16 h-16 rounded-full shadow-lg transition-transform ${isSpeaking ? 'scale-110' : 'scale-100'}`}
          aria-hidden
        />
      </div>
      <p className="text-xs font-body uppercase tracking-wider opacity-80">
        {isMuted ? 'Muted' : isSpeaking ? 'Speaking…' : 'Listening…'}
      </p>
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        style={isMuted ? { backgroundColor: accent } : undefined}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
          isMuted ? 'text-white hover:opacity-90' : 'bg-white/15 text-white hover:bg-white/25'
        }`}
      >
        <MicIcon muted={isMuted} className="w-5 h-5" />
      </button>
    </div>
  );
}

function MicIcon({ muted, className }: { muted?: boolean; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11z" />
      {muted && <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />}
    </svg>
  );
}

function FloatingButton({
  cfg,
  positionClasses,
  onOpen,
}: {
  cfg: ChatbotConfig;
  positionClasses: { button: string };
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open chatbot"
      style={{ backgroundColor: cfg.accentColor }}
      className={`fixed ${positionClasses.button} bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-14 h-14 rounded-full text-white shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer flex items-center justify-center`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden>
        <path d="M12 3C6.48 3 2 6.91 2 11.7c0 2.36 1.13 4.5 2.95 6.06L4 22l4.5-2.05c1.07.31 2.22.48 3.5.48 5.52 0 10-3.91 10-8.73S17.52 3 12 3z" />
      </svg>
    </button>
  );
}

function useChatbotConfig(): ChatbotConfig | null {
  const [cfg, setCfg] = useState<ChatbotConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.VITE_STRAPI_URL || '';
    fetch(`${base}/api/elevenlabs-chatbot/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Partial<ChatbotConfig> | null) => {
        if (cancelled || !data) return;
        setCfg({
          agentId: data.agentId ?? null,
          chatbotEnabled: data.chatbotEnabled ?? true,
          voiceVisible: data.voiceVisible ?? true,
          bubblePosition: data.bubblePosition ?? 'bottom-right',
          accentColor: data.accentColor ?? '#E52B50',
          panelTitle: data.panelTitle ?? 'Assistant',
        });
      })
      .catch(() => {
        if (!cancelled) setCfg(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return cfg;
}

export function ChatbotWidget() {
  const cfg = useChatbotConfig();
  const [open, setOpen] = useState(false);

  if (!cfg) return null; // still loading, or fetch failed
  if (!cfg.chatbotEnabled || !cfg.agentId) return null;

  const positionClasses =
    cfg.bubblePosition === 'bottom-left'
      ? { button: 'left-4', panel: 'md:left-4' }
      : { button: 'right-4', panel: 'md:right-4' };

  return (
    <ConversationProvider>
      {open ? (
        <ChatbotPanel cfg={cfg} positionClasses={positionClasses} onClose={() => setOpen(false)} />
      ) : (
        <FloatingButton cfg={cfg} positionClasses={positionClasses} onOpen={() => setOpen(true)} />
      )}
    </ConversationProvider>
  );
}
