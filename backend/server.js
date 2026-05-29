import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

const app = express();
const port = process.env.PORT || 10000;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

const allowedVoiceIds = new Set([
  'D2zohYOTDLDjsukaJR6s',
  'lTLroDFA8XupnqzYQ65E',
  'UJyFYuT2bWhbOJWQAbbr',
  'CqeDG8Vtg5Q5UccDJKM5',
  'AaAZgk1FPmHlBtpLjEGc',
]);

function parseServiceAccount() {
  const rawValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawValue) return null;

  let value = rawValue.trim();
  if (!value.startsWith('{') && value.includes('"type"')) {
    value = `{${value}`;
  }
  if (!value.endsWith('}') && value.includes('"private_key"')) {
    value = `${value}}`;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON tam JSON olmalı: ilk karakter { ve son karakter } olmalı.');
  }
}

const serviceAccount = parseServiceAccount();

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  admin.initializeApp();
}

app.use(cors());
app.use(express.json({ limit: '25mb' }));

async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Lütfen tekrar giriş yapın.' });
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Oturum doğrulanamadı. Lütfen tekrar giriş yapın.' });
  }
}

function requireKeys(res, keys) {
  if (keys.includes('anthropic') && !anthropicKey) {
    res.status(500).json({ error: 'Claude anahtarı backend ortamında tanımlı değil.' });
    return false;
  }
  if (keys.includes('elevenlabs') && !elevenLabsKey) {
    res.status(500).json({ error: 'ElevenLabs anahtarı backend ortamında tanımlı değil.' });
    return false;
  }
  return true;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/text-to-speech', requireUser, async (req, res) => {
  try {
    if (!requireKeys(res, ['elevenlabs'])) return;
    const { text, voiceId, stability, style } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Okunacak metin bulunamadı.' });
    }
    if (text.length > 2500) {
      return res.status(400).json({ error: 'Metin çok uzun. Lütfen daha kısa bir bölüm deneyin.' });
    }
    if (typeof voiceId !== 'string' || !allowedVoiceIds.has(voiceId)) {
      return res.status(400).json({ error: 'Bu ses tonu desteklenmiyor.' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenLabsKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: typeof stability === 'number' ? stability : 0.75,
          similarity_boost: 0.75,
          style: typeof style === 'number' ? style : 0.2,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Ses oluşturulamadı.' });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.json({ audioBase64: audioBuffer.toString('base64'), contentType: 'audio/mpeg' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Ses oluşturulamadı.' });
  }
});

app.post('/extract-pdf-text', requireUser, async (req, res) => {
  try {
    if (!requireKeys(res, ['anthropic'])) return;
    const { pdfBase64 } = req.body || {};
    if (typeof pdfBase64 !== 'string' || pdfBase64.length < 100) {
      return res.status(400).json({ error: 'PDF içeriği alınamadı.' });
    }
    if (pdfBase64.length > 18_000_000) {
      return res.status(400).json({ error: 'PDF şimdilik çok büyük. 10 MB altı bir dosya deneyin.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: 'Bu PDF dosyasındaki tüm metni aynen yaz. Sadece metni yaz, açıklama ekleme. Türkçe karakterleri doğru koru.' },
          ],
        }],
      }),
    });

    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'PDF okuma servisi beklenmeyen bir yanıt verdi. Lütfen daha küçük bir PDF deneyin.' });
    }
    if (!response.ok || data.error) {
      return res.status(502).json({ error: data.error?.message || 'PDF metni çıkarılamadı.' });
    }

    res.json({ text: data.content?.[0]?.text || '' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'PDF metni çıkarılamadı.' });
  }
});

app.post('/summarize', requireUser, async (req, res) => {
  try {
    if (!requireKeys(res, ['anthropic'])) return;
    const { text, title } = req.body || {};
    if (typeof text !== 'string' || text.trim().length < 100) {
      return res.status(400).json({ error: 'Özetlenecek metin bulunamadı.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        messages: [{
          role: 'user',
          content: `Kitap/belge adı: ${title || 'Bilinmiyor'}\n\nAşağıdaki metin için kısa, anlaşılır bir Türkçe "son bölümde ne olmuştu" özeti çıkar. 5-7 maddeyi geçme, spoiler gibi değil hatırlatma gibi yaz.\n\n${text.slice(0, 12000)}`,
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(502).json({ error: data.error?.message || 'Özet oluşturulamadı.' });
    }

    res.json({ summary: data.content?.[0]?.text || '' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Özet oluşturulamadı.' });
  }
});

app.listen(port, () => {
  console.log(`Dinle API listening on ${port}`);
});
