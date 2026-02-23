import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Supported languages (order determines fallbacks)
export const LANGUAGES = {
  hr: { label: 'Hrvatski', flag: '🇭🇷' },
  en: { label: 'English', flag: '🇬🇧' },
  de: { label: 'Deutsch', flag: '🇩🇪' },
  it: { label: 'Italiano', flag: '🇮🇹' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Translation dictionaries
const translations = {
  hr: {
    // Navigation
    app_title: 'EcoMuseumAR',
    home: 'Početna',
    camera: 'Kamera',
    explore: 'Istraži',
    profile: 'Profil',
    settings: 'Postavke',

    // Auth
    login: 'Prijava',
    logout: 'Odjava',
    register: 'Registracija',
    email: 'E-mail',
    password: 'Lozinka',
    confirm_password: 'Potvrdi lozinku',
    name: 'Ime',
    forgot_password: 'Zaboravio sam lozinku',

    // AR Features
    ar_camera: 'AR Kamera',
    add_content: 'Dodaj sadržaj',
    place_marker: 'Postavi marker',
    place_object: 'Postavi objekt',
    place_text: 'Postavi tekst',
    record_audio: 'Snimi audio',
    nearby_content: 'Blizak sadržaj',
    my_content: 'Moj sadržaj',

    // Content Types
    marker: 'Marker',
    object_3d: '3D Objekt',
    text_overlay: 'Tekstualni overlay',
    audio_annotation: 'Audio bilješka',
    virtual_tour: 'Virtualni turizam',
    info_display: 'Informacijski zaslon',

    // Actions
    save: 'Spremi',
    cancel: 'Odustani',
    delete: 'Izbriši',
    edit: 'Uredi',
    share: 'Podijeli',
    sync: 'Sinkroniziraj',
    search: 'Pretraži',

    // Messages
    loading: 'Učitavanje...',
    no_content: 'Nema sadržaja',
    offline_mode: 'Izvan mreže',
    location_required: 'Pristup lokaciji potreban',
    camera_required: 'Pristup kameri potrebna',

    // Errors
    network_error: 'Greška u mreži',
    auth_error: 'Greška u autentifikaciji',
    permission_denied: 'Dozvola uskraćena',
    not_found: 'Nije pronađeno',
  },

  en: {
    app_title: 'EcoMuseumAR',
    home: 'Home',
    camera: 'Camera',
    explore: 'Explore',
    profile: 'Profile',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    name: 'Name',
    forgot_password: 'Forgot Password',
    ar_camera: 'AR Camera',
    add_content: 'Add Content',
    place_marker: 'Place Marker',
    place_object: 'Place Object',
    place_text: 'Place Text',
    record_audio: 'Record Audio',
    nearby_content: 'Nearby Content',
    my_content: 'My Content',
    marker: 'Marker',
    object_3d: '3D Object',
    text_overlay: 'Text Overlay',
    audio_annotation: 'Audio Annotation',
    virtual_tour: 'Virtual Tour',
    info_display: 'Info Display',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    sync: 'Sync',
    search: 'Search',
    loading: 'Loading...',
    no_content: 'No content',
    offline_mode: 'Offline mode',
    location_required: 'Location access required',
    camera_required: 'Camera access required',
    network_error: 'Network error',
    auth_error: 'Authentication error',
    permission_denied: 'Permission denied',
    not_found: 'Not found',
  },

  de: {
    app_title: 'EcoMuseumAR',
    home: 'Startseite',
    camera: 'Kamera',
    explore: 'Erkunden',
    profile: 'Profil',
    settings: 'Einstellungen',
    login: 'Anmelden',
    logout: 'Abmelden',
    register: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    confirm_password: 'Passwort bestätigen',
    name: 'Name',
    forgot_password: 'Passwort vergessen',
    ar_camera: 'AR-Kamera',
    add_content: 'Inhalt hinzufügen',
    place_marker: 'Marker platzieren',
    place_object: 'Objekt platzieren',
    place_text: 'Text platzieren',
    record_audio: 'Audio aufnehmen',
    nearby_content: 'Naher Inhalt',
    my_content: 'Mein Inhalt',
    marker: 'Marker',
    object_3d: '3D-Objekt',
    text_overlay: 'Text-Overlay',
    audio_annotation: 'Audio-Annotation',
    virtual_tour: 'Virtuelle Tour',
    info_display: 'Info-Anzeige',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    share: 'Teilen',
    sync: 'Synchronisieren',
    search: 'Suchen',
    loading: 'Laden...',
    no_content: 'Kein Inhalt',
    offline_mode: 'Offline-Modus',
    location_required: 'Standortzugriff erforderlich',
    camera_required: 'Kamerazugriff erforderlich',
    network_error: 'Netzwerkfehler',
    auth_error: 'Authentifizierungsfehler',
    permission_denied: 'Berechtigung verweigert',
    not_found: 'Nicht gefunden',
  },

  it: {
    app_title: 'EcoMuseumAR',
    home: 'Home',
    camera: 'Fotocamera',
    explore: 'Esplora',
    profile: 'Profilo',
    settings: 'Impostazioni',
    login: 'Accesso',
    logout: 'Disconnetti',
    register: 'Registrati',
    email: 'Email',
    password: 'Password',
    confirm_password: 'Conferma password',
    name: 'Nome',
    forgot_password: 'Password dimenticata',
    ar_camera: 'Fotocamera AR',
    add_content: 'Aggiungi contenuto',
    place_marker: 'Posiziona marker',
    place_object: 'Posiziona oggetto',
    place_text: 'Posiziona testo',
    record_audio: 'Registra audio',
    nearby_content: 'Contenuto vicino',
    my_content: 'Il mio contenuto',
    marker: 'Marker',
    object_3d: 'Oggetto 3D',
    text_overlay: 'Sovrapposizione testo',
    audio_annotation: 'Annotazione audio',
    virtual_tour: 'Tour virtuale',
    info_display: 'Display informativo',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    share: 'Condividi',
    sync: 'Sincronizza',
    search: 'Cerca',
    loading: 'Caricamento...',
    no_content: 'Nessun contenuto',
    offline_mode: 'Modalità offline',
    location_required: 'Accesso alla posizione richiesto',
    camera_required: 'Accesso alla fotocamera richiesto',
    network_error: 'Errore di rete',
    auth_error: 'Errore di autenticazione',
    permission_denied: 'Autorizzazione negata',
    not_found: 'Non trovato',
  },
};

const i18n = new I18n(translations);

// Set fallback to English
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Get device locale and map to supported language
const getDeviceLocale = (): LanguageCode => {
  const deviceLocale = Localization.locale;

  // Extract language code (first 2 characters)
  const languageCode = deviceLocale.split('-')[] as LanguageCode;

  // Return supported language or fallback to English
  return LANGUAGES[languageCode] ? languageCode : 'en';
};

// Initialize with device locale
i18n.locale = getDeviceLocale();

export default i18n;

// Utility functions
export const changeLanguage = (locale: LanguageCode) => {
  if (LANGUAGES[locale]) {
    i18n.locale = locale;
  }
};

export const getCurrentLanguage = (): LanguageCode => {
  return i18n.locale as LanguageCode;
};

export const isRTL = (): boolean => {
  // Add RTL language support if needed (e.g., Arabic, Hebrew)
  return false;
};

// Type-safe translation function
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

// Format date with localization
export const formatDate = (date: Date): string => {
  // This could be enhanced with proper date localization
  return date.toLocaleDateString(getCurrentLanguage());
};

// Format number with localization
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat(getCurrentLanguage()).format(num);
};