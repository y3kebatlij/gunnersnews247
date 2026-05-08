import { useEffect, useState, useRef } from 'react';

interface CommentaryEvent {
  minute: number | null;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'kick_off' | 'half_time' | 'full_time' | 'info';
  text: string;
  timestamp: number;
}

interface LiveMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string; // 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SCHEDULED' etc
  minute?: number;
}

const EVENT_ICONS: Record<CommentaryEvent['type'], string> = {
  goal: '⚽',
  yellow_card: '🟨',
  red_card: '🟥',
  substitution: '🔄',
  kick_off: '🏁',
  half_time: '☕',
  full_time: '🏆',
  info: '📋',
};

const PROXY = 'https://arsenal-proxy.eyuelkt.workers.dev';
const ARSENAL_ID = 57; // football-data.org Arsenal team ID
const POLL_INTERVAL = 30_000; // 30 seconds

export default function LiveCommentary() {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [events, setEvents] = useState<CommentaryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevScoreRef = useRef<string>('');
  const feedRef = useRef<HTMLDivElement>(null);

  async function fetchLiveMatch() {
    try {
      const res = await fetch(`${PROXY}/live`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      // Adapt to whatever shape your proxy returns
      // Assuming proxy returns { match, events } or similar
      if (data.match) {
        const m: LiveMatch = {
          homeTeam: data.match.homeTeam?.shortName || data.match.homeTeam?.name || 'Home',
          awayTeam: data.match.awayTeam?.shortName || data.match.awayTeam?.name || 'Away',
          homeScore: data.match.score?.fullTime?.home ?? data.match.score?.halfTime?.home ?? 0,
          awayScore: data.match.score?.fullTime?.away ?? data.match.score?.halfTime?.away ?? 0,
          status: data.match.status,
          minute: data.match.minute,
        };

        // Detect score change → add goal event
        const scoreKey = `${m.homeScore}-${m.awayScore}`;
        if (prevScoreRef.current && prevScoreRef.current !== scoreKey) {
          const [prevH, prevA] = prevScoreRef.current.split('-').map(Number);
          const scoringTeam = m.homeScore > prevH ? m.homeTeam : m.awayTeam;
          const isArsenal = scoringTeam.toLowerCase().includes('arsenal');
          addEvent({
            minute: m.minute ?? null,
            type: 'goal',
            text: `${isArsenal ? '🔴 ARSENAL' : scoringTeam} GOAL! ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`,
            timestamp: Date.now(),
          });
        }
        prevScoreRef.current = scoreKey;
        setMatch(m);

        // Map API events if returned
        if (data.events?.length) {
          const mapped: CommentaryEvent[] = data.events.map((e: any) => ({
            minute: e.minute ?? null,
            type: mapEventType(e.type),
            text: buildEventText(e),
            timestamp: Date.now(),
          }));
          setEvents(mapped.reverse()); // newest first
        } else if (!events.length) {
          // Seed with status event if no events yet
          addEvent({
            minute: m.minute ?? null,
            type: mapStatusToEvent(m.status),
            text: buildStatusText(m),
            timestamp: Date.now(),
          });
        }
      } else {
        setMatch(null);
      }
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError('Could not load live data');
    } finally {
      setLoading(false);
    }
  }

  function addEvent(event: CommentaryEvent) {
    setEvents(prev => [event, ...prev].slice(0, 50)); // keep last 50
    // Scroll feed to top
    setTimeout(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  function mapEventType(type: string): CommentaryEvent['type'] {
    const t = type?.toLowerCase() ?? '';
    if (t.includes('goal')) return 'goal';
    if (t.includes('yellow')) return 'yellow_card';
    if (t.includes('red')) return 'red_card';
    if (t.includes('sub')) return 'substitution';
    return 'info';
  }

  function mapStatusToEvent(status: string): CommentaryEvent['type'] {
    if (status === 'IN_PLAY') return 'kick_off';
    if (status === 'PAUSED') return 'half_time';
    if (status === 'FINISHED') return 'full_time';
    return 'info';
  }

  function buildStatusText(m: LiveMatch): string {
    if (m.status === 'IN_PLAY') return `Match underway — ${m.homeTeam} vs ${m.awayTeam}`;
    if (m.status === 'PAUSED') return `Half time — ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`;
    if (m.status === 'FINISHED') return `Full time — ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`;
    return `${m.homeTeam} vs ${m.awayTeam}`;
  }

  function buildEventText(e: any): string {
    const min = e.minute ? `${e.minute}'` : '';
    const player = e.player?.name || e.playerName || '';
    const team = e.team?.shortName || e.team?.name || '';
    if (e.type?.toLowerCase().includes('goal')) return `${min} ⚽ GOAL! ${player} (${team})`;
    if (e.type?.toLowerCase().includes('yellow')) return `${min} 🟨 Yellow card — ${player} (${team})`;
    if (e.type?.toLowerCase().includes('red')) return `${min} 🟥 Red card — ${player} (${team})`;
    if (e.type?.toLowerCase().includes('sub')) return `${min} 🔄 Sub: ${player} (${team})`;
    return `${min} ${player} ${team}`.trim();
  }

  useEffect(() => {
    fetchLiveMatch();
    const interval = setInterval(fetchLiveMatch, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="live-commentary live-commentary--loading">
      <div className="live-pulse" />
      <span>Checking for live match…</span>
    </div>
  );

  if (!match) return null; // No live match — render nothing

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';

  return (
    <div className={`live-commentary ${isLive ? 'live-commentary--active' : ''}`}>
      {/* Header */}
      <div className="live-commentary__header">
        <div className="live-badge-row">
          {isLive && <span className="live-badge">● LIVE</span>}
          {match.minute && <span className="live-minute">{match.minute}'</span>}
        </div>
        <h3 className="live-commentary__title">Match Commentary</h3>
        {lastUpdated && (
          <span className="live-updated">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Scoreboard */}
      <div className="live-scoreboard">
        <span className={`live-team ${match.homeTeam.toLowerCase().includes('arsenal') ? 'live-team--arsenal' : ''}`}>
          {match.homeTeam}
        </span>
        <span className="live-score">
          {match.homeScore} — {match.awayScore}
        </span>
        <span className={`live-team ${match.awayTeam.toLowerCase().includes('arsenal') ? 'live-team--arsenal' : ''}`}>
          {match.awayTeam}
        </span>
      </div>

      {/* Event Feed */}
      {events.length > 0 && (
        <div className="live-feed" ref={feedRef}>
          {events.map((event, i) => (
            <div key={`${event.timestamp}-${i}`} className={`live-event live-event--${event.type}`}>
              <span className="live-event__icon">{EVENT_ICONS[event.type]}</span>
              <span className="live-event__text">{event.text}</span>
              {event.minute && (
                <span className="live-event__minute">{event.minute}'</span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="live-error">{error} — retrying…</p>}
    </div>
  );
}