import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { DEMO_ANALYSIS_PRESETS } from './data/sampleRooms';

const input = vi.hoisted(() => ({ mimeType: 'image/png' }));
// Inject prepared photo bytes at the uploader boundary; exercise real App/chat.
vi.mock('./components/RoomUploader', () => ({
  RoomUploader: ({ onAnalyze }: { onAnalyze: (payload: unknown) => void }) =>
    <button onClick={() => onAnalyze({ imageBase64: 'cGhvdG8=', mimeType: input.mimeType,
      imageUrl: 'data:image/png;base64,cGhvdG8=', roomType: 'Office', priority: 'Balanced',
      goal: 'Clear desk', presetKey: 'home-office-desk' })}>Prepared photo</button>,
}));

beforeEach(() => {
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

const scenarios = ['success', 'http fallback', 'network fallback'] as const;
const cases = scenarios.flatMap(mode => ['image/png', 'image/webp', 'image/jpeg'].map(mime => ({ mode, mime })));
it.each(cases)('sends $mime to chat after $mode', async ({ mode, mime }) => {
  input.mimeType = mime;
  let chatBody: Record<string, unknown> | undefined;
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    if (url === '/api/analyze-room') {
      if (mode === 'network fallback') throw new Error('offline');
      return { ok: mode === 'success', json: async () => mode === 'success'
        ? { result: DEMO_ANALYSIS_PRESETS['home-office-desk'] } : { error: 'unavailable' } };
    }
    chatBody = JSON.parse(options.body as string);
    return { ok: true, json: async () => ({ reply: 'Start with the desk.' }) };
  }));
  render(<App />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Prepared photo' })));
  // Restore native timers for waitFor; remove analysis timers leaked by the
  // existing network-error path, which is outside this session's scope.
  vi.clearAllTimers(); vi.useRealTimers();
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Prepared photo' })).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Declutter AI Chatbot' }));
  const textbox = screen.getByRole('textbox');
  fireEvent.change(textbox, { target: { value: 'Where should I start?' } });
  fireEvent.keyDown(textbox, { key: 'Enter' });
  await screen.findByText('Start with the desk.');
  expect(chatBody?.imageBase64).toBe('cGhvdG8=');
  expect(chatBody?.mimeType).toBe(mime);
  fireEvent.click(screen.getByRole('button', { name: 'Scan New Room' }));
  fireEvent.change(textbox, { target: { value: 'Help with another room' } });
  fireEvent.keyDown(textbox, { key: 'Enter' });
  await waitFor(() => expect(chatBody?.imageBase64).toBeNull());
  expect(chatBody).not.toHaveProperty('mimeType');
});
