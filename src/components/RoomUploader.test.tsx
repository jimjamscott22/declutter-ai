import React, { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { RoomUploader } from './RoomUploader';
import { deferred, fakeStream } from '../test/media';

let getUserMedia: ReturnType<typeof vi.fn>;
beforeEach(() => {
  getUserMedia = vi.fn();
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
});

function mount() {
  return render(<StrictMode><RoomUploader onAnalyze={vi.fn()} isAnalyzing={false} analysisStep="" /></StrictMode>);
}
function start() { fireEvent.click(screen.getByRole('button', { name: /Snap Photo/ })); }
function expectStopped(media: ReturnType<typeof fakeStream>) {
  media.tracks.forEach(track => expect(track.stop).toHaveBeenCalled());
}

it.each(['cancel', 'unmount'] as const)('stops a stream that resolves after %s', async action => {
  const pending = deferred<MediaStream>();
  const media = fakeStream();
  getUserMedia.mockReturnValue(pending.promise);
  const view = mount();
  start();
  if (action === 'cancel') fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  else view.unmount();
  await act(async () => pending.resolve(media.stream));
  expectStopped(media);
  expect(view.container.querySelector('video')).toBeNull();
});

it('stops all tracks and detaches the video on unmount', async () => {
  const media = fakeStream();
  getUserMedia.mockResolvedValue(media.stream);
  const view = mount(); start();
  await waitFor(() => expect(view.container.querySelector('video')?.srcObject).toBe(media.stream));
  const video = view.container.querySelector('video')!;
  view.unmount();
  expectStopped(media);
  expect(video.srcObject).toBeNull();
});

it.each(['resolve', 'reject'] as const)('ignores an older permission %s after restarting', async outcome => {
  const older = deferred<MediaStream>();
  const stale = fakeStream(); const current = fakeStream();
  getUserMedia.mockReturnValueOnce(older.promise).mockResolvedValueOnce(current.stream);
  const view = mount(); start();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); start();
  await waitFor(() => expect(view.container.querySelector('video')?.srcObject).toBe(current.stream));
  vi.spyOn(console, 'error').mockImplementation(() => {});
  await act(async () => outcome === 'resolve' ? older.resolve(stale.stream) : older.reject(new Error('denied')));
  if (outcome === 'resolve') expectStopped(stale);
  expect(view.container.querySelector('video')?.srcObject).toBe(current.stream);
  current.tracks.forEach(track => expect(track.stop).not.toHaveBeenCalled());
  expect(screen.queryByText(/Unable to access camera/)).toBeNull();
});

it.each(['pending', 'active'] as const)('stops a %s camera when choosing a sample', async state => {
  const pending = deferred<MediaStream>(); const media = fakeStream();
  getUserMedia.mockReturnValue(pending.promise);
  const view = mount(); start();
  if (state === 'active') await act(async () => pending.resolve(media.stream));
  fireEvent.click(screen.getByText('Work Desk & Cable Tangle'));
  if (state === 'pending') await act(async () => pending.resolve(media.stream));
  expectStopped(media);
  expect(view.container.querySelector('video')).toBeNull();
});

it('allows retry after permission denial and stops tracks after capture', async () => {
  const media = fakeStream();
  getUserMedia.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(media.stream);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,cGhvdG8=');
  const view = mount(); start();
  await screen.findByText(/Unable to access camera/); start();
  await waitFor(() => expect(view.container.querySelector('video')?.srcObject).toBe(media.stream));
  fireEvent.click(screen.getByRole('button', { name: /Capture Snapshot/ }));
  expectStopped(media);
  expect(view.container.querySelector('video')).toBeNull();
});
