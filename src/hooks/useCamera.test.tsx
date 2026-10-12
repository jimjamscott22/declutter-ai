import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useCamera } from './useCamera';
import { deferred, fakeStream } from '../test/media';

it('stops an active stream before starting another camera request', async () => {
  const first = fakeStream(); const second = fakeStream();
  const pending = deferred<MediaStream>();
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia: vi.fn().mockResolvedValueOnce(first.stream).mockReturnValueOnce(pending.promise),
  } });
  const { result, unmount } = renderHook(useCamera);
  await act(async () => result.current.startCamera());
  act(() => { void result.current.startCamera(); });
  first.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
  await act(async () => pending.resolve(second.stream));
  unmount();
  second.tracks.forEach(track => expect(track.stop).toHaveBeenCalledOnce());
});
