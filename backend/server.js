import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

const app = express();
const port = process.env.PORT || 10000;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

const allowedVoiceIds = new Set([
  '5k0SUQMAw9FAMiMpVAnK',
  'jn9r0BbscFxzXTZWvqPO',
  'bxi3fRnQ9ub4TxPfgkcM',
]);

const monthlyLimits = {
  ttsChars: 8500,
  pdfUploads: 3,
  summaries: 3,
  rewardedPages: 3,
  rewardedAdsPerPage: 2,
  rewardedTtsCharsPerPage: 1600,
};

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

function currentUsageMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function consumeUsage(uid, field, amount, limit, message) {
  const db = admin.firestore();
  const usageRef = db.collection('users').doc(uid).collection('usage').doc(currentUsageMonth());
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(usageRef);
    const usage = snap.exists ? snap.data() : {};
    const current = Number(usage[field] || 0);
    if (current + amount > limit) {
      const error = new Error(message);
      error.statusCode = 429;
      throw error;
    }
    transaction.set(usageRef, {
      [field]: current + amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

async function consumeTtsUsage(uid, amount) {
  const db = admin.firestore();
  const usageRef = db.collection('users').doc(uid).collection('usage').doc(currentUsageMonth());
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(usageRef);
    const usage = snap.exists ? snap.data() : {};
    const current = Number(usage.ttsChars || 0);
    const rewarded = Number(usage.rewardedTtsChars || 0);
    if (current + amount > monthlyLimits.ttsChars + rewarded) {
      const error = new Error('Aylık ücretsiz seslendirme hakkın doldu. 1 ek sayfa için ödüllü reklam izleyebilirsin.');
      error.statusCode = 429;
      throw error;
    }
    transaction.set(usageRef, {
      ttsChars: current + amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
}

function handleApiError(res, error, fallbackMessage) {
  const status = error.statusCode || 500;
  res.status(status).json({ error: error.message || fallbackMessage });
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/grant-reward', requireUser, async (req, res) => {
  try {
    const db = admin.firestore();
    const usageRef = db.collection('users').doc(req.user.uid).collection('usage').doc(currentUsageMonth());
    await db.runTransaction(async transaction => {
      const snap = await transaction.get(usageRef);
      const usage = snap.exists ? snap.data() : {};
      const rewardedPages = Number(usage.rewardedPages || 0);
      const pendingRewardAds = Number(usage.pendingRewardAds || 0);
      if (rewardedPages >= monthlyLimits.rewardedPages) {
        const error = new Error('Bu ay alınabilecek ödüllü ek hak sınırına ulaştın.');
        error.statusCode = 429;
        throw error;
      }
      const nextPendingRewardAds = pendingRewardAds + 1;
      const shouldGrant = nextPendingRewardAds >= monthlyLimits.rewardedAdsPerPage;
      const nextRewardedPages = rewardedPages + (shouldGrant ? 1 : 0);
      transaction.set(
        usageRef,
        {
          pendingRewardAds: shouldGrant ? 0 : nextPendingRewardAds,
          rewardedPages: nextRewardedPages,
          rewardedTtsChars: Number(usage.rewardedTtsChars || 0) + (shouldGrant ? monthlyLimits.rewardedTtsCharsPerPage : 0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      req.rewardResult = {
        granted: shouldGrant,
        adViews: shouldGrant ? monthlyLimits.rewardedAdsPerPage : nextPendingRewardAds,
        requiredAdViews: monthlyLimits.rewardedAdsPerPage,
        extraPages: shouldGrant ? 1 : 0,
      };
    });
    res.json({ ok: true, ...req.rewardResult });
  } catch (error) {
    handleApiError(res, error, 'Ek hak tanımlanamadı.');
  }
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
    await consumeTtsUsage(req.user.uid, text.length);

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
      const raw = await response.text();
      let detail = '';
      try {
        const data = JSON.parse(raw);
        detail = data.detail?.message || data.detail || data.message || '';
      } catch {
        detail = raw;
      }
      return res.status(502).json({
        error: detail ? `Ses oluşturulamadı: ${detail}` : 'Ses oluşturulamadı.',
      });
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.json({ audioBase64: audioBuffer.toString('base64'), contentType: 'audio/mpeg' });
  } catch (error) {
    handleApiError(res, error, 'Ses oluşturulamadı.');
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
    await consumeUsage(
      req.user.uid,
      'pdfUploads',
      1,
      monthlyLimits.pdfUploads,
      'Aylık ücretsiz PDF okuma hakkın doldu. Yeni hakların gelecek ay yenilenecek.'
    );

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
      const message = data.error?.message || '';
      if (message.toLowerCase().includes('invalid x-api-key')) {
        return res.status(502).json({ error: 'Claude API anahtarı geçersiz. Render ortamındaki ANTHROPIC_API_KEY değerini kontrol et.' });
      }
      return res.status(502).json({ error: message || 'PDF metni çıkarılamadı.' });
    }

    res.json({ text: data.content?.[0]?.text || '' });
  } catch (error) {
    handleApiError(res, error, 'PDF metni çıkarılamadı.');
  }
});

app.post('/summarize', requireUser, async (req, res) => {
  try {
    if (!requireKeys(res, ['anthropic'])) return;
    const { text, title } = req.body || {};
    if (typeof text !== 'string' || text.trim().length < 100) {
      return res.status(400).json({ error: 'Özetlenecek metin bulunamadı.' });
    }
    await consumeUsage(
      req.user.uid,
      'summaries',
      1,
      monthlyLimits.summaries,
      'Aylık ücretsiz özet hakkın doldu. Yeni hakların gelecek ay yenilenecek.'
    );

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
      const message = data.error?.message || '';
      if (message.toLowerCase().includes('invalid x-api-key')) {
        return res.status(502).json({ error: 'Claude API anahtarı geçersiz. Render ortamındaki ANTHROPIC_API_KEY değerini kontrol et.' });
      }
      return res.status(502).json({ error: message || 'Özet oluşturulamadı.' });
    }

    res.json({ summary: data.content?.[0]?.text || '' });
  } catch (error) {
    handleApiError(res, error, 'Özet oluşturulamadı.');
  }
});

app.listen(port, () => {
  console.log(`Dinle API listening on ${port}`);
});
