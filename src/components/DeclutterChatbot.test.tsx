import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { DeclutterChatbot } from './DeclutterChatbot';

beforeEach(() => {
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
});

it.each(['image/png', 'image/webp', 'image/jpeg', null])('sends matching image metadata for %s', async mime => {
  let body: Record<string, unknown> | undefined;
  vi.stubGlobal('fetch', vi.fn(async (_url: string, options: RequestInit) => {
    body = JSON.parse(options.body as string);
    return { ok: true, json: async () => ({ reply: 'Done.' }) };
  }));
  const props = { isOpen: true, onClose: vi.fn(), roomContext: null,
    imageBase64: mime ? 'cGhvdG8=' : null, imageMimeType: mime };
  render(<DeclutterChatbot {...props} />);
  const textbox = screen.getByRole('textbox');
  fireEvent.change(textbox, { target: { value: 'Help me organize' } });
  fireEvent.keyDown(textbox, { key: 'Enter' });
  await screen.findByText('Done.');
  expect(body?.imageBase64).toBe(mime ? 'cGhvdG8=' : null);
  if (mime) expect(body?.mimeType).toBe(mime);
  else expect(body).not.toHaveProperty('mimeType');
});
