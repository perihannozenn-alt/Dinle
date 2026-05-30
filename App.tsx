import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Dimensions, Modal, ActivityIndicator, Linking,
  TextInput, KeyboardAvoidingView, Platform, Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAVwgG9JCaIC1i6RR1eF51lRout_I7UBeE',
  authDomain: 'dinle-2deda.firebaseapp.com',
  projectId: 'dinle-2deda',
  storageBucket: 'dinle-2deda.firebasestorage.app',
  messagingSenderId: '668282909599',
  appId: '1:668282909599:web:dea5aadde46b6f19dec3aa',
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const API_BASE_URL = 'https://dinle-api.onrender.com';
const LOGO = require('./assets/dinle-logo.jpeg');
const OPENING_SOUND = require('./assets/dinle-opening.mp3');
const BOOKS_STORAGE_PATH = (FileSystem.documentDirectory || '') + 'dinle-books.json';

const C = {
  bg: '#0F0E17', surface: '#1A1826', elevated: '#231F35',
  border: '#2E2A45', primary: '#C9A96E', accent: '#7B6FA0',
  text: '#EDE8F5', textSub: '#A89EC4', textMuted: '#6B6085',
};

const TONES = [
  { id: 'soft_f', name: 'Soft Kadin', emoji: '🌙', color: '#D8B4FE', desc: 'Roman ve gece dinleme', voiceId: '5k0SUQMAw9FAMiMpVAnK', stability: 0.78, style: 0.25 },
  { id: 'academic_m', name: 'Akademik Erkek', emoji: '🎓', color: '#8EF46A', desc: 'PDF ve akademik metinler', voiceId: 'jn9r0BbscFxzXTZWvqPO', stability: 0.86, style: 0.05 },
  { id: 'tale_f', name: 'Masalsi Kadin', emoji: '✨', color: '#C9A96E', desc: 'Masal ve hikaye anlatımı', voiceId: 'bxi3fRnQ9ub4TxPfgkcM', stability: 0.68, style: 0.45 },
];

const SLEEP = [
  { id: 'baby1', title: 'Bebek Derin Uykusu', emoji: '🍼', duration: '1 saat', yt: 'YCyjfI5_DgU' },
  { id: 'fire1', title: 'Şömine ve Ambiyans', emoji: '🔥', duration: '1 saat', yt: 'R4VVda_-V9A' },
  { id: 'fire2', title: 'Sadece Şömine',      emoji: '🪵', duration: '1 saat', yt: 'hHx1dMjDRGo' },
  { id: 'fire3', title: 'Şömine ve Rüzgar',   emoji: '🌬️', duration: '1 saat', yt: 'gOtqZPYfNgY' },
  { id: 'med1',  title: 'Gece Meditasyonu',   emoji: '🌙', duration: '20 dk',  yt: 'uhVPfW-P4ks' },
];

const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

// Keşfet sayfası kitapları
const DISCOVER_BOOKS = [
  {
    id: 'd1',
    title: 'Suç ve Ceza',
    author: 'Fyodor Dostoyevski',
    category: 'Roman',
    emoji: '📚',
    color: '#C9A96E',
    price: '89,90 ₺',
    store: 'Kitapyurdu',
    url: 'https://www.kitapyurdu.com',
    desc: 'Rus edebiyatının başyapıtı',
    imageUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
  },
  {
    id: 'd2',
    title: 'Küçük Prens',
    author: 'Antoine de Saint-Exupéry',
    category: 'Çocuk',
    emoji: '🌹',
    color: '#F46A8E',
    price: '45,00 ₺',
    store: 'D&R',
    url: 'https://www.dr.com.tr',
    desc: 'Tüm zamanların en çok okunan kitabı',
    imageUrl: 'https://covers.openlibrary.org/b/id/7892359-L.jpg',
  },
  {
    id: 'd3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    category: 'Tarih',
    emoji: '🧬',
    color: '#6A9CF4',
    price: '120,00 ₺',
    store: 'İdefix',
    url: 'https://www.idefix.com',
    desc: 'İnsanlığın kısa tarihi',
    imageUrl: 'https://covers.openlibrary.org/b/id/8370221-L.jpg',
  },
  {
    id: 'd4',
    title: 'Dune',
    author: 'Frank Herbert',
    category: 'Bilim Kurgu',
    emoji: '🏜️',
    color: '#8EF46A',
    price: '95,00 ₺',
    store: 'Bkmkitap',
    url: 'https://www.bkmkitap.com',
    desc: 'Tüm zamanların en iyi bilim kurgu romanı',
    imageUrl: 'https://covers.openlibrary.org/b/id/9329962-L.jpg',
  },
  {
    id: 'd5',
    title: 'Atomik Alışkanlıklar',
    author: 'James Clear',
    category: 'Kişisel Gelişim',
    emoji: '⚡',
    color: '#D46AF4',
    price: '85,00 ₺',
    store: 'Kitapyurdu',
    url: 'https://www.kitapyurdu.com',
    desc: 'Küçük değişiklikler büyük sonuçlar doğurur',
    imageUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
  },
  {
    id: 'd6',
    title: 'Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    category: 'Polisiye',
    emoji: '🔍',
    color: '#F4A56A',
    price: '75,00 ₺',
    store: 'D&R',
    url: 'https://www.dr.com.tr',
    desc: 'Efsanevi dedektifin maceraları',
    imageUrl: 'https://covers.openlibrary.org/b/id/8318158-L.jpg',
  },
];

const CATEGORIES = ['Tümü', 'Roman', 'Çocuk', 'Tarih', 'Bilim Kurgu', 'Kişisel Gelişim', 'Polisiye'];

const DEMO_BOOKS = [
  {
    id: '1', title: 'Küçük Prens', color: '#C9A96E',
    pages: [
      'Büyükler rakamları çok severler. Onlara yeni bir arkadaştan söz ettiğinizde, önemli olan şeyleri hiç sormazlar.',
      'Ben bu gezegende çok yalnız yaşıyordum. Ta ki bir arıza yüzünden Sahra Çölüne inene kadar.',
      'Tilki dedi ki: İşte sırrım, çok basit. İnsan ancak yüreğiyle görebilir.',
    ],
  },
];

interface RegProps {
  form: { ad: string; soyad: string; email: string; tel: string; password: string };
  onChange: (key: string, val: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function RegisterForm({ form, onChange, onBack, onSubmit }: RegProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 8, marginBottom: 20 }}>
          <Text style={{ color: C.textSub, fontSize: 16 }}>Geri</Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Georgia', fontSize: 24, color: C.text, fontWeight: '700', marginBottom: 4 }}>Hesap Oluştur</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Tüm alanları doldurun</Text>

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Ad *</Text>
        <TextInput style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
          placeholder="Adınızı girin" placeholderTextColor={C.textMuted} autoCapitalize="words"
          value={form.ad} onChangeText={v => onChange('ad', v)} />

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Soyad *</Text>
        <TextInput style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
          placeholder="Soyadınızı girin" placeholderTextColor={C.textMuted} autoCapitalize="words"
          value={form.soyad} onChangeText={v => onChange('soyad', v)} />

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>E-posta *</Text>
        <TextInput style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
          placeholder="mail@ornek.com" placeholderTextColor={C.textMuted} keyboardType="email-address" autoCapitalize="none"
          value={form.email} onChangeText={v => onChange('email', v)} />

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Telefon *</Text>
        <TextInput style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
          placeholder="05XX XXX XX XX" placeholderTextColor={C.textMuted} keyboardType="phone-pad"
          value={form.tel} onChangeText={v => onChange('tel', v)} />

        <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Şifre *</Text>
        <TextInput style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 24 }}
          placeholder="En az 6 karakter" placeholderTextColor={C.textMuted} secureTextEntry
          value={form.password} onChangeText={v => onChange('password', v)} />

        <TouchableOpacity style={{ backgroundColor: C.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }} onPress={onSubmit}>
          <Text style={{ color: C.bg, fontWeight: '700', fontSize: 15 }}>Devam Et</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PremiumSplash() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let soundRef: any;
    const ExpoAV = require('expo-av');
    ExpoAV.Audio.Sound.createAsync(OPENING_SOUND, { shouldPlay: true, volume: 0.36 })
      .then(({ sound }: any) => { soundRef = sound; })
      .catch(() => {});

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(reveal, {
        toValue: 1,
        duration: 1350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1550),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: 3200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      if (soundRef) soundRef.unloadAsync().catch(() => {});
    };
  }, [breathe, logoOpacity, logoScale, reveal, titleOpacity, titleY, wave]);

  const waveMove = wave.interpolate({ inputRange: [0, 1], outputRange: [-90, 90] });
  const waveFade = wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.22, 0.88, 0.22] });
  const breathScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const revealY = reveal.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const revealRotate = reveal.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '0deg'] });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.splashRoot}>
        <View style={s.splashBackdrop}>
          {[0, 1, 2, 3, 4].map(row => (
            <Animated.View
              key={row}
              style={[
                s.waveRow,
                {
                  opacity: waveFade,
                  top: 230 + row * 22,
                  transform: [
                    { translateX: waveMove },
                    { scaleY: row === 1 ? breathScale : 1 },
                  ],
                },
              ]}
            >
              {Array.from({ length: 32 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    s.waveDot,
                    {
                      opacity: 0.12 + ((i + row) % 8) * 0.09,
                      transform: [{ translateY: Math.sin((i + row) / 2.2) * 26 }],
                    },
                  ]}
                />
              ))}
            </Animated.View>
          ))}

          <Animated.View
            style={[
              s.splashLogoWrap,
              {
                opacity: logoOpacity,
                transform: [
                  { translateY: revealY },
                  { rotate: revealRotate },
                  { scale: Animated.multiply(logoScale, breathScale) },
                ],
              },
            ]}
          >
            <Image source={LOGO} style={s.splashLogo} />
          </Animated.View>

          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center' }}>
            <Text style={s.splashTitle}>Dinle</Text>
            <Text style={s.splashSubtitle}>Yapay zekâ destekli ses deneyimi</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [screen, setScreen] = useState<'auth' | 'register' | 'plan' | 'login' | 'app'>('auth');
  const [tab, setTab] = useState('library');
  const [form, setForm] = useState({ ad: '', soyad: '', email: '', tel: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [plan, setPlan] = useState<'free' | 'temel' | 'premium'>('free');
  const [authLoading, setAuthLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setForm({ ad: data.ad, soyad: data.soyad, email: data.email, tel: data.tel, password: '' });
          setPlan(data.plan || 'free');
        }
        setScreen('app');
      } else {
        setScreen('auth');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 3600);
    return () => clearTimeout(timer);
  }, []);
  const [pageCount, setPageCount] = useState(0);
  const [books, setBooks] = useState(DEMO_BOOKS);
  const [activeBook, setActiveBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [tone, setTone] = useState(TONES[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeSleep, setActiveSleep] = useState<any>(null);
  const [showTones, setShowTones] = useState(false);
  const [showYT, setShowYT] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const audioRef = useRef<any>(null);

  const FREE_LIMIT = 20;
  const TEMEL_LIMIT = 100;

  async function saveBooks(nextBooks: any[]) {
    try {
      await FileSystem.writeAsStringAsync(BOOKS_STORAGE_PATH, JSON.stringify(nextBooks));
    } catch {}
  }

  useEffect(() => {
    const ExpoAV = require('expo-av');
    ExpoAV.Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    async function loadSavedBooks() {
      try {
        const info = await FileSystem.getInfoAsync(BOOKS_STORAGE_PATH);
        if (!info.exists) return;
        const raw = await FileSystem.readAsStringAsync(BOOKS_STORAGE_PATH);
        const savedBooks = JSON.parse(raw);
        if (Array.isArray(savedBooks) && savedBooks.length > 0) {
          setBooks(savedBooks);
        }
      } catch {}
    }
    loadSavedBooks();
  }, []);

  function handleFormChange(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleRegister() {
    if (!form.ad || !form.soyad || !form.email || !form.tel || !form.password) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    if (!form.email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir email girin.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setScreen('plan');
  }

  async function handleSelectPlan(p: 'free' | 'temel' | 'premium') {
    try {
      // Sifre olarak telefon numarasini kullan (ilk kayit)
      const password = form.password;
      const userCred = await createUserWithEmailAndPassword(auth, form.email, password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        ad: form.ad,
        soyad: form.soyad,
        email: form.email,
        tel: form.tel,
        plan: p,
        createdAt: new Date().toISOString(),
      });
      setPlan(p);
      setScreen('app');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        Alert.alert('Hata', 'Bu email zaten kayıtlı. Giriş yapın.');
        setScreen('login');
      } else {
        Alert.alert('Kayıt Hatası', err.message);
      }
    }
  }

  async function handleLogin() {
    if (!loginForm.email || !loginForm.password) {
      Alert.alert('Hata', 'Email ve sifre girin.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
    } catch (err: any) {
      Alert.alert('Giriş Hatası', 'Email veya şifre yanlış.');
    }
  }

  async function handleForgotPassword() {
    if (!loginForm.email) {
      Alert.alert('E-posta Gerekli', 'Şifre sıfırlama bağlantısı için e-posta adresinizi yazın.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginForm.email);
      Alert.alert('E-posta Gönderildi', 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err: any) {
      Alert.alert('Şifre Sıfırlama Hatası', err.message || 'E-posta gönderilemedi.');
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setScreen('auth');
  }

  function checkPageLimit(): boolean {
    if (plan === 'free' && pageCount >= FREE_LIMIT) {
      Alert.alert('Limit Doldu', 'Ücretsiz planda ayda 20 sayfa. Plana gecmek ister misiniz?',
        [{ text: 'İptal', style: 'cancel' }, { text: 'Plana Geç', onPress: () => setScreen('plan') }]
      );
      return false;
    }
    if (plan === 'temel' && pageCount >= TEMEL_LIMIT) {
      Alert.alert('Limit Doldu', 'Temel planda ayda 100 sayfa. Premium ister misiniz?',
        [{ text: 'İptal', style: 'cancel' }, { text: 'Plana Geç', onPress: () => setScreen('plan') }]
      );
      return false;
    }
    return true;
  }

  async function apiPost(path: string, body: any) {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Lütfen tekrar giriş yapın.');
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const raw = await response.text();
      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error('Sunucu geçici olarak beklenmeyen bir yanıt verdi. Lütfen birazdan tekrar deneyin.');
      }
      if (!response.ok) throw new Error(data.error || 'İşlem tamamlanamadı.');
      return data;
    } catch (err: any) {
      if (err.message) throw err;
      throw new Error('Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.');
    }
  }

  async function extractTextFromPDF(pdfBase64: string): Promise<string> {
    const data = await apiPost('/extract-pdf-text', { pdfBase64 });
    return data.text || '';
  }

  async function speak(text: string) {
    if (!checkPageLimit()) return;
    setPageCount(p => p + 1);
    try {
      setIsLoading(true);
      stopAudio();
      const data = await apiPost('/text-to-speech', {
        text,
        voiceId: tone.voiceId,
        stability: tone.stability,
        style: tone.style,
      });
      const dataUri = 'data:audio/mpeg;base64,' + data.audioBase64;
      const ExpoAV = require('expo-av');
      const { sound } = await ExpoAV.Audio.Sound.createAsync({ uri: dataUri });
      audioRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) setIsSpeaking(false);
      });
      await sound.playAsync();
      setIsSpeaking(true);
    } catch (err: any) {
      Alert.alert('Ses Hatası', err.message || 'Ses olusturulamadi.');
    } finally {
      setIsLoading(false);
    }
  }

  function stopAudio() {
    if (audioRef.current) {
      try { audioRef.current.stopAsync(); audioRef.current.unloadAsync(); } catch {}
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }

  async function summarizeBook() {
    if (!activeBook) return;
    try {
      setSummaryLoading(true);
      setShowSummary(true);
      const text = activeBook.pages.join('\n\n').slice(0, 12000);
      const data = await apiPost('/summarize', { text, title: activeBook.title });
      setSummaryText(data.summary || 'Özet çıkarılamadı.');
    } catch (err: any) {
      setShowSummary(false);
      Alert.alert('Özet Hatası', err.message || 'Özet oluşturulamadı.');
    } finally {
      setSummaryLoading(false);
    }
  }

  async function pickPDF() {
    try {
      setPdfLoading(true);
      setPdfProgress(0);
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Alert.alert('PDF Çok Büyük', 'Şimdilik 10 MB altındaki PDF dosyalarını yükleyebilirsin.');
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' as any });

      setPdfProgress(50);
      const fullText = await extractTextFromPDF(base64);
      setPdfProgress(100);
      const pages: string[] = [];
      if (fullText.length > 100) {
        let i = 0;
        while (i < fullText.length) {
          pages.push(fullText.substring(i, i + 1500));
          i += 1500;
        }
      } else {
        pages.push('PDF icerik cikartilamadi. Lutfen farkli bir dosya deneyin.');
      }

      const newBook = { id: 'user_' + Date.now(), title: asset.name.replace('.pdf', ''), color: '#C9A96E', pages, createdAt: new Date().toISOString(), source: 'pdf' };
      setBooks(prev => {
        const nextBooks = [newBook, ...prev];
        saveBooks(nextBooks);
        return nextBooks;
      });
      setActiveBook(newBook);
      setCurrentPage(0);
      setTab('reader');
    } catch (err: any) {
      Alert.alert('Hata', 'PDF yüklenemedi: ' + err.message);
    } finally {
      setPdfLoading(false);
      setPdfProgress(0);
    }
  }

  function toggleBookmark(bookId: string, pageIdx: number) {
    const key = bookId + '-' + pageIdx;
    setBookmarks(prev => prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key]);
  }
  function isBookmarked(bookId: string, pageIdx: number) { return bookmarks.includes(bookId + '-' + pageIdx); }
  function openBook(book: any) { setActiveBook(book); setCurrentPage(0); setTab('reader'); stopAudio(); }

  if (authLoading || !splashDone) return <PremiumSplash />;

  if (screen === 'auth') return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={{ minHeight: Dimensions.get('window').height - 80, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 34 }}>
            <Image source={LOGO} style={s.logoMark} />
            <Text style={{ fontFamily: 'Georgia', fontSize: 32, color: C.text, fontWeight: '700', marginTop: 18 }}>Dinle</Text>
            <Text style={{ fontSize: 18, color: C.text, marginTop: 12, textAlign: 'center', fontWeight: '600' }}>Belgelerini doğal sesle dinle</Text>
            <Text style={{ fontSize: 14, color: C.textMuted, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>PDF'lerini konuşan hikâyelere dönüştür. Uyurken, yürürken, dinlerken kaldığın yerden devam et.</Text>
          </View>
          <TouchableOpacity style={s.btn} onPress={() => setScreen('register')}>
            <Text style={s.btnText}>Ücretsiz Kaydol</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, marginTop: 12 }]} onPress={() => setScreen('login')}>
            <Text style={[s.btnText, { color: C.text }]}>Giriş Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );

  if (screen === 'login') return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
            <TouchableOpacity onPress={() => setScreen('auth')} style={{ marginBottom: 24 }}>
              <Text style={{ color: C.textSub, fontSize: 16 }}>Geri</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Georgia', fontSize: 24, color: C.text, fontWeight: '700', marginBottom: 4 }}>Giriş Yap</Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Hesabınıza giriş yapın</Text>

            <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>E-posta</Text>
            <TextInput
              style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 16 }}
              placeholder="mail@ornek.com" placeholderTextColor={C.textMuted}
              keyboardType="email-address" autoCapitalize="none"
              value={loginForm.email} onChangeText={v => setLoginForm(prev => ({ ...prev, email: v }))}
            />

            <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>Sifre</Text>
            <TextInput
              style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.text, fontSize: 15, marginBottom: 24 }}
              placeholder="Şifrenizi girin" placeholderTextColor={C.textMuted}
              secureTextEntry
              value={loginForm.password} onChangeText={v => setLoginForm(prev => ({ ...prev, password: v }))}
            />

            <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: -12, marginBottom: 8 }} onPress={handleForgotPassword}>
              <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Şifremi unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btn} onPress={handleLogin}>
              <Text style={s.btnText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setScreen('register')}>
              <Text style={{ color: C.textSub, fontSize: 14 }}>Hesabınız yok mu? Kaydolun</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );

  if (screen === 'register') return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <RegisterForm form={form} onChange={handleFormChange} onBack={() => setScreen('auth')} onSubmit={handleRegister} />
      </SafeAreaView>
    </SafeAreaProvider>
  );

  if (screen === 'plan') return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontFamily: 'Georgia', fontSize: 24, color: C.text, fontWeight: '700', marginBottom: 4, marginTop: 8 }}>Plan Seç</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>İhtiyacına göre bir plan seç</Text>
          {[
            { id: 'free', name: 'Ücretsiz', price: '0 TL/ay', color: C.border, features: ['20 sayfa/ay', '3 ses tonu', 'Uyku sesleri'], noFeatures: ['PDF yükleme'] },
            { id: 'temel', name: 'Temel', price: '79 TL/ay', color: C.primary, features: ['100 sayfa/ay', 'Tüm ses tonları', 'PDF yükleme', 'Uyku sesleri'], noFeatures: [], badge: 'POPULER' },
            { id: 'premium', name: 'Premium', price: '129 TL/ay', color: C.accent, features: ['Sınırsız sayfa', 'Tüm ses tonları', 'PDF yükleme', 'Uyku sesleri', 'Öncelikli destek'], noFeatures: [] },
          ].map(p => (
            <TouchableOpacity key={p.id} style={[s.planCard, { borderColor: p.color }]} onPress={() => handleSelectPlan(p.id as any)}>
              {(p as any).badge && <View style={[s.planBadge, { backgroundColor: p.color }]}><Text style={{ color: C.bg, fontSize: 11, fontWeight: '700' }}>{(p as any).badge}</Text></View>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontFamily: 'Georgia', fontSize: 20, color: C.text, fontWeight: '700' }}>{p.name}</Text>
                <Text style={{ fontFamily: 'Georgia', fontSize: 18, color: p.color, fontWeight: '700' }}>{p.price}</Text>
              </View>
              {p.features.map(f => <Text key={f} style={{ fontSize: 14, color: C.textSub, marginBottom: 6 }}>{'v ' + f}</Text>)}
              {p.noFeatures.map(f => <Text key={f} style={{ fontSize: 14, color: C.textMuted, marginBottom: 6 }}>{'x ' + f}</Text>)}
              <View style={[s.planBtn, { backgroundColor: p.color }]}>
                <Text style={{ color: p.id === 'free' ? C.text : C.bg, fontWeight: '700', fontSize: 14 }}>{p.name + ' Plani Sec'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );

  const LibraryTab = () => (
    <ScrollView contentContainerStyle={s.listContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
        <View>
          <Text style={{ fontFamily: 'Georgia', fontSize: 22, color: C.text, fontWeight: '700' }}>Kitaplığım</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{books.length} kitap</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={s.smallBtn}>
          <Text style={{ color: C.textSub, fontSize: 13, fontWeight: '600' }}>Çıkış</Text>
        </TouchableOpacity>
      </View>
      {books.map(book => (
        <TouchableOpacity key={book.id} style={[s.bookCard, { borderLeftColor: book.color }]} onPress={() => openBook(book)}>
          <View style={[s.bookCover, { backgroundColor: book.color + '22' }]}><Text style={{ fontSize: 28 }}>📖</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bookTitle}>{book.title}</Text>
            <Text style={s.bookMeta}>{book.pages.length} sayfa</Text>
            <View style={s.progressBar}><View style={[s.progressFill, { width: '30%', backgroundColor: book.color }]} /></View>
          </View>
          <Text style={{ color: C.textMuted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.uploadBox} onPress={pickPDF} disabled={pdfLoading}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>☁️</Text>
        {pdfLoading ? (
          <>
            <Text style={{ fontFamily: 'Georgia', fontSize: 16, color: C.primary, fontWeight: '700', marginBottom: 6 }}>Yükleniyor... %{pdfProgress}</Text>
            <Text style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 12 }}>Bu işlem 1-2 dakika sürebilir. PDF yapay zekâ ile okunuyor, lütfen bekleyin.</Text>
            <View style={{ width: '100%', height: 4, backgroundColor: C.border, borderRadius: 2 }}>
              <View style={{ width: pdfProgress + '%' as any, height: 4, backgroundColor: C.primary, borderRadius: 2 }} />
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: 'Georgia', fontSize: 18, color: C.text, fontWeight: '700', marginBottom: 6 }}>PDF Yükle</Text>
            <Text style={{ fontSize: 13, color: C.textMuted, textAlign: 'center' }}>Dokunun ve PDF dosyası seçin</Text>
            <View style={[s.badge, { backgroundColor: C.primary + '22', borderColor: C.primary, marginTop: 14 }]}>
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '600' }}>Claude AI - Akıllı PDF Okuma</Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const ReaderTab = () => {
    if (!activeBook) return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48 }}>📖</Text>
        <TouchableOpacity style={s.btn} onPress={() => setTab('library')}>
          <Text style={s.btnText}>Kitaplığa Git</Text>
        </TouchableOpacity>
      </View>
    );
    const page = activeBook.pages[currentPage];
    const total = activeBook.pages.length;
    const progress = ((currentPage + 1) / total) * 100;
    const bm = isBookmarked(activeBook.id, currentPage);
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => { stopAudio(); setTab('library'); }}>
            <Text style={{ color: C.textSub, fontSize: 16 }}>Geri</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Georgia', fontSize: 15, color: C.text, fontWeight: '700' }} numberOfLines={1}>{activeBook.title}</Text>
            <Text style={{ fontSize: 12, color: C.textMuted }}>{currentPage + 1} / {total}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={summarizeBook} style={s.smallBtn}>
              <Text style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>Özet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleBookmark(activeBook.id, currentPage)}>
              <Text style={{ fontSize: 22 }}>{bm ? '🔖' : '📄'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 3, backgroundColor: C.border }}>
          <View style={{ height: 3, width: progress + '%' as any, backgroundColor: C.primary }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <Text style={s.pageText}>{page}</Text>
          {bm && <Text style={{ color: C.primary, fontSize: 12, marginTop: 16 }}>Bu sayfa işaretlendi</Text>}
        </ScrollView>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, padding: 14, borderTopWidth: 1, borderTopColor: C.border }} onPress={() => setShowTones(true)}>
          <Text style={{ fontSize: 18 }}>{tone.emoji}</Text>
          <Text style={{ color: C.textSub, fontSize: 13, flex: 1 }}>{tone.name} - ElevenLabs</Text>
          <Text style={{ color: C.textMuted, fontSize: 12 }}>Değiştir</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 20, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface }}>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => { stopAudio(); setCurrentPage(p => Math.max(0, p - 1)); }} disabled={currentPage === 0}>
            <Text style={{ fontSize: 22, opacity: currentPage === 0 ? 0.3 : 1 }}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.playBtn, { backgroundColor: isLoading ? C.border : tone.color }]} onPress={() => isSpeaking ? stopAudio() : speak(page)} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 28 }}>{isSpeaking ? '⏸' : '▶'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => { stopAudio(); setCurrentPage(p => Math.min(total - 1, p + 1)); }} disabled={currentPage >= total - 1}>
            <Text style={{ fontSize: 22, opacity: currentPage >= total - 1 ? 0.3 : 1 }}>⏭</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  

  const DiscoverTab = () => {
    const filtered = selectedCategory === 'Tümü'
      ? DISCOVER_BOOKS
      : DISCOVER_BOOKS.filter(b => b.category === selectedCategory);

    return (
      <ScrollView contentContainerStyle={s.listContent}>
        <View style={{ marginBottom: 16, marginTop: 8 }}>
          <Text style={{ fontFamily: 'Georgia', fontSize: 22, color: C.text, fontWeight: '700' }}>Keşfet</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Beğenebileceğin kitaplar</Text>
        </View>

        {/* Kategori filtresi */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7,
                  borderRadius: 20, borderWidth: 1,
                  borderColor: selectedCategory === cat ? C.primary : C.border,
                  backgroundColor: selectedCategory === cat ? C.primary + '22' : C.surface,
                }}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={{ fontSize: 12, color: selectedCategory === cat ? C.primary : C.textMuted, fontWeight: '600' }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Kitap listesi */}
        {filtered.map(book => (
          <TouchableOpacity
            key={book.id}
            style={[s.bookCard, { borderLeftColor: book.color }]}
            onPress={() => Linking.openURL(book.url)}
          >
            <Image source={{ uri: book.imageUrl }} style={s.discoverCover} />
            <View style={{ flex: 1 }}>
              <Text style={s.bookTitle}>{book.title}</Text>
              <Text style={{ fontSize: 12, color: C.textSub, marginBottom: 2 }}>{book.author}</Text>
              <Text style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{book.desc}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: C.primary, fontWeight: '700' }}>{book.price}</Text>
                <View style={{ backgroundColor: C.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>{book.store}</Text>
                </View>
              </View>
            </View>
            <Text style={{ color: C.textMuted, fontSize: 18, marginLeft: 8 }}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{ padding: 16, backgroundColor: C.surface, borderRadius: 12, marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>
  {"Bazı bağlantılar affiliate iş ortaklığı içerebilir.\nSatın alımlar uygulamayı desteklememize yardımcı olabilir."}
</Text>
        </View>
      </ScrollView>
    );
  };

  const SleepTab = () => (
    <ScrollView contentContainerStyle={s.listContent}>
      <View style={{ marginBottom: 16, marginTop: 8 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: 22, color: C.text, fontWeight: '700' }}>Uyku Sesleri</Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Huzurlu bir uyku için</Text>
      </View>
      {SLEEP.map(item => (
        <TouchableOpacity key={item.id} style={[s.sleepCard, activeSleep?.id === item.id && { borderColor: C.accent }]} onPress={() => { setActiveSleep(item); setShowYT(true); }}>
          <Image source={{ uri: ytThumb(item.yt) }} style={s.sleepThumb} />
          <View style={s.sleepShade}>
            <View style={{ flex: 1 }}>
              <Text style={[s.bookTitle, { fontSize: 16 }]}>{item.title}</Text>
              <Text style={[s.bookMeta, { color: C.textSub }]}>{item.duration}</Text>
            </View>
            <View style={s.sleepPlay}><Text style={{ color: C.bg, fontSize: 16 }}>▶</Text></View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const TonesModal = () => (
    <Modal visible={showTones} transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setShowTones(false)}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Ses Tonu Seç</Text>
          {TONES.map(t => (
            <TouchableOpacity key={t.id} style={[s.toneRow, tone.id === t.id && { backgroundColor: t.color + '22' }]} onPress={() => { setTone(t); setShowTones(false); stopAudio(); }}>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.bookTitle, tone.id === t.id && { color: t.color }]}>{t.name}</Text>
                <Text style={s.bookMeta}>{t.desc}</Text>
              </View>
              {tone.id === t.id && <Text style={{ color: t.color, fontWeight: '700' }}>v</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const YTModal = () => (
    <Modal visible={showYT && !!activeSleep} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.sheet, { alignItems: 'center' }]}>
          {!!activeSleep && <Image source={{ uri: ytThumb(activeSleep.yt) }} style={s.ytPreview} />}
          <Text style={s.sheetTitle}>{activeSleep?.title}</Text>
          <Text style={s.bookMeta}>{activeSleep?.duration}</Text>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#FF0000', marginTop: 20 }]} onPress={() => Linking.openURL('https://www.youtube.com/watch?v=' + (activeSleep ? activeSleep.yt : ''))}>
            <Text style={[s.btnText, { color: '#fff' }]}>YouTube'da Aç</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 16 }} onPress={() => { setShowYT(false); setActiveSleep(null); }}>
            <Text style={{ color: C.textMuted, fontSize: 14 }}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SummaryModal = () => (
    <Modal visible={showSummary} transparent animationType="slide">
      <View style={s.overlay}>
        <View style={s.sheet}>
          <Text style={s.sheetTitle}>Son Bölüm Özeti</Text>
          {summaryLoading ? (
            <ActivityIndicator color={C.primary} size="large" style={{ marginVertical: 24 }} />
          ) : (
            <ScrollView style={{ maxHeight: 320 }}>
              <Text style={{ color: C.textSub, fontSize: 15, lineHeight: 24 }}>{summaryText}</Text>
            </ScrollView>
          )}
          <TouchableOpacity style={[s.btn, { marginTop: 18 }]} onPress={() => setShowSummary(false)}>
            <Text style={s.btnText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1 }}>
          {tab === 'library'  && <LibraryTab />}
          {tab === 'reader'   && <ReaderTab />}
          {tab === 'discover' && <DiscoverTab />}
          {tab === 'sleep'    && <SleepTab />}
        </View>
        <View style={s.tabBar}>
          {[
            { id: 'library',  emoji: '📚', label: 'Kitaplık' },
            { id: 'reader',   emoji: '📖', label: 'Oku' },
            { id: 'discover', emoji: '🔎', label: 'Keşfet' },
            { id: 'sleep',    emoji: '🌙', label: 'Uyku' },
          ].map(t => (
            <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => setTab(t.id)}>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              <Text style={[s.tabLabel, tab === t.id && { color: C.primary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TonesModal />
        <YTModal />
        <SummaryModal />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  splashRoot: { flex: 1, backgroundColor: '#080512' },
  splashBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  splashLogoWrap: {
    width: 196,
    height: 196,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  splashLogo: { width: 184, height: 184, borderRadius: 42 },
  splashTitle: { fontFamily: 'Georgia', fontSize: 38, color: C.text, fontWeight: '700', marginTop: 28 },
  splashSubtitle: { color: C.textSub, fontSize: 14, marginTop: 8, letterSpacing: 0 },
  waveRow: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },
  waveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  listContent: { padding: 16, paddingBottom: 32 },
  logoMark: { width: 142, height: 142, borderRadius: 32 },
  logoMarkSmall: { width: 86, height: 86, borderRadius: 22 },
  bookCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  bookCover: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  discoverCover: { width: 58, height: 82, borderRadius: 8, backgroundColor: C.elevated },
  bookTitle: { fontFamily: 'Georgia', fontSize: 15, color: C.text, fontWeight: '600', marginBottom: 3 },
  bookMeta: { fontSize: 12, color: C.textMuted, marginBottom: 6 },
  progressBar: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  uploadBox: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1.5, borderColor: C.primary, borderStyle: 'dashed', padding: 32, alignItems: 'center', marginTop: 8 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pageText: { fontFamily: 'Georgia', fontSize: 18, color: C.text, lineHeight: 32, letterSpacing: 0.3 },
  playBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  sleepCard: { height: 132, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: C.surface },
  sleepThumb: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  sleepShade: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', padding: 14, backgroundColor: '#00000066' },
  sleepPlay: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary },
  ytPreview: { width: '100%', height: 170, borderRadius: 12, marginBottom: 16, backgroundColor: C.surface },
  tabBar: { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingBottom: 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, color: C.textMuted },
  overlay: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.elevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontFamily: 'Georgia', fontSize: 18, color: C.text, fontWeight: '700', marginBottom: 16 },
  toneRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 6 },
  smallBtn: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  btn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  btnText: { fontFamily: 'Georgia', fontSize: 14, color: C.bg, fontWeight: '700' },
  planCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  planBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
});
