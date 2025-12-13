/* Email Utility Tests (mocking Nodemailer) */

import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import path from 'path';

function print(title, ok, details = '') {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${title}${details ? ' - ' + details : ''}`);
}

// Preserve original env
const ORIGINAL_ENV = { ...process.env };

// Simple helper to reset env between tests
function resetEnv() {
  for (const k of Object.keys(process.env)) {
    delete process.env[k];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

// Load email util after we adjust nodemailer/createTransport mock
async function loadEmailUtil() {
  const utilPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/utils/email.js');
  return await import(pathToFileUrl(utilPath).href);
}

// But since pathToFileUrl isn't imported, provide a small helper
import { pathToFileURL as pathToFileUrl } from 'url';

async function test_missing_credentials_skips() {
  resetEnv();
  // Import module first (dotenv may populate EMAIL_* from .env)
  const emailUtil = await import('../src/utils/email.js');
  const { sendEmail } = emailUtil;
  // Now clear credentials so sendEmail path detects missing config at call time
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;

  const res = await sendEmail('someone@example.com', 'Subject', '<b>Hi</b>');
  const ok = res && res.success === false && (/Missing Gmail credentials/i.test(res.error || '') || /missing config/i.test(res.fallbackMessage || ''));
  print('Missing credentials -> skip send', ok);
  return ok;
}

async function test_successful_send_logs() {
  resetEnv();
  process.env.EMAIL_USER = 'testsender@gmail.com';
  process.env.EMAIL_PASS = 'x-app-pass';

  let verifyCalled = false;
  let sendMailCalled = false;
  let sentTo = '';

  // Mock transporter
  const mockTransporter = {
    verify: async () => { verifyCalled = true; return true; },
    sendMail: async (opts) => { sendMailCalled = true; sentTo = opts.to; return { messageId: 'mock-id-123' }; }
  };

  // Monkey-patch nodemailer.createTransport
  const originalCreate = nodemailer.createTransport;
  nodemailer.createTransport = () => mockTransporter;

  try {
    // Load fresh module after patch (uses singleton, but function is read at call time)
    const emailUtil = await import('../src/utils/email.js');
    const { sendEmail } = emailUtil;

    const res = await sendEmail('recipient@example.com', 'Test Subject', '<p>Body</p>');
    const ok = res && res.success === true && verifyCalled && sendMailCalled && sentTo === 'recipient@example.com';
    print('Successful send via mocked transporter', ok);
    return ok;
  } finally {
    // Restore
    nodemailer.createTransport = originalCreate;
  }
}

export async function runEmailTests() {
  console.log('🧪 Starting Email Utility Tests');
  let passed = 0, failed = 0;

  for (const fn of [test_missing_credentials_skips, test_successful_send_logs]) {
    try {
      const ok = await fn();
      ok ? passed++ : failed++;
    } catch (e) {
      failed++;
      print(fn.name, false, e.message);
    }
  }

  console.log(`\n📊 Results: Passed ${passed}, Failed ${failed}`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEmailTests().then(ok => process.exit(ok ? 0 : 1)).catch(err => { console.error(err); process.exit(1); });
}
