'use client';

import React from 'react';
import { Asset, HistoryEntry } from '@/models';

interface TimelineProps {
  history: HistoryEntry[];
}

export default function Timeline({ history }: TimelineProps) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((event, eventIdx) => (
          <li key={eventIdx}>
            <div className="relative pb-8">
              {eventIdx !== history.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`
                    h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                    ${getEventColor(event.action)}
                  `}>
                    {getEventIcon(event.action)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-900">{getActionLabel(event.action)}</span>
                      {' '}por {event.actor}
                    </p>
                    {event.details && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDetails(event.details)}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap text-gray-500">
                    {formatDate(event.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getEventColor(action: string): string {
  const colors = {
    CREATED: 'bg-green-500 text-white',
    UPDATED: 'bg-blue-500 text-white',
    TRANSFERRED: 'bg-purple-500 text-white',
    CERTIFIED: 'bg-yellow-500 text-white',
    default: 'bg-gray-500 text-white',
  };
  
  return colors[action as keyof typeof colors] || colors.default;
}

function getEventIcon(action: string): React.ReactNode {
  const iconSize = 'h-4 w-4';
  
  switch (action) {
    case 'CREATED':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    case 'UPDATED':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'TRANSFERRED':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'CERTIFIED':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getActionLabel(action: string): string {
  const labels = {
    CREATED: 'Creado',
    UPDATED: 'Actualizado',
    TRANSFERRED: 'Transferido',
    CERTIFIED: 'Certificado',
    default: 'Acción',
  };
  
  return labels[action as keyof typeof labels] || labels.default;
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('es-ES', {
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDetails(details: any): string {
  if (typeof details === 'object') {
    try {
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch (e) {
      return JSON.stringify(details);
    }
  }
  return details.toString();
}
