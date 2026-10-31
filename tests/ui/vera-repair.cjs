const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

// Run in the persistent Playwright session. No real identity, provider or email.
exports.run = async (page, context, outputDirectory) => {
  const base = 'http://127.0.0.1:3100', requests = [], results = [];
  let startFails = true, mode = 'ai', sequence = 0;
  await context.unroute('**/*');
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const reply = (data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
    if (url.pathname === '/api/auth/profile') return reply({ user: { id: 'synthetic-user', name: 'QA Client', email: 'qa@example.invalid', role: 'client' } });
    if (url.pathname === '/api/ai-analyst') {
      const body = request.postDataJSON(); requests.push(body);
      if (body.message === 'Hello') return startFails ? reply({ error: 'Synthetic startup outage' }, 503) : reply({ reply: 'Synthetic greeting', sessionId: 'synthetic-session', step: 1, mode: 'ready' });
      sequence++;
      return mode === 'unavailable' ? reply({ error: 'Synthetic outage' }, 503) : reply({ reply: `Synthetic ${mode} answer ${sequence}`, step: 2, sessionId: 'synthetic-session', mode });
    }
    if (url.pathname === '/api/content') return reply({ sections: {}, order: [] });
    return reply({});
  });
  await page.goto(base + '/login');
  await page.evaluate(() => localStorage.setItem('vancore_client_token', 'synthetic-token'));
  await page.goto(base + '/ai-analyst');
  await page.getByRole('alert').filter({ hasText: 'Vera could not start.' }).waitFor();
  startFails = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await page.getByText('Synthetic greeting', { exact: true }).waitFor();
  results.push({ check: 'Startup failure is visible and Retry starts the chat', status: 'PASS' });
  const send = async text => {
    await page.locator('#vera-chat-input').fill(text);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
  };
  await send('Synthetic first business problem');
  await page.getByText('Synthetic ai answer 1', { exact: true }).waitFor();
  await page.getByRole('status').filter({ hasText: 'AI connected' }).waitFor();
  await send('Synthetic follow-up');
  await page.getByText('Synthetic ai answer 2', { exact: true }).waitFor();
  const followup = requests.at(-1);
  assert.ok(followup.history.some(turn => turn.content === 'Synthetic first business problem'));
  assert.ok(followup.history.some(turn => turn.content === 'Synthetic ai answer 1'));
  results.push({ check: 'Follow-up sends earlier user and assistant context', status: 'PASS' });
  mode = 'limited'; await send('Synthetic fallback case');
  await page.getByText('Synthetic limited answer 3', { exact: true }).waitFor();
  await page.getByRole('status').filter({ hasText: 'Limited mode' }).waitFor();
  results.push({ check: 'Fallback is visibly identified as Limited mode', status: 'PASS' });
  mode = 'unavailable'; await send('Synthetic outage case');
  await page.getByRole('status').filter({ hasText: 'Temporarily unavailable' }).waitFor();
  await page.getByText('Sorry — Vera is unavailable right now. Please try again or contact hello@vancoresys.com.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Send', exact: true }).isEnabled(), false);
  await page.locator('#vera-chat-input').fill('Retryable draft');
  assert.equal(await page.getByRole('button', { name: 'Send', exact: true }).isEnabled(), true);
  results.push({ check: 'Outage leaves a usable message input', status: 'PASS' });
  await fs.mkdir(outputDirectory, { recursive: true });
  await page.screenshot({ path: path.join(outputDirectory, 'VANCORE-vera-outage-qa.png'), scale: 'css' });
  const report = { date: new Date().toISOString(), environment: 'localhost with intercepted synthetic APIs', realProviderRequests: 0, results };
  await fs.writeFile(path.join(outputDirectory, 'VANCORE-vera-ui-qa.json'), JSON.stringify(report, null, 2));
  return report;
};
