'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const RECOVERY_PATH = '/auth/reset-password';
const PROVIDER_ORIGIN = 'https://wqvhivuyvzdbuguuojhk.supabase.co';

function installAuthRecovery(app, config) {
  if (config.url !== PROVIDER_ORIGIN || typeof config.publishableKey !== 'string' || !config.publishableKey.startsWith('sb_publishable_')) throw Error('Invalid public recovery configuration');
  const template = fs.readFileSync(path.join(__dirname, 'auth-recovery.html'), 'utf8');
  app.get(RECOVERY_PATH, (_req, res) => {
    const nonce = crypto.randomBytes(24).toString('base64');
    const publicConfig = JSON.stringify({ url: config.url, key: config.publishableKey }).replace(/</g, '\\u003c');
    res.set({
      'Cache-Control': 'no-store, private',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src ${PROVIDER_ORIGIN}; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
    });
    res.type('html').send(template.replaceAll('__NONCE__', nonce).replace('__PUBLIC_CONFIG__', publicConfig));
  });
}
module.exports = { installAuthRecovery, RECOVERY_PATH };
