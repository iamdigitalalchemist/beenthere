"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "de";

export const translations = {
  en: {
    joinAsGuest: "Join as a guest",
    welcomeBack: "Welcome back",
    yourGuestProfile: "Your guest profile",
    subtitleSignup: "Add how you want to appear in this gallery before uploading or tagging.",
    subtitleCode: "Enter the guest code you saved when you first joined.",
    subtitleProfile: "Update how you appear in this gallery.",
    newGuest: "New guest",
    guestCode: "Guest code",
    guestCodeLabel: "Guest code",
    continueWithCode: "Continue with guest code",
    orPickName: "Or pick your name from the guest list",
    hideGuestList: "Hide guest list",
    noGuestsYet: "No guest profiles yet. Join as a new guest instead.",
    continueAsSelected: "Continue as selected guest",
    profilePhoto: "Profile photo",
    profilePhotoHint: "Optional. We'll use your initials if you skip this.",
    removePhoto: "Remove photo",
    displayName: "Display name",
    displayNamePlaceholder: "Aunt Lisa, Tom, Amira...",
    socialAccounts: "Social accounts",
    socialHint: "Optional. Saved for future sharing and auto-tagging features.",
    consentText: "I confirm I have the right to share these photos and understand they'll be visible according to this event's settings.",
    continue: "Continue",
    saveChanges: "Save changes",
    acceptConsent: "Accept the consent above to continue.",
    logOut: "Log out",
    needGuestCode: "Need your guest code?",
    needGuestCodeHint: "Create a new code to return on another phone. Your old code will stop working.",
    createGuestCode: "Create guest code",
    creatingGuestCode: "Creating guest code...",
    openingProfile: "Opening profile...",
    openGuestProfile: "Open guest profile",
    joinAsGuestAria: "Join as a guest",
    filterAll: "All",
    filterMine: "Mine",
    filterSaved: "Saved",
    selectAll: "Select all",
    cancel: "Cancel",
    select: "Select",
    selected: "selected",
    like: "like",
    likes: "likes",
    downloading: "Downloading…",
    download: "Download",
    report: "Report",
    reportThisPhoto: "Report this photo",
    reportHiddenHint: "It will be hidden from the gallery until the host reviews it.",
    reportPlaceholder: "Why are you reporting this? (optional)",
    reportError: "Could not send the report. Please try again.",
    reporting: "Reporting…",
    reportPhoto: "Report photo",
    reportSent: "Thanks — the photo was reported and hidden until the host reviews it.",
    tagged: "Tagged",
    tagSomeone: "Tag someone",
    noOneTagged: "No one tagged yet. Add guests who appear in this photo.",
    joinToTag: "Join as a guest to tag people in photos.",
    addYourName: "Add your name",
    loadingGuests: "Loading guests…",
    noOtherGuests: "No other guests have joined yet. Friends need to scan the QR code and add their name first.",
    everyoneTagged: "Everyone else from this event is already tagged.",
    saving: "Saving…",
    related: "Related",
  },
  de: {
    joinAsGuest: "Als Gast beitreten",
    welcomeBack: "Willkommen zurück",
    yourGuestProfile: "Dein Gastprofil",
    subtitleSignup: "Lege fest, wie du in dieser Galerie erscheinen möchtest, bevor du Fotos hochlädst oder markierst.",
    subtitleCode: "Gib den Gastcode ein, den du beim ersten Beitritt gespeichert hast.",
    subtitleProfile: "Aktualisiere dein Erscheinungsbild in dieser Galerie.",
    newGuest: "Neuer Gast",
    guestCode: "Gastcode",
    guestCodeLabel: "Gastcode",
    continueWithCode: "Mit Gastcode fortfahren",
    orPickName: "Oder wähle deinen Namen aus der Gästeliste",
    hideGuestList: "Gästeliste ausblenden",
    noGuestsYet: "Noch keine Gastprofile. Trete als neuer Gast bei.",
    continueAsSelected: "Als ausgewählten Gast fortfahren",
    profilePhoto: "Profilfoto",
    profilePhotoHint: "Optional. Wir verwenden deine Initialen, falls du das überspringst.",
    removePhoto: "Foto entfernen",
    displayName: "Anzeigename",
    displayNamePlaceholder: "Tante Lisa, Tom, Amira...",
    socialAccounts: "Social-Media-Konten",
    socialHint: "Optional. Für zukünftige Freigabe- und Auto-Tagging-Funktionen gespeichert.",
    consentText: "Ich bestätige, dass ich das Recht habe, diese Fotos zu teilen, und bin damit einverstanden, dass sie gemäß den Einstellungen dieser Veranstaltung sichtbar sind.",
    continue: "Weiter",
    saveChanges: "Änderungen speichern",
    acceptConsent: "Bitte stimme der obigen Einwilligung zu, um fortzufahren.",
    logOut: "Abmelden",
    needGuestCode: "Brauchst du deinen Gastcode?",
    needGuestCodeHint: "Erstelle einen neuen Code, um auf einem anderen Telefon zurückzukehren. Dein alter Code funktioniert dann nicht mehr.",
    createGuestCode: "Gastcode erstellen",
    creatingGuestCode: "Gastcode wird erstellt...",
    openingProfile: "Profil wird geöffnet...",
    openGuestProfile: "Gastprofil öffnen",
    joinAsGuestAria: "Als Gast beitreten",
    filterAll: "Alle",
    filterMine: "Meine",
    filterSaved: "Gespeichert",
    selectAll: "Alle auswählen",
    cancel: "Abbrechen",
    select: "Auswählen",
    selected: "ausgewählt",
    like: "Gefällt mir",
    likes: "Gefällt mir",
    downloading: "Wird heruntergeladen…",
    download: "Herunterladen",
    report: "Melden",
    reportThisPhoto: "Dieses Foto melden",
    reportHiddenHint: "Es wird aus der Galerie ausgeblendet, bis der Gastgeber es überprüft.",
    reportPlaceholder: "Warum meldest du das? (optional)",
    reportError: "Der Bericht konnte nicht gesendet werden. Bitte versuche es erneut.",
    reporting: "Wird gemeldet…",
    reportPhoto: "Foto melden",
    reportSent: "Danke — das Foto wurde gemeldet und ausgeblendet, bis der Gastgeber es überprüft.",
    tagged: "Markiert",
    tagSomeone: "Jemanden markieren",
    noOneTagged: "Noch niemand markiert. Füge Gäste hinzu, die auf diesem Foto erscheinen.",
    joinToTag: "Tritt als Gast bei, um Personen auf Fotos zu markieren.",
    addYourName: "Namen hinzufügen",
    loadingGuests: "Gäste werden geladen…",
    noOtherGuests: "Noch keine anderen Gäste beigetreten. Freunde müssen den QR-Code scannen und zuerst ihren Namen hinzufügen.",
    everyoneTagged: "Alle anderen von dieser Veranstaltung sind bereits markiert.",
    saving: "Wird gespeichert…",
    related: "Ähnliche Fotos",
  },
} satisfies Record<Lang, Record<string, string>>;

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (typeof translations)["en"];
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

const STORAGE_KEY = "bt:lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "de") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`flex items-center gap-0.5 rounded-full p-0.5 ${className ?? ""}`} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.10)" }}>
      {(["en", "de"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          type="button"
          className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition active:scale-95"
          style={lang === l
            ? { background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", color: "#fff" }
            : { color: "rgba(255,255,255,.40)" }
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
