import React, { useEffect, useRef, useState } from 'react';
import { mockRabbitMQ } from './eventz-runtime';

const HISTORY_LENGTH = 6;
const SAMPLE_INTERVAL_MS = 10000;

const computeDelta = (previousSnapshot, nextSnapshot) => {
  const previousQueues = previousSnapshot.queues || {};
  const nextQueues = nextSnapshot.queues || {};
  const queueKeys = Array.from(new Set([
    ...Object.keys(previousQueues),
    ...Object.keys(nextQueues)
  ]));

  const queues = queueKeys.reduce((acc, key) => {
    const prevStats = previousQueues[key] || { published: 0, consumed: 0 };
    const nextStats = nextQueues[key] || { published: 0, consumed: 0 };
    acc[key] = {
      published: nextStats.published - prevStats.published,
      consumed: nextStats.consumed - prevStats.consumed
    };
    return acc;
  }, {});

  const prevLastEventId = previousSnapshot.lastEventId || 0;
  const newEvents = (nextSnapshot.events || []).filter(evt => evt.id > prevLastEventId);
  const eventsByQueue = newEvents.reduce((acc, evt) => {
    if (!acc[evt.queueKey]) {
      acc[evt.queueKey] = [];
    }
    acc[evt.queueKey].push(evt);
    return acc;
  }, {});

  return {
    published: nextSnapshot.published - previousSnapshot.published,
    consumed: nextSnapshot.consumed - previousSnapshot.consumed,
    queues,
    events: newEvents,
    eventsByQueue
  };
};

export default function RabbitMQActivityPanel() {
  const [showPanel, setShowPanel] = useState(false);
  const [history, setHistory] = useState([]);
  const latestSnapshotRef = useRef(mockRabbitMQ.getTelemetrySnapshot());

  useEffect(() => {
    const sampleTelemetry = () => {
      const nextSnapshot = mockRabbitMQ.getTelemetrySnapshot();
      const previousSnapshot = latestSnapshotRef.current;
      const delta = computeDelta(previousSnapshot, nextSnapshot);

      latestSnapshotRef.current = nextSnapshot;
      setHistory(prev => {
        const nextHistory = [...prev, { timestamp: Date.now(), totals: nextSnapshot, delta }];
        return nextHistory.slice(-HISTORY_LENGTH);
      });
    };

    sampleTelemetry();
    const intervalId = setInterval(sampleTelemetry, SAMPLE_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const latest = history.length > 0 ? history[history.length - 1].totals : latestSnapshotRef.current;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 text-sm text-purple-100">
      <button
        onClick={() => setShowPanel(prev => !prev)}
        className="w-full px-4 py-2 mb-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors"
      >
        {showPanel ? 'Hide RabbitMQ Activity' : 'Show RabbitMQ Activity'}
      </button>
      {showPanel && (
        <div className="bg-slate-900/95 border border-indigo-500/40 rounded-lg p-4 max-h-[70vh] overflow-y-auto shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-3">RabbitMQ Activity</h2>
          <div className="flex flex-wrap gap-4 text-purple-200 mb-4">
              <div>Outgoing (published): <span className="font-semibold text-white">{latest?.published ?? 0}</span></div>
              <div>Incoming (consumed): <span className="font-semibold text-white">{latest?.consumed ?? 0}</span></div>
            <div>Queues Observed: <span className="font-semibold text-white">{Object.keys(latest?.queues || {}).length}</span></div>
          </div>
          {history.length === 0 ? (
            <p className="text-purple-300">No RabbitMQ activity yet.</p>
          ) : (
            history.slice().reverse().map(entry => (
              <div key={entry.timestamp} className="mb-3 bg-white/5 border border-white/10 rounded p-3">
                <div className="flex justify-between text-xs text-purple-200 mb-2">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span>
                    Δ Outgoing: <span className="text-white">{entry.delta.published}</span>
                    {' | '}
                    Δ Incoming: <span className="text-white">{entry.delta.consumed}</span>
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(entry.delta.queues || {}).map(([queueKey, stats]) => (
                    <div key={queueKey} className="text-xs text-white/80">
                      <div className="font-semibold text-white">{queueKey}</div>
                        <div>Outgoing: {stats.published}</div>
                        <div>Incoming: {stats.consumed}</div>
                    </div>
                  ))}
                </div>
                {entry.delta.events && entry.delta.events.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {Object.entries(entry.delta.eventsByQueue || {}).map(([queueKey, events]) => {
                      const outgoingEvents = events.filter(evt => evt.direction === 'published');
                      const incomingEvents = events.filter(evt => evt.direction === 'consumed');
                      return (
                        <div key={queueKey} className="text-xs text-white/80">
                          <div className="font-semibold text-white">{queueKey}</div>
                          {outgoingEvents.length > 0 && (
                            <div className="ml-4">
                              <div className="text-white/60 uppercase tracking-wide text-[0.6rem]">Outgoing</div>
                              <ul className="ml-2 list-disc list-inside space-y-1">
                                {outgoingEvents.map(evt => (
                                  <li key={`out-${evt.id}`} className="flex items-center gap-2">
                                    <span>⬆</span>
                                    <span>{evt.eventType}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {incomingEvents.length > 0 && (
                            <div className="ml-4 mt-1">
                              <div className="text-white/60 uppercase tracking-wide text-[0.6rem]">Incoming</div>
                              <ul className="ml-2 list-disc list-inside space-y-1">
                                {incomingEvents.map(evt => (
                                  <li key={`in-${evt.id}`} className="flex items-center gap-2">
                                    <span>⬇</span>
                                    <span>{evt.eventType}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
