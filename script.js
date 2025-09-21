// Türkçe Okuma Öğreniyorum - JavaScript Fonksiyonları

// Varsayılan kelimeler
const defaultWords = [
    {
        "word": "Anne",
        "syllables": [
            { "text": "An", "color": "red" },
            { "text": "ne", "color": "blue" }
        ]
    },
    {
        "word": "Baba",
        "syllables": [
            { "text": "Ba", "color": "red" },
            { "text": "ba", "color": "blue" }
        ]
    },
    {
        "word": "Efe",
        "syllables": [
            { "text": "E", "color": "red" },
            { "text": "fe", "color": "blue" }
        ]
    },
    {
        "word": "Okul",
        "syllables": [
            { "text": "O", "color": "red" },
            { "text": "kul", "color": "blue" }
        ]
    },
    {
        "word": "Kitap",
        "syllables": [
            { "text": "Ki", "color": "red" },
            { "text": "tap", "color": "blue" }
        ]
    },
    {
        "word": "Defter",
        "syllables": [
            { "text": "Def", "color": "red" },
            { "text": "ter", "color": "blue" }
        ]
    }
];

// Global değişkenler
let currentWords = [];
let selectedVoice = null;
let speechRate = 0.7;
let allVoices = [];
let voiceLoadAttempts = 0;
let syllableIdCounter = 1;

// DOM elementleri (global)
let wordsContainer, voiceSelect, speedSelect, testVoiceBtn, refreshVoicesBtn, voiceStatus;
let toggleManagementCenter, managementCenter, wordInput, syllablesInput, addWordBtn;
let generateRandomWordsBtn, resetWordsBtn, clearAllWordsBtn, currentWordsList;
let storageStatus, manualSaveBtn, wordCount, autoSyllableBtn, syllableWarning, funRefreshBtn;

// DOM hazır olduğunda çalıştır
document.addEventListener('DOMContentLoaded', () => {
    // DOM elementlerini al
    wordsContainer = document.getElementById('words-container');
    voiceSelect = document.getElementById('voice-select');
    speedSelect = document.getElementById('speed-select');
    testVoiceBtn = document.getElementById('test-voice');
    refreshVoicesBtn = document.getElementById('refresh-voices');
    voiceStatus = document.getElementById('voice-status');
    
    // Yönetim merkezi elementleri
    toggleManagementCenter = document.getElementById('toggle-management-center');
    managementCenter = document.getElementById('management-center');
    wordInput = document.getElementById('word-input');
    syllablesInput = document.getElementById('syllables-input');
    addWordBtn = document.getElementById('add-word');
    generateRandomWordsBtn = document.getElementById('generate-random-words');
    resetWordsBtn = document.getElementById('reset-words');
    clearAllWordsBtn = document.getElementById('clear-all-words');
    currentWordsList = document.getElementById('current-words-list');
    storageStatus = document.getElementById('storage-status');
    manualSaveBtn = document.getElementById('manual-save');
    wordCount = document.getElementById('word-count');
    autoSyllableBtn = document.getElementById('auto-syllable');
    syllableWarning = document.getElementById('syllable-warning');
    funRefreshBtn = document.getElementById('fun-refresh');
    
    // Başlangıç işlemleri
    loadWordsFromStorage();
    
    // Eğer kelime sayısı çok azsa, varsayılan kelimeleri yükle
    if (currentWords.length < 3) {
        currentWords = [...defaultWords];
        saveWordsToStorage();
    }
    
    validateCurrentWords();
    renderWords();
    updateCurrentWordsList();
    checkStorageStatus();
    tryLoadVoices();
    
    // Ses değişikliklerini dinle
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
            if (voiceLoadAttempts < 10) {
                loadVoices();
            }
        };
    }
    
    // Event listener'lar
    // Yönetim merkezi toggle
    toggleManagementCenter.addEventListener('click', () => {
        if (managementCenter.classList.contains('hidden')) {
            managementCenter.classList.remove('hidden');
            toggleManagementCenter.innerHTML = '🎮 <span class="text-yellow-300">Ayarları Kapat</span>';
            updateCurrentWordsList();
        } else {
            managementCenter.classList.add('hidden');
            toggleManagementCenter.innerHTML = '🛠️ Ayarları Aç/Kapat';
        }
    });

    // Kelime ekleme
    addWordBtn.addEventListener('click', () => {
        addNewWord(wordInput.value, syllablesInput.value);
    });

    // Rastgele kelime oluştur
    generateRandomWordsBtn.addEventListener('click', () => {
        generateRandomWords(true);
    });

    // Enter tuşu ile kelime ekleme
    syllablesInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewWord(wordInput.value, syllablesInput.value);
        }
    });

    // Otomatik heceleme butonu
    autoSyllableBtn.addEventListener('click', () => {
        const word = wordInput.value.trim();
        if (!word) {
            alert('Önce bir kelime girin!');
            wordInput.focus();
            return;
        }

        const syllables = automaticSyllableBreak(word);
        syllablesInput.value = syllables.join(',');
        
        // Uyarı mesajını göster
        syllableWarning.classList.remove('hidden');
        
        // Uyarıyı 5 saniye sonra gizle
        setTimeout(() => {
            syllableWarning.classList.add('hidden');
        }, 5000);
        
        // Focus'u heceler input'una ver
        syllablesInput.focus();
        syllablesInput.select();
    });

    // Kelime input'u değiştiğinde uyarıyı gizle
    wordInput.addEventListener('input', () => {
        syllableWarning.classList.add('hidden');
    });

    // Varsayılan kelimeleri yükle
    resetWordsBtn.addEventListener('click', () => {
        if (confirm('Varsayılan kelimeleri yüklemek istediğinizden emin misiniz? Mevcut kelimeler kaybolacak.')) {
            resetToDefaultWords();
        }
    });

    // Tüm kelimeleri temizle
    clearAllWordsBtn.addEventListener('click', () => {
        clearAllWords();
    });

    // Eğlenceli yenileme
    funRefreshBtn.addEventListener('click', () => {
        funRefresh();
    });

    // Manuel kayıt
    manualSaveBtn.addEventListener('click', () => {
        saveWordsToStorage();
        checkStorageStatus();
    });

    // Ses seçimi değiştiğinde
    voiceSelect.addEventListener('change', (e) => {
        speechSynthesis.cancel();
        
        const selectedValue = e.target.value;
        if (selectedValue && selectedValue.includes('|')) {
            const [voiceName, voiceLang] = selectedValue.split('|');
            selectedVoice = allVoices.find(voice => 
                voice.name === voiceName && voice.lang === voiceLang
            );
        }
    });

    // Sesleri yenile butonu
    refreshVoicesBtn.addEventListener('click', () => {
        voiceLoadAttempts = 0;
        voiceStatus.textContent = '🔄 Sesler yeniden yükleniyor...';
        voiceStatus.style.color = '#f59e0b';
        
        // Boş utterance ile sesleri tetikle
        const utterance = new SpeechSynthesisUtterance('');
        speechSynthesis.speak(utterance);
        speechSynthesis.cancel();
        
        setTimeout(() => {
            tryLoadVoices();
        }, 300);
    });

    // Hız seçimi değiştiğinde
    speedSelect.addEventListener('change', (e) => {
        speechRate = parseFloat(e.target.value);
    });

    // Ses test butonu
    testVoiceBtn.addEventListener('click', () => {
        playSyllable('Merhaba! Ben senin arkadaşın, beraber kelime öğreneceğiz!');
    });

    // Sayfa kapatılırken otomatik kayıt
    window.addEventListener('beforeunload', () => {
        saveWordsToStorage();
    });

    // Periyodik otomatik kayıt (her 30 saniyede)
    setInterval(() => {
        if (currentWords.length > 0) {
            saveWordsToStorage();
            checkStorageStatus();
        }
    }, 30000);

    // Hece tıklama için event delegation
    wordsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('syllable')) {
            const textToSpeak = e.target.dataset.text;
            if (textToSpeak) {
                playSyllable(textToSpeak);
            }
        }
    });
});

// Türkçe büyük harf fonksiyonu
function toTurkishUpperCase(str) {
    if (!str || str.length === 0) return str;
    
    const turkishMap = {
        'i': 'İ',
        'ı': 'I',
        'ğ': 'Ğ',
        'ü': 'Ü',
        'ş': 'Ş',
        'ö': 'Ö',
        'ç': 'Ç'
    };
    
    const firstChar = str.charAt(0);
    const upperChar = turkishMap[firstChar] || firstChar.toUpperCase();
    
    return upperChar + str.slice(1);
}

// Gelişmiş Türkçe otomatik heceleme fonksiyonu
function automaticSyllableBreak(word) {
    const originalWord = word.trim();
    const cleanWord = originalWord.toLowerCase();
    const vowels = 'aeıioöuü';
    const syllables = [];
    let currentSyllable = '';
    
    // Basit kelimeler için önceden tanımlı hecelemeler
    const knownWords = {
        'anne': ['An', 'ne'],
        'baba': ['Ba', 'ba'],
        'efe': ['E', 'fe'],
        'okul': ['O', 'kul'],
        'kitap': ['Ki', 'tap'],
        'defter': ['Def', 'ter'],
        'öğretmen': ['Öğ', 'ret', 'men'],
        'bilgisayar': ['Bil', 'gi', 'sa', 'yar'],
        'çiçekler': ['Çi', 'çek', 'ler'],
        'cumhuriyet': ['Cum', 'hu', 'ri', 'yet'],
        
        // Tek hece kelimeler - yanlış hecelenmesini önle
        'flüt': ['Flüt'],
        'spor': ['Spor'],
        'tren': ['Tren'],
        'plan': ['Plan'],
        'krem': ['Krem'],
        'gres': ['Gres'],
        'fren': ['Fren'],
        'pres': ['Pres'],
        'kral': ['Kral'],
        'gram': ['Gram'],
        'tram': ['Tram'],
        'frak': ['Frak'],
        'prim': ['Prim'],
        'trim': ['Trim'],
        'klep': ['Klep'],
        'klon': ['Klon'],
        'plak': ['Plak'],
        'frak': ['Frak'],
        'stil': ['Stil'],
        'stok': ['Stok'],
        'stop': ['Stop'],
        'grup': ['Grup'],
        'bluz': ['Bluz'],
        'plus': ['Plus'],
        'prens': ['Prens'],
        'trans': ['Trans'],
        'stres': ['Stres']
    };

    // Bilinen kelimeler için doğrudan dön
    if (knownWords[cleanWord]) {
        return knownWords[cleanWord];
    }
    
    for (let i = 0; i < cleanWord.length; i++) {
        const char = cleanWord[i];
        const nextChar = cleanWord[i + 1];
        const nextNextChar = cleanWord[i + 2];
        
        currentSyllable += char;
        
        // Sesli harf kontrolü
        const isVowel = vowels.includes(char);
        const nextIsVowel = nextChar && vowels.includes(nextChar);
        
        // Hece sonu belirleme kuralları
        let shouldBreak = false;
        
        if (isVowel && nextChar && !nextIsVowel) {
            // Sesli + sessiz durumu
            if (nextNextChar) {
                if (vowels.includes(nextNextChar)) {
                    // Ses-li + ses-siz + ses-li: hece sonu
                    shouldBreak = true;
                } else {
                    // Sesli + sessiz + sessiz: çoğunlukla hece devam eder
                    const nextNextNextChar = cleanWord[i + 3];
                    if (nextNextNextChar && vowels.includes(nextNextNextChar)) {
                        // İki sessiz harf varsa, ilkini al
                        shouldBreak = false;
                    }
                }
            }
        }
        
        // Çift sessiz harflerde ilkini önceki heceye ver  
        if (!isVowel && nextChar && !nextIsVowel) {
            if (nextNextChar && vowels.includes(nextNextChar)) {
                shouldBreak = true;
            }
        }
        
        if (shouldBreak && i < cleanWord.length - 1) {
            syllables.push(currentSyllable);
            currentSyllable = '';
        }
    }
    
    // Son heceyi ekle
    if (currentSyllable) {
        syllables.push(currentSyllable);
    }
    
    // Boş heceleri temizle
    const filteredSyllables = syllables.filter(syl => syl.trim().length > 0);
    
    // İlk harfi büyük yap, diğerlerini küçük bırak
    return filteredSyllables.map((syl, index) => {
        if (index === 0) {
            return toTurkishUpperCase(syl);
        }
        return syl.toLowerCase();
    });
}

// Rastgele kelime havuzu - Sadece Türkçe kelimeler
const randomWordPool = [
    // Meyveler
    'elma', 'armut', 'muz', 'üzüm', 'portakal', 'çilek', 'kiraz', 'şeftali', 
    'kavun', 'karpuz', 'ayva', 'nar', 'incir', 'erik', 'kayısı', 'limon',
    
    // Hayvanlar
    'kedi', 'köpek', 'kuş', 'balık', 'tavşan', 'aslan', 'fil', 'kaplan',
    'kartal', 'güvercin', 'koyun', 'keçi', 'inek', 'at', 'eşek', 'karınca',
    'ayı', 'kurt', 'tilki', 'fare', 'hamster', 'papağan', 'balina', 'yunus',
    
    // Ev eşyaları
    'ev', 'masa', 'sandalye', 'yatak', 'dolap', 'kapı', 'pencere', 'lamba',
    'halı', 'yastık', 'battaniye', 'ayna', 'saat', 'telefon', 'televizyon',
    
    // Okul malzemeleri
    'kalem', 'silgi', 'defter', 'çanta', 'tahta', 'kitap', 'boyama', 'makas',
    'yapıştırıcı', 'cetvel', 'pergel', 'hesap', 'ödev', 'sınıf', 'öğretmen',
    
    // Ulaşım araçları
    'araba', 'otobüs', 'tren', 'gemi', 'uçak', 'bisiklet', 'motosiklet',
    'kamyon', 'taksi', 'minibüs', 'tramvay', 'metro', 'helikopter',
    
    // Doğa
    'güneş', 'ay', 'yıldız', 'bulut', 'yağmur', 'kar', 'rüzgar', 'deniz',
    'dağ', 'orman', 'göl', 'nehir', 'çay', 'ada', 'kum', 'taş',
    
    // Bitkiler
    'çiçek', 'ağaç', 'yaprak', 'dal', 'kök', 'gül', 'papatya', 'lale',
    'karanfil', 'menekşe', 'çam', 'meşe', 'kavak', 'çınar', 'fidan',
    
    // Oyunlar ve eğlence
    'oyun', 'top', 'bebek', 'oyuncak', 'saklambaç', 'koşmaca', 'bilmece',
    'masal', 'hikaye', 'şarkı', 'türkü', 'dans', 'oyun', 'eğlence',
    
    // Müzik aletleri
    'piyano', 'gitar', 'flüt', 'davul', 'keman', 'bağlama', 'kaval',
    'zurna', 'tambur', 'saz', 'nota', 'müzik', 'melodi', 'ritim',
    
    // Yiyecek ve içecek
    'ekmek', 'su', 'süt', 'peynir', 'yoğurt', 'bal', 'reçel', 'tereyağı',
    'çorba', 'pilav', 'makarna', 'salata', 'meyve', 'sebze', 'et', 'tavuk',
    
    // Renkler
    'kırmızı', 'mavi', 'yeşil', 'sarı', 'mor', 'turuncu', 'beyaz', 'siyah',
    'pembe', 'kahverengi', 'gri', 'lacivert', 'altın', 'gümüş',
    
    // Sayılar
    'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz', 'on',
    
    // Aile
    'anne', 'baba', 'kardeş', 'dede', 'nine', 'teyze', 'amca', 'hala', 'dayı',
    'kuzen', 'yeğen', 'torun', 'aile', 'akraba',
    
    // Vücut
    'baş', 'saç', 'göz', 'kulak', 'burun', 'ağız', 'diş', 'dil', 'boyun',
    'kol', 'el', 'parmak', 'bacak', 'ayak', 'kalp', 'mide',
    
    // Duygular
    'mutlu', 'üzgün', 'kızgın', 'şaşkın', 'korkmuş', 'sevinçli', 'heyecanlı',
    'sakin', 'yorgun', 'aç', 'tok', 'susuz', 'hasta', 'sağlıklı'
];

// Türkçe kelime uygunluk kontrolü
function isValidTurkishWord(word) {
    const cleanWord = word.trim().toLowerCase();
    
    // Boş kelime kontrolü
    if (!cleanWord || cleanWord.length < 2) {
        return { valid: false, reason: 'Kelime çok kısa (en az 2 harf olmalı)' };
    }
    
    // Türkçe karakterler
    const turkishChars = /^[a-züçğıöşabcdefghijklmnopqrstuvwxyz\s]+$/i;
    if (!turkishChars.test(cleanWord)) {
        return { valid: false, reason: 'Sadece Türkçe harfler kullanın' };
    }
    
    // Yasaklı/uygunsuz kelimeler listesi
    const inappropriateWords = [
        // Cinsel içerikli kelimeler
        'sik', 'sık', 'sex', 'seks', 'am', 'amcık', 'amcik', 'göt', 'meme', 'penis', 'vajina',
        'taşak', 'taşşak', 'yarrak', 'yarrağ', 'sül', 'döl', 'sikim', 'sikik', 'sikiş', 'sikis',
        'gotten', 'götün', 'göte', 'amın', 'ama', 'amı', 'memek', 'memen', 'memesi',
        
        // Küfür kelimeleri
        'oç', 'oc', 'piç', 'pic', 'ibne', 'gay', 'lezbiyen', 'fahişe', 'fahise',
        'orospu', 'orospı', 'kaltak', 'sürtük', 'surtuk', 'pezevenk', 'gavat',
        'züppe', 'zıkkım', 'kerhaneci', 'pimp',
        
        // Argo ve kaba kelimeler
        'aptal', 'salak', 'gerizekalı', 'mal', 'ahmak', 'budala', 'dangalak',
        'bok', 'kaka', 'çiş', 'cis', 'pislik', 'leş', 'les', 'çürük',
        'iğrenç', 'kusma', 'kustu', 'kustum', 'osuruk', 'gaz', 'geğirme',
        
        // Hassas olabilecek kelimeler
        'lanet', 'kahretsin', 'cehennem', 'şeytan', 'allah', 'tanrı',
        'din', 'peygamber', 'namaz', 'oruç', 'hac', 'zakat',
        
        // Anlamsız kısa kelimeler
        'ah', 'oh', 'uh', 'eh', 'ih', 'hıh', 'hah', 'heh', 'hih',
        'lan', 'ulan', 'moruk', 'aga', 'reis', 'kanka',
        
        // Şiddet içerikli
        'öldür', 'öl', 'gebertmek', 'gebersin', 'kes', 'doğra',
        'vur', 'vurmak', 'dayak', 'dövmek', 'saldır', 'kavga'
    ];
    
    if (inappropriateWords.includes(cleanWord)) {
        return { valid: false, reason: 'Bu kelime uygun değil' };
    }
    
    // Çok uzun kelime kontrolü
    if (cleanWord.length > 20) {
        return { valid: false, reason: 'Kelime çok uzun (en fazla 20 harf)' };
    }
    
    // Sürekli aynı harf tekrarı kontrolü
    const repeatingPattern = /(.)\1{3,}/;
    if (repeatingPattern.test(cleanWord)) {
        return { valid: false, reason: 'Aynı harfin 4 kez üst üste tekrarı uygun değil' };
    }
    
    return { valid: true };
}

// Hece uygunluk kontrolü
function isValidTurkishSyllable(syllable) {
    const cleanSyllable = syllable.trim().toLowerCase();
    
    if (!cleanSyllable) {
        return { valid: false, reason: 'Boş hece' };
    }
    
    if (cleanSyllable.length > 8) {
        return { valid: false, reason: 'Hece çok uzun' };
    }
    
    // Türkçe karakterler kontrolü
    const turkishChars = /^[a-züçğıöşabcdefghijklmnopqrstuvwxyz]+$/i;
    if (!turkishChars.test(cleanSyllable)) {
        return { valid: false, reason: 'Hecede sadece Türkçe harfler olmalı' };
    }
    
    // Uygunsuz heceler listesi
    const inappropriateSyllables = [
        // Cinsel içerikli heceler
        'sik', 'sık', 'sex', 'seks', 'am', 'göt', 'meme', 'penis', 'vajina',
        'amcık', 'amcik', 'taşak', 'taşşak', 'yarrak', 'yarrağ', 'sül', 'döl',
        'sikim', 'sikik', 'gotten', 'götün', 'göte', 'amın', 'ama', 'amı',
        'memek', 'memen', 'memesi', 'siki', 'sikti', 'sikis', 'sikiş',
        
        // Küfür heceleri
        'oç', 'oc', 'piç', 'pic', 'ibne', 'top', 'gay', 'lezbiyen',
        'fahişe', 'fahise', 'orospı', 'orospu', 'kaltak', 'sürtük', 'surtuk',
        'pezevenk', 'pimp', 'kerhaneci', 'gavat', 'züppe', 'zıkkım',
        
        // Argo ve kaba heceler
        'bok', 'kaka', 'çiş', 'cis', 'işe', 'pislik', 'pis', 'leş', 'les',
        'çürük', 'kötü', 'iğrenç', 'mide', 'kusma', 'kustu', 'kustum',
        
        // Anlamsız kaba sesler
        'pırt', 'pirt', 'osur', 'gaz', 'geğir', 'gegir', 'tükür', 'tukur',
        'hırr', 'grrr', 'öfff', 'puff', 'ıyyy', 'iyy', 'ekşi',
        
        // Diğer uygunsuz terimler
        'salak', 'aptal', 'mal', 'geri', 'ahmak', 'budala', 'dangalak',
        'lanet', 'şeytan', 'cehennem', 'kahret', 'lan', 'ulan', 'moruk',
        
        // Kısa anlamsız sesler
        'hıh', 'hah', 'heh', 'hih', 'hooo', 'haaa', 'heee', 'hiiii'
    ];
    
    if (inappropriateSyllables.includes(cleanSyllable)) {
        return { valid: false, reason: 'Bu hece çocuklar için uygun değil' };
    }
    
    // Kısmi eşleşme kontrolü (uygunsuz kelime parçaları)
    const partialMatches = ['sik', 'am', 'göt', 'meme', 'bok', 'piç', 'oç'];
    for (let inappropriate of partialMatches) {
        if (cleanSyllable.includes(inappropriate) && cleanSyllable.length <= inappropriate.length + 2) {
            return { valid: false, reason: 'Bu hece çocuklar için uygun değil' };
        }
    }
    
    return { valid: true };
}

// Kelime ve hecelerini kontrol et - uygunsuz varsa değiştir
function validateAndFixWord(wordObj) {
    const word = wordObj.word;
    
    // Kelime kontrolü
    const wordValidation = isValidTurkishWord(word);
    if (!wordValidation.valid) {
        console.warn(`⚠️ Uygunsuz kelime tespit edildi ve değiştirildi: ${word}`);
        return null; // Bu kelimeyi kullanma
    }
    
    // Her heceyi kontrol et
    for (let syllable of wordObj.syllables) {
        const syllableValidation = isValidTurkishSyllable(syllable.text);
        if (!syllableValidation.valid) {
            console.warn(`⚠️ Uygunsuz hece tespit edildi, kelime değiştirildi: ${word}`);
            return null; // Bu kelimeyi kullanma
        }
    }
    
    return wordObj; // Kelime güvenli
}

// Güvenli rastgele kelime seç
function getRandomSafeWord() {
    const maxAttempts = 50; // Sonsuz döngüyü önle
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * randomWordPool.length);
        const selectedWord = randomWordPool[randomIndex];
        
        // Kelime kontrolü
        const wordValidation = isValidTurkishWord(selectedWord);
        if (!wordValidation.valid) {
            attempts++;
            continue;
        }
        
        // Heceleri oluştur
        const syllables = automaticSyllableBreak(selectedWord);
        
        // Her heceyi kontrol et
        let allSyllablesValid = true;
        for (let syllable of syllables) {
            const syllableValidation = isValidTurkishSyllable(syllable);
            if (!syllableValidation.valid) {
                allSyllablesValid = false;
                break;
            }
        }
        
        if (allSyllablesValid) {
            // Güvenli kelime bulundu
            const syllableArray = syllables.map((syl, index) => ({
                text: syl,
                color: index % 2 === 0 ? 'red' : 'blue'
            }));

            return {
                word: toTurkishUpperCase(selectedWord),
                syllables: syllableArray,
                dateAdded: new Date().toISOString(),
                isRandom: true
            };
        }
        
        attempts++;
    }
    
    // Güvenli kelime bulunamadı, varsayılan güvenli kelimelerden birini kullan
    const safeDefaults = ['elma', 'kitap', 'güneş', 'çiçek', 'kuş'];
    const safeWord = safeDefaults[Math.floor(Math.random() * safeDefaults.length)];
    const syllables = automaticSyllableBreak(safeWord);
    const syllableArray = syllables.map((syl, index) => ({
        text: syl,
        color: index % 2 === 0 ? 'red' : 'blue'
    }));

    return {
        word: toTurkishUpperCase(safeWord),
        syllables: syllableArray,
        dateAdded: new Date().toISOString(),
        isRandom: true,
        isSafeDefault: true
    };
}

// Mevcut kelimeleri denetle ve temizle
function validateCurrentWords() {
    const originalCount = currentWords.length;
    currentWords = currentWords.filter(wordObj => {
        const validated = validateAndFixWord(wordObj);
        return validated !== null;
    });
    
    const removedCount = originalCount - currentWords.length;
    if (removedCount > 0) {
        console.log(`🛡️ ${removedCount} uygunsuz kelime tespit edildi ve kaldırıldı`);
        
        // Kaldırılan kelimeler yerine güvenli kelimeler ekle
        for (let i = 0; i < removedCount; i++) {
            const safeWord = getRandomSafeWord();
            currentWords.push(safeWord);
        }
        
        // Güncellemeleri kaydet
        saveWordsToStorage();
        renderWords();
        updateCurrentWordsList();
    }
}

// Rastgele kelime oluştur fonksiyonu
function generateRandomWords(askConfirmation = true) {
    if (askConfirmation && !confirm('🎲 Mevcut kelimeler temizlenip 10 yeni rastgele kelime eklenecek. Devam etmek istiyor musunuz?')) {
        return;
    }

    // Önce mevcut kelimeleri temizle
    currentWords = [];
    
    let addedCount = 0;
    const addedWords = [];

    // 10 güvenli kelime ekle
    for (let i = 0; i < 10; i++) {
        const safeWord = getRandomSafeWord();
        
        currentWords.push(safeWord);
        addedWords.push(safeWord.word);
        addedCount++;
    }

    // Kaydet ve güncelle
    saveWordsToStorage();
    renderWords();
    updateCurrentWordsList();

    // Başarı mesajı göster
    const message = `✅ ${addedCount} rastgele kelime eklendi:\n${addedWords.join(', ')}`;
    
    // Kısa bildirim göster
    showNotification(`🎲 ${addedCount} rastgele kelime eklendi!`, 'notification');
    console.log(message);
}

// Eğlenceli yenileme fonksiyonu - Rastgele kelimeler oluştur
function funRefresh() {
    // Buton animasyonunu başlat
    funRefreshBtn.classList.add('animate-bounce');
    funRefreshBtn.textContent = '🎭 Hazırlanıyor...';
    funRefreshBtn.disabled = true;
    
    // Önce mevcut kelimeleri temizle ve rastgele yenilerini oluştur (sessizce)
    generateRandomWords(false);
    
    // Renkli geçiş efekti
    const colors = [
        'from-red-500 to-yellow-600',
        'from-blue-500 to-green-600', 
        'from-purple-500 to-pink-600',
        'from-indigo-500 to-purple-600',
        'from-green-500 to-blue-600'
    ];
    
    let colorIndex = 0;
    const colorInterval = setInterval(() => {
        funRefreshBtn.className = funRefreshBtn.className.replace(/from-\w+-\d+\s+to-\w+-\d+/, colors[colorIndex]);
        colorIndex = (colorIndex + 1) % colors.length;
    }, 200);

    // Kartları yavaşça kaybet efekti
    const cards = document.querySelectorAll('#words-container > div');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.transform = 'scale(0.8) rotate(10deg)';
            card.style.opacity = '0.3';
        }, index * 100);
    });

    // 2 saniye sonra yenileme işlemini yap
    setTimeout(() => {
        clearInterval(colorInterval);
        
        // Kelimeleri yeniden render et
        renderWords();
        
        // Yeni kartları yavaşça göster
        setTimeout(() => {
            const newCards = document.querySelectorAll('#words-container > div');
            newCards.forEach((card, index) => {
                card.style.transform = 'scale(0.5)';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease-out';
                    card.style.transform = 'scale(1)';
                    card.style.opacity = '1';
                }, index * 150);
            });
        }, 100);
        
        // Butonu eski haline getir
        setTimeout(() => {
            funRefreshBtn.classList.remove('animate-bounce');
            funRefreshBtn.textContent = '🎭 Yeni Kelimeler Getir! 🎨';
            funRefreshBtn.disabled = false;
            funRefreshBtn.className = 'fun-refresh-btn';
            
            // Başarı mesajı göster
            showNotification('✨ Kelimeler yenilendi! ✨', 'notification-center');
        }, 1000);
        
    }, 2000);
}

// Bildirim göster
function showNotification(message, className = 'notification') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = className;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            if (className === 'notification-center') {
                notification.style.transition = 'all 0.5s ease-out';
                notification.style.transform = 'translate(-50%, -100px) scale(0.5)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.parentNode.removeChild(notification);
                }, 500);
            } else {
                notification.parentNode.removeChild(notification);
            }
        }
    }, className === 'notification-center' ? 2000 : 3000);
}

// Gelişmiş kelime yönetimi fonksiyonları
function loadWordsFromStorage() {
    try {
        const stored = localStorage.getItem('turkishWords');
        if (stored && stored.trim() !== '') {
            const parsedWords = JSON.parse(stored);
            if (Array.isArray(parsedWords) && parsedWords.length > 0) {
                currentWords = parsedWords;
                console.log(`✅ ${currentWords.length} kelime localStorage'dan yüklendi`);
                
                // Yüklenen kelimeleri denetle ve temizle
                validateCurrentWords();
                return;
            }
        }
    } catch (e) {
        console.warn('⚠️ localStorage okuma hatası:', e);
    }
    
    // Varsayılan kelimeleri yükle
    currentWords = [...defaultWords];
    saveWordsToStorage(); // İlk kez varsayılanları kaydet
    console.log('📝 Varsayılan kelimeler yüklendi ve kaydedildi');
    
    // Varsayılan kelimeleri de denetle
    validateCurrentWords();
}

function saveWordsToStorage() {
    try {
        const dataToSave = JSON.stringify(currentWords);
        localStorage.setItem('turkishWords', dataToSave);
        localStorage.setItem('turkishWords_backup', dataToSave); // Yedek kopya
        localStorage.setItem('turkishWords_timestamp', new Date().toISOString());
        console.log(`💾 ${currentWords.length} kelime kaydedildi`);
        
        // Kayıt başarı mesajı göster
        showNotification('✅ Kaydedildi', 'notification-success');
    } catch (e) {
        console.error('❌ localStorage kayıt hatası:', e);
        alert('Kelimeler kaydedilemedi! Tarayıcı depolama alanı dolu olabilir.');
    }
}

function addNewWord(word, syllables) {
    if (!word.trim() || !syllables.trim()) {
        alert('Lütfen kelime ve hecelerini girin!');
        return false;
    }

    // Kelime uygunluk kontrolü
    const wordValidation = isValidTurkishWord(word.trim());
    if (!wordValidation.valid) {
        alert(`❌ ${wordValidation.reason}`);
        return false;
    }

    // Aynı kelime var mı kontrol et
    const existingWord = currentWords.find(w => w.word.toLowerCase() === word.trim().toLowerCase());
    if (existingWord) {
        if (!confirm(`"${word.trim()}" kelimesi zaten var. Yine de eklemek istiyor musunuz?`)) {
            return false;
        }
    }

    // Heceleri ayır ve kontrol et
    const syllableTexts = syllables.split(',').map(syl => syl.trim()).filter(syl => syl !== '');
    
    // Her heceyi kontrol et
    for (let i = 0; i < syllableTexts.length; i++) {
        const syllableValidation = isValidTurkishSyllable(syllableTexts[i]);
        if (!syllableValidation.valid) {
            alert(`❌ ${syllableValidation.reason}`);
            return false;
        }
    }

    const syllableArray = syllableTexts.map((syl, index) => ({
        text: syl,
        color: index % 2 === 0 ? 'red' : 'blue'
    }));

    if (syllableArray.length === 0) {
        alert('Geçerli heceler girin!');
        return false;
    }

    const newWord = {
        word: word.trim(),
        syllables: syllableArray,
        dateAdded: new Date().toISOString()
    };

    currentWords.push(newWord);
    saveWordsToStorage(); // Otomatik kayıt
    renderWords();
    updateCurrentWordsList();
    
    // Input'ları temizle
    wordInput.value = '';
    syllablesInput.value = '';
    
    console.log(`➕ Yeni kelime eklendi: ${newWord.word}`);
    return true;
}

function resetToDefaultWords() {
    currentWords = [...defaultWords];
    saveWordsToStorage();
    renderWords();
    updateCurrentWordsList();
}

function clearAllWords() {
    if (confirm('Tüm kelimeleri silmek istediğinizden emin misiniz?')) {
        currentWords = [];
        saveWordsToStorage();
        renderWords();
        updateCurrentWordsList();
    }
}

function deleteWord(index) {
    if (confirm('Bu kelimeyi silmek istediğinizden emin misiniz?')) {
        currentWords.splice(index, 1);
        saveWordsToStorage();
        renderWords();
        updateCurrentWordsList();
    }
}

function updateCurrentWordsList() {
    currentWordsList.innerHTML = '';
    
    // Kelime sayısını güncelle
    wordCount.textContent = `${currentWords.length} kelime`;
    
    if (currentWords.length === 0) {
        currentWordsList.innerHTML = '<p class="text-gray-500 text-sm">Henüz kelime yok. Yukarıdan kelime ekleyin.</p>';
        return;
    }

    currentWords.forEach((wordData, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        const wordText = document.createElement('span');
        wordText.textContent = `${wordData.word} (${wordData.syllables.map(s => s.text).join('-')})`;
        wordText.className = 'word-text';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.className = 'delete-btn';
        deleteBtn.title = 'Bu kelimeyi sil';
        deleteBtn.onclick = () => deleteWord(index);
        
        wordItem.appendChild(wordText);
        wordItem.appendChild(deleteBtn);
        currentWordsList.appendChild(wordItem);
    });
}

// Kayıt durumunu kontrol et
function checkStorageStatus() {
    try {
        const testKey = 'storage_test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        
        const lastSave = localStorage.getItem('turkishWords_timestamp');
        if (lastSave) {
            const saveDate = new Date(lastSave);
            storageStatus.textContent = `💾 Son kayıt: ${saveDate.toLocaleString('tr-TR')}`;
            storageStatus.style.color = '#10b981';
        } else {
            storageStatus.textContent = '💾 Otomatik kayıt aktif';
            storageStatus.style.color = '#3b82f6';
        }
    } catch (e) {
        storageStatus.textContent = '⚠️ Kayıt sorunu: localStorage kullanılamıyor';
        storageStatus.style.color = '#ef4444';
    }
}

// Kelime kartlarını oluştur
function renderWords() {
    if (!wordsContainer) {
        console.error('❌ wordsContainer bulunamadı!');
        return;
    }
    
    wordsContainer.innerHTML = '';

    currentWords.forEach((wordData, index) => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';

        wordData.syllables.forEach(syllable => {
            const syllableSpan = document.createElement('span');
            syllableSpan.textContent = syllable.text;
            syllableSpan.dataset.text = syllable.text;
            
            const colorClass = syllable.color === 'red' ? 'syllable-red' : 'syllable-blue';
            
            syllableSpan.className = `syllable ${colorClass}`;
            
            wordCard.appendChild(syllableSpan);
        });

        wordsContainer.appendChild(wordCard);
    });
}

// Basit ses yükleme fonksiyonu
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
        voiceStatus.textContent = `📢 Sesler yükleniyor... (Deneme ${voiceLoadAttempts + 1})`;
        voiceStatus.style.color = '#f59e0b';
        return false;
    }

    allVoices = voices;
    voiceSelect.innerHTML = '';
    
    // Türkçe sesleri önce ekle
    const turkishVoices = voices
        .filter(voice => voice.lang.startsWith('tr'))
        .sort((a, b) => {
            // Emel ve Zira önce gelsin
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (aName.includes('emel')) return -1;
            if (bName.includes('emel')) return 1;
            if (aName.includes('zira')) return -1;
            if (bName.includes('zira')) return 1;
            return 0;
        });
    
    const otherVoices = voices.filter(voice => !voice.lang.startsWith('tr'));
    
    if (turkishVoices.length > 0) {
        const turkishGroup = document.createElement('optgroup');
        turkishGroup.label = '🇹🇷 Türkçe Sesler';
        
        turkishVoices.forEach((voice) => {
            const option = document.createElement('option');
            option.value = `${voice.name}|${voice.lang}`;
            let displayName = voice.name;
            
            // Özel isimlendirme
            if (voice.name.toLowerCase().includes('emel')) {
                displayName += ' ⭐ ÖNERİLEN';
            } else if (voice.name.toLowerCase().includes('zira')) {
                displayName += ' 🌟 KALİTELİ';
            }
            
            option.textContent = displayName;
            turkishGroup.appendChild(option);
        });
        voiceSelect.appendChild(turkishGroup);
        
        // İlk Türkçe sesi seç
        selectedVoice = turkishVoices[0];
        voiceSelect.value = `${turkishVoices[0].name}|${turkishVoices[0].lang}`;
    }
    
    if (otherVoices.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = '🌍 Diğer Diller';
        
        otherVoices.forEach((voice) => {
            const option = document.createElement('option');
            option.value = `${voice.name}|${voice.lang}`;
            option.textContent = `${voice.name} (${voice.lang})`;
            otherGroup.appendChild(option);
        });
        voiceSelect.appendChild(otherGroup);
    }
    
    // Durum güncellemesi
    const turkishCount = turkishVoices.length;
    const totalCount = voices.length;
    voiceStatus.textContent = `✅ ${totalCount} ses yüklendi (${turkishCount} Türkçe)`;
    voiceStatus.style.color = '#10b981';
    
    return true;
}

// Ses yükleme deneme fonksiyonu
function tryLoadVoices() {
    voiceLoadAttempts++;
    
    if (loadVoices()) {
        // Başarılı
        return;
    }
    
    // Başarısız, tekrar dene
    if (voiceLoadAttempts < 10) {
        setTimeout(tryLoadVoices, 500);
    } else {
        voiceStatus.textContent = '❌ Sesler yüklenemedi - Lütfen "Sesleri Yenile" butonunu deneyin';
        voiceStatus.style.color = '#ef4444';
    }
}

function playSyllable(text) {
    // Mevcut konuşmayı durdur
    speechSynthesis.cancel();

    if (!selectedVoice) {
        voiceStatus.textContent = '⚠️ Lütfen bir ses seçin';
        voiceStatus.style.color = '#ef4444';
        return;
    }

    // Türkçe telaffuz düzeltmeleri
    let correctedText = text;
    if (selectedVoice.lang && selectedVoice.lang.startsWith('tr')) {
        // Gelişmiş Türkçe telaffuz düzeltmeleri
        const syllableCorrections = {
            // E harfi ile biten heceler - açık telaffuz için
            'Me': 'Mee',      // "Me" -> "Mee" (uzun e sesi)
            'me': 'mee',      
            'De': 'Dee',      
            'de': 'dee',      
            'Ne': 'Nee',      
            'ne': 'nee',      
            'Se': 'See',      
            'se': 'see',      
            'Te': 'Tee',      
            'te': 'tee',      
            'Le': 'Lee',      
            'le': 'lee',      
            'Ke': 'Kee',      
            'ke': 'kee',      
            'Re': 'Ree',      
            're': 'ree',
            'Be': 'Bee',
            'be': 'bee',
            'Fe': 'Fee',
            'fe': 'fee',
            'Ge': 'Gee',
            'ge': 'gee',
            'He': 'Hee',
            'he': 'hee',
            'Je': 'Jee',
            'je': 'jee',
            'Ve': 'Vee',
            've': 'vee',
            'Ze': 'Zee',
            'ze': 'zee',
            
            // Diğer problemli telaffuzlar
            'E': 'Eee',       // Tek "E" harfi
            'e': 'eee'        // küçük harf
        };
        
        // Önce özel düzeltmeleri uygula
        correctedText = text;
        for (const [wrong, correct] of Object.entries(syllableCorrections)) {
            if (correctedText === wrong) {
                correctedText = correct;
                console.log(`🔧 Telaffuz düzeltmesi: "${wrong}" -> "${correct}"`);
                break;
            }
        }
        
        // Sonra genel Türkçe karakter düzeltmeleri
        correctedText = correctedText
            .replace(/ğ/g, 'ğ')
            .replace(/ş/g, 'ş')
            .replace(/ç/g, 'ç')
            .replace(/ı/g, 'ı')
            .replace(/ö/g, 'ö')
            .replace(/ü/g, 'ü');
    }

    const utterance = new SpeechSynthesisUtterance(correctedText);
    
    // Ses ayarları - Türkçe telaffuz için optimize edilmiş
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang || 'tr-TR';
    utterance.rate = speechRate * 0.9; // Biraz daha yavaş telaffuz
    utterance.pitch = selectedVoice.lang && selectedVoice.lang.startsWith('tr') ? 1.1 : 1.1; // Biraz daha yüksek ton
    utterance.volume = 0.9;
    
    // Hata yakalama
            utterance.onerror = (event) => {
                console.warn('⚠️ Ses çalma hatası (normal):', event.error);
                if (voiceStatus) {
                    voiceStatus.textContent = '⚠️ Ses hazırlanıyor...';
                    voiceStatus.style.color = '#f59e0b';
                }
            };    utterance.onstart = () => {
        voiceStatus.textContent = '🔊 Ses çalınıyor...';
        voiceStatus.style.color = '#3b82f6';
    };
    
    utterance.onend = () => {
        voiceStatus.textContent = `✅ ${allVoices.length} ses hazır`;
        voiceStatus.style.color = '#10b981';
    };
    
    speechSynthesis.speak(utterance);
}