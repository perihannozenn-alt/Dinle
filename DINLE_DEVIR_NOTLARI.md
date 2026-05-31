# Dinle Projesi Devir Notlari

Son guncelleme: 31 Mayis 2026

Bu dosya, bilgisayar degisirse Dinle uygulamasini kaldigimiz yerden devam ettirmek icin hazirlandi. Gizli API anahtarlari bu dosyaya yazilmadi.

## Proje Konumu

Yerel klasor:

```bash
/Users/perihanozen/Documents/Codex/Dinle
```

GitHub:

```text
https://github.com/perihannozenn-alt/Dinle.git
```

Aktif dal:

```text
push-clean
```

GitHub'a gonderme komutu:

```bash
cd "/Users/perihanozen/Documents/Codex/Dinle"
git push origin push-clean:main
```

Expo ile acma:

```bash
cd "/Users/perihanozen/Documents/Codex/Dinle"
npx expo start --clear
```

## Canli Backend

Render servis adi:

```text
dinle-api
```

Backend URL:

```text
https://dinle-api.onrender.com
```

Saglik kontrolu:

```text
https://dinle-api.onrender.com/health
```

Beklenen cevap:

```json
{"ok":true}
```

Render ortam degiskenleri:

```text
ANTHROPIC_API_KEY
ELEVENLABS_API_KEY
FIREBASE_SERVICE_ACCOUNT_JSON
```

Bu degerler gizlidir. Yeni bilgisayarda tekrar gerekirse ilgili sitelerden veya Render Environment ekranindan kontrol edilmeli.

## Kullanilan Servisler

Firebase:

```text
Proje: dinle-2deda
Auth: e-posta/sifre
Firestore: kullanici, kullanim haklari ve ay bazli limitler
```

Claude / Anthropic:

```text
PDF metin cikarma
AI ozet olusturma
```

ElevenLabs:

```text
Metni sese cevirme
```

Aktif sesler:

```text
Soft Kadin: 5k0SUQMAw9FAMiMpVAnK
Akademik Erkek: jn9r0BbscFxzXTZWvqPO
Masalsi Kadin: bxi3fRnQ9ub4TxPfgkcM
```

AdMob:

```text
App ID: ca-app-pub-8615121220645496~5972231187
Rewarded Ad Unit ID: ca-app-pub-8615121220645496/6277529119
```

Not: Reklam entegrasyonu Expo Go icinde tam calismaz. Gercek test icin development build gerekir.

## Gizlilik Politikasi

Dogru link:

```text
https://sites.google.com/view/dinle-gizlilik-politikasi/ana-sayfa
```

Bu link App Store ve AdMob icin gizlilik politikasi olarak kullanilabilir.

## Apple Developer

Apple Developer kaydi baslatildi ama odeme henuz yapilmadi.

Ucret goruldu:

```text
1.029 TL / yil
```

Odeme yapilinca App Store Connect tarafina gecilecek.

## Mevcut Uygulama Ozeti

Dinle su anda:

- Kullanici kaydi ve girisi yapiyor.
- Giriste "Beni hatirla" ile e-posta adresini sakliyor.
- PDF yukleyip metne ceviriyor.
- Yuklenen PDF kitapligini cihazda sakliyor.
- PDF icin AI ozet olusturuyor.
- Metni 3 farkli ElevenLabs sesiyle okuyor.
- Arka planda ses calabilmesi icin Expo audio ayari yapildi.
- Ucretsiz deneme haklarini gosteriyor:
  - Ses sayfasi
  - PDF okuma
  - AI ozet
  - Reklamla kazanilan ek hak
- Kucuk Prens demo kitabi kaldirildi.
- Keşfet ekrani tur bazli secim kartlarina donusturuldu.
- Uyku sesleri YouTube kapak gorselleriyle gosteriliyor.
- Premium acilis animasyonu MP4 olarak kullaniliyor.

## Keşfet Linkleri

Trendyol:

```text
Cocuk Kitaplari:
https://www.trendyol.com/koleksiyonlar/cocuk-kitaplari-trendyol-link-k-55d85ed1-93e1-495d-af58-cd298f878905

Roman & Hikaye:
https://www.trendyol.com/koleksiyonlar/roman-hikaye-trendyol-link-k-d29a5d84-425b-4ccf-8269-2b8afd56a1db

Fantastik & Bilim Kurgu:
https://www.trendyol.com/koleksiyonlar/fantastik-bilim-kurgu-trendyol-link-k-93a26678-d492-4e8b-b299-19b3734448d9
```

Hepsiburada:

```text
Psikoloji:
https://app.hb.biz/HdPY03NQjRVi

Kisisel Gelisim:
https://app.hb.biz/jS7VDZOfA1PX

Bilim & Tarih:
https://app.hb.biz/lRGSlyjCXhrq
```

## Onemli Dosyalar

```text
App.tsx
backend/server.js
assets/logo-animasyonu.mp4
assets/dinle-logo.jpeg
assets/discover-cocuk.png
assets/discover-roman.png
assets/discover-fantastik.png
assets/discover-psikoloji.png
assets/discover-kisisel-gelisim.png
assets/discover-bilim-tarih.png
```

## Sonraki Mantikli Adimlar

1. Yeni bilgisayarda projeyi GitHub'dan indir.
2. `npm install` ile paketleri kur.
3. Expo ile uygulamayi ac.
4. Render `health` linkini kontrol et.
5. Apple Developer odemesini uygun zamanda tamamla.
6. App Store Connect'te uygulama kaydini ac.
7. App Store ekran goruntuleri, aciklama ve veri guvenligi formlarini doldur.
8. Reklam icin development build hazirla ve AdMob testlerini gercek cihazda yap.

## Guvenlik Notu

Bu bilgisayari satmadan once:

- GitHub tokenlari silinmeli.
- Firebase, Anthropic, ElevenLabs, Render, AdMob ve Apple hesaplarindan cikis yapilmali.
- Tarayici kayitli sifreleri ve oturumlari temizlenmeli.
- Gizli API anahtarlari hicbir dosyada acik halde birakilmamali.
- Mac sifirlanmadan once projenin GitHub'a gonderildiginden emin olunmali.
