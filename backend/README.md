# Dinle Render Backend

Bu klasör Firebase Blaze istemeden Claude ve ElevenLabs çağrılarını güvenli backend'e taşır.

Render ayarları:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`

Environment Variables:

- `ANTHROPIC_API_KEY`: Claude/Anthropic yeni anahtarın
- `ELEVENLABS_API_KEY`: ElevenLabs yeni anahtarın
- `FIREBASE_SERVICE_ACCOUNT_JSON`: Firebase service account JSON içeriği

Render yayına aldıktan sonra verdiği URL'yi `App.tsx` içindeki `API_BASE_URL` değerine yaz.
