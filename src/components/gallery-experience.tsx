"use client";

import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { HeartIcon } from "@/components/gallery/heart-icon";
import { GuestRecoveryReveal } from "@/components/gallery/guest-recovery-reveal";
import { ViewSizeToggle, type ViewSize } from "@/components/view-size-toggle";
import {
  IdentitySheet,
  type GuestResumeCandidate,
} from "@/components/gallery/identity-sheet";
import { generateGuestRecoveryCode } from "@/lib/guest-recovery";
import { ParticipantAvatar } from "@/components/gallery/participant-avatar";
import { PhotoDetailView } from "@/components/gallery/photo-detail-view";
import {
  readStoredFavoriteIds,
  writeStoredFavoriteIds,
} from "@/lib/favorites-storage";
import {
  clearStoredParticipant,
  getStoredParticipant,
  lookupRecoveryCodeParticipantId,
  participantToStoredState,
  storeParticipant,
  storeRecoveryCodeMapping,
  type StoredParticipant,
} from "@/lib/participant-storage";
import { SegmentedControl } from "@/components/segmented-control";
import { LangProvider, LangToggle, useLang } from "@/lib/lang";
import { readJsonResponse } from "@/lib/read-json-response";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getInitials } from "@/lib/ui";
import type {
  EventParticipant,
  EventRecord,
  GuestSocialHandles,
  PhotoRecord,
  UploadReservation,
} from "@/types/domain";

const CONSENT_VERSION = "upload-consent-v1";
const MAX_BATCH_SIZE = 100;

type GalleryExperienceProps = {
  event: EventRecord;
  initialPhotos: PhotoRecord[];
  uploaderNames: Record<string, string>;
};

type Filter = "all" | "mine" | "saved";

const EMPTY_SOCIAL_HANDLES: GuestSocialHandles = {
  instagram: "",
  facebook: "",
  x: "",
  tiktok: "",
};

type ReservationResponse = {
  reservations?: UploadReservation[];
  skippedFiles?: Array<{ fileIndex: number; name: string; reason: string }>;
  error?: string;
};

type CompletionResponse = {
  photo?: PhotoRecord;
  error?: string;
};

type SessionResponse = {
  participant?: EventParticipant | null;
};

type PhotosResponse = {
  photos: PhotoRecord[];
  uploaderNames: Record<string, string>;
};

type FavoritesResponse = {
  photoIds?: string[];
  error?: string;
};

type ParticipantsResponse = {
  participants?: GuestResumeCandidate[];
  error?: string;
};

function applyParticipantToForm(
  nextParticipant: StoredParticipant,
  setters: {
    setParticipant: (value: StoredParticipant) => void;
    setDisplayName: (value: string) => void;
    setConsentAccepted: (value: boolean) => void;
    setSocialHandles: (value: GuestSocialHandles) => void;
    setProfilePhotoPreview: (value?: string) => void;
  },
) {
  setters.setParticipant(nextParticipant);
  setters.setDisplayName(nextParticipant.displayName);
  setters.setConsentAccepted(
    nextParticipant.consentVersion === CONSENT_VERSION,
  );
  setters.setSocialHandles({
    ...EMPTY_SOCIAL_HANDLES,
    ...nextParticipant.socialHandles,
  });
  setters.setProfilePhotoPreview(nextParticipant.profilePhotoUrl);
}

const FILTER_OPTIONS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "saved", label: "Saved" },
];

const GALLERY_ROW_HEIGHT_PX = 8;

const GALLERY_CONFIG: Record<ViewSize, { gapMobile: number; gapDesktop: number; colsMobile: number; colsTablet: number; colsDesktop: number; squareCrop: boolean }> = {
  compact:  { gapMobile: 4,  gapDesktop: 6,  colsMobile: 3, colsTablet: 4, colsDesktop: 5, squareCrop: true  },
  medium:   { gapMobile: 12, gapDesktop: 16, colsMobile: 2, colsTablet: 3, colsDesktop: 4, squareCrop: false },
  large:    { gapMobile: 8,  gapDesktop: 12, colsMobile: 1, colsTablet: 2, colsDesktop: 2, squareCrop: false },
};

function getGalleryColumnCount(containerWidth: number, size: ViewSize) {
  const cfg = GALLERY_CONFIG[size];
  if (containerWidth >= 1024) return cfg.colsDesktop;
  if (containerWidth >= 640)  return cfg.colsTablet;
  return cfg.colsMobile;
}

function getGalleryGap(containerWidth: number, size: ViewSize) {
  const cfg = GALLERY_CONFIG[size];
  return containerWidth >= 640 ? cfg.gapDesktop : cfg.gapMobile;
}

function getGalleryRowSpan(photo: PhotoRecord, containerWidth: number, size: ViewSize) {
  if (containerWidth <= 0) return 12;

  const cfg = GALLERY_CONFIG[size];
  if (cfg.squareCrop) return containerWidth >= 640 ? 12 : 8;

  const columns = getGalleryColumnCount(containerWidth, size);
  const gap = getGalleryGap(containerWidth, size);
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const rawRatio = Math.max(photo.height, 1) / Math.max(photo.width, 1);
  // On mobile cap at 4:3 portrait to prevent over-tall cells; desktop shows full ratio
  const aspectRatio = containerWidth < 640 ? Math.min(rawRatio, 1.334) : rawRatio;
  const imageHeight = columnWidth * aspectRatio;

  return Math.max(
    Math.ceil((imageHeight + gap) / (GALLERY_ROW_HEIGHT_PX + gap)),
    1,
  );
}

function createLocalPhoto(
  file: File,
  eventId: string,
  participantId: string,
): PhotoRecord {
  const previewUrl = URL.createObjectURL(file);
  const now = new Date().toISOString();
  const mediaType = file.type.startsWith("video/") ? "video" : "image";

  return {
    id: crypto.randomUUID(),
    eventId,
    participantId,
    status: "processing",
    visibility: "visible",
    inGallery: false,
    originalKey: `local/${file.name}`,
    thumbnailUrl: previewUrl,
    previewUrl,
    originalFileName: file.name,
    originalContentType: file.type || "image/jpeg",
    originalSizeBytes: file.size,
    mediaType,
    width: 1,
    height: 1,
    uploadedAt: now,
  };
}

export function GalleryExperience(props: GalleryExperienceProps) {
  return (
    <LangProvider>
      <GalleryExperienceInner {...props} />
    </LangProvider>
  );
}

function GalleryExperienceInner({
  event,
  initialPhotos,
  uploaderNames,
}: GalleryExperienceProps) {
  const { t } = useLang();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploaderNameMap, setUploaderNameMap] = useState(uploaderNames);
  const [pendingPhotos, setPendingPhotos] = useState<PhotoRecord[]>();
  const [pendingUploaderNames, setPendingUploaderNames] =
    useState<Record<string, string>>();
  const [participant, setParticipant] = useState<StoredParticipant>();
  const [displayName, setDisplayName] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [socialHandles, setSocialHandles] =
    useState<GuestSocialHandles>(EMPTY_SOCIAL_HANDLES);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>();
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [identityMode, setIdentityMode] = useState<"signup" | "code">("signup");
  const [guestCode, setGuestCode] = useState("");
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [resumeCandidates, setResumeCandidates] = useState<
    GuestResumeCandidate[]
  >([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>();
  const [isResuming, setIsResuming] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [pendingRecoveryReveal, setPendingRecoveryReveal] = useState<{
    code: string;
    displayName: string;
  }>();
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [savedPhotoIds, setSavedPhotoIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [failedUploads, setFailedUploads] = useState<Map<string, { file: File; reservation: UploadReservation }>>(new Map());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [viewSize, setViewSize] = useState<ViewSize>("medium");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const photoIdsRef = useRef(new Set(initialPhotos.map((photo) => photo.id)));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masonryRef = useRef<HTMLDivElement>(null);
  // Keep 0 on server and first client render so row spans match during hydration.
  const [masonryWidth, setMasonryWidth] = useState(0);

  const activeParticipant = participant?.displayName ?? "Guest";

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("bt:gallery-view-size") as ViewSize | null;
    if (stored === "compact" || stored === "medium" || stored === "large") {
      setViewSize(stored);
    }
  }, []);

  function changeViewSize(size: ViewSize) {
    setViewSize(size);
    window.localStorage.setItem("bt:gallery-view-size", size);
  }

  useEffect(() => {
    const storedParticipant = getStoredParticipant(event.id);
    if (!storedParticipant) {
      return;
    }

    queueMicrotask(() => {
      applyParticipantToForm(storedParticipant, {
        setParticipant,
        setDisplayName,
        setConsentAccepted,
        setSocialHandles,
        setProfilePhotoPreview,
      });
    });
  }, [event.id]);

  useEffect(() => {
    let cancelled = false;

    async function restoreActiveParticipant() {
      try {
        const response = await fetch(`/api/sessions/current?eventId=${event.id}`);
        const body = await readJsonResponse<SessionResponse>(response);

        if (cancelled || !body?.participant) {
          return;
        }

        const restoredParticipant = participantToStoredState(body.participant);

        applyParticipantToForm(restoredParticipant, {
          setParticipant,
          setDisplayName,
          setConsentAccepted,
          setSocialHandles,
          setProfilePhotoPreview,
        });
        storeParticipant(event.id, restoredParticipant);
      } catch {
        // Keep local participant fallback.
      }
    }

    void restoreActiveParticipant();

    return () => {
      cancelled = true;
    };
  }, [event.id]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function fetchAndMergePhotos() {
      const response = await fetch(`/api/events/${event.id}/photos`);
      const body = await readJsonResponse<PhotosResponse>(response);

      if (!body?.photos) {
        return;
      }

      const unseenPhotos = body.photos.filter(
        (photo) => !photoIdsRef.current.has(photo.id),
      );

      if (unseenPhotos.length > 0) {
        setPendingPhotos(body.photos);
        setPendingUploaderNames(body.uploaderNames);
      } else {
        // Merge: keep optimistic blob URLs for photos the server doesn't have thumbnails for yet.
        setPhotos((current) => {
          const currentMap = new Map(current.map((p) => [p.id, p]));
          return body.photos.map((p) => {
            const existing = currentMap.get(p.id);
            if (!existing) return p;
            return {
              ...p,
              thumbnailUrl: p.thumbnailUrl || existing.thumbnailUrl,
              previewUrl: p.previewUrl || existing.previewUrl,
            };
          });
        });
        setUploaderNameMap(body.uploaderNames);
      }
    }

    const channel = supabase
      .channel(`event-gallery:${event.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "beenthere",
          table: "photos",
          filter: `event_id=eq.${event.id}`,
        },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => void fetchAndMergePhotos(), 1500);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      void supabase.removeChannel(channel);
    };
  }, [event.id]);

  useEffect(() => {
    photoIdsRef.current = new Set(photos.map((photo) => photo.id));
  }, [photos]);

  // Poll for status updates when any photo is still processing.
  // This is a fallback for when the Supabase subscription misses the Trigger.dev update.
  useEffect(() => {
    const hasProcessing = photos.some((p) => p.status !== "ready");
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/events/${event.id}/photos`);
      const body = await readJsonResponse<PhotosResponse>(response);
      if (!body?.photos) return;

      const allReady = body.photos.every((p) => p.status === "ready");
      setPhotos((current) => {
        const currentMap = new Map(current.map((p) => [p.id, p]));
        return body.photos.map((p) => {
          const existing = currentMap.get(p.id);
          if (!existing) return p;
          return {
            ...p,
            thumbnailUrl: p.thumbnailUrl || existing.thumbnailUrl,
            previewUrl: p.previewUrl || existing.previewUrl,
          };
        });
      });
      setUploaderNameMap(body.uploaderNames);
      if (allReady) clearInterval(interval);
    }, 5000);

    return () => clearInterval(interval);
  }, [photos, event.id]);

  useEffect(() => {
    queueMicrotask(() => {
      const anonymousFavoriteIds = readStoredFavoriteIds(event.id);
      const participantFavoriteIds = participant?.id
        ? readStoredFavoriteIds(event.id, participant.id)
        : [];
      const mergedFavoriteIds = [
        ...new Set([...anonymousFavoriteIds, ...participantFavoriteIds]),
      ];

      if (mergedFavoriteIds.length > 0) {
        setSavedPhotoIds(new Set(mergedFavoriteIds));
      }
    });
  }, [event.id, participant?.id]);

  useEffect(() => {
    if (!participant?.id) {
      return;
    }

    const participantId = participant.id;

    let cancelled = false;

    async function loadFavorites() {
      try {
        const response = await fetch(`/api/favorites?eventId=${event.id}`);
        const body = await readJsonResponse<FavoritesResponse>(response);

        if (cancelled || !response.ok || !body?.photoIds) {
          return;
        }

      const localFavoriteIds = readStoredFavoriteIds(event.id, participantId);
      const mergedFavoriteIds = [
        ...new Set([...localFavoriteIds, ...body.photoIds]),
      ];

      setSavedPhotoIds(new Set(mergedFavoriteIds));
      writeStoredFavoriteIds(event.id, mergedFavoriteIds, participantId);
      } catch {
        // Keep local favorites fallback.
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [event.id, participant?.id]);

  const filteredPhotos = useMemo(() => {
    return photos
      .filter((photo) => photo.visibility === "visible")
      .filter((photo) => {
        if (filter === "mine") {
          return participant?.id === photo.participantId;
        }

        if (filter === "saved") {
          return savedPhotoIds.has(photo.id);
        }

        return true;
      })
      .filter((photo) => {
        const uploaderName =
          photo.participantId === participant?.id
            ? participant.displayName
          : uploaderNameMap[photo.participantId] ?? "Guest";

        return uploaderName.toLowerCase().includes(search.toLowerCase());
      })
      .toSorted(
        (a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
      );
  }, [filter, participant, photos, savedPhotoIds, search, uploaderNameMap]);

  useLayoutEffect(() => {
    const masonry = masonryRef.current;
    if (!masonry) {
      return;
    }

    const updateWidth = () => {
      setMasonryWidth(masonry.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(masonry);

    return () => {
      observer.disconnect();
    };
  }, [filteredPhotos.length]);

  useEffect(() => {
    if (!showIdentityForm || participant) {
      return;
    }

    let cancelled = false;

    async function loadResumeCandidates() {
      try {
        const response = await fetch(`/api/events/${event.id}/participants`);
        const body = await readJsonResponse<ParticipantsResponse>(response);

        if (cancelled || !response.ok || !body?.participants) {
          return;
        }

        setResumeCandidates(body.participants);
      } catch {
        // Resume list is optional; sign-up still works.
      }
    }

    void loadResumeCandidates();

    return () => {
      cancelled = true;
    };
  }, [event.id, participant, showIdentityForm]);

  async function uploadProfilePhoto(participantId: string) {
    if (!profilePhotoFile) {
      return profilePhotoPreview;
    }

    try {
      const reservationResponse = await fetch("/api/participants/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          participantId,
          contentType: profilePhotoFile.type || "image/jpeg",
        }),
      });
      const reservationBody = await readJsonResponse<{
        uploadUrl?: string;
        objectKey?: string;
        method?: "PUT";
        headers?: Record<string, string>;
        error?: string;
      }>(reservationResponse);

      if (
        !reservationResponse.ok ||
        !reservationBody?.uploadUrl ||
        !reservationBody.objectKey
      ) {
        return profilePhotoPreview;
      }

      await fetch(reservationBody.uploadUrl, {
        method: reservationBody.method ?? "PUT",
        headers: reservationBody.headers,
        body: profilePhotoFile,
      });

      const completeResponse = await fetch(
        "/api/participants/profile-photo/complete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: event.id,
            participantId,
            objectKey: reservationBody.objectKey,
          }),
        },
      );
      const completeBody = await readJsonResponse<{
        profilePhotoUrl?: string;
        participant?: EventParticipant;
      }>(completeResponse);

      if (completeResponse.ok && completeBody) {
        return (
          completeBody.profilePhotoUrl ??
          completeBody.participant?.profilePhotoUrl ??
          profilePhotoPreview
        );
      }
    } catch {
      // Fall back to local preview below.
    }

    return profilePhotoPreview;
  }

  async function createGuestOnServer(trimmedName: string, socialPayload: GuestSocialHandles) {
    const response = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        displayName: trimmedName,
        consentVersion: CONSENT_VERSION,
        socialHandles: socialPayload,
      }),
    });
    const body = await readJsonResponse<{
      participant?: EventParticipant;
      recoveryCode?: string;
      error?: string;
    }>(response);

    return { response, body };
  }

  async function finalizeParticipant(
    nextParticipant: StoredParticipant,
    options?: {
      recoveryCode?: string;
      closeIdentityForm?: boolean;
      revealRecoveryCode?: boolean;
    },
  ) {
    const recoveryCode = options?.recoveryCode ?? nextParticipant.recoveryCode;
    const profilePhotoUrl = await uploadProfilePhoto(nextParticipant.id);
    const participantWithPhoto = {
      ...nextParticipant,
      profilePhotoUrl: profilePhotoUrl ?? nextParticipant.profilePhotoUrl,
      recoveryCode,
    };

    if (recoveryCode) {
      storeRecoveryCodeMapping(
        event.id,
        recoveryCode,
        participantWithPhoto.id,
      );
    }

    applyParticipantToForm(participantWithPhoto, {
      setParticipant,
      setDisplayName,
      setConsentAccepted,
      setSocialHandles,
      setProfilePhotoPreview,
    });
    storeParticipant(event.id, participantWithPhoto);
    setProfilePhotoFile(null);
    setIdentityError(null);

    if (options?.closeIdentityForm !== false) {
      setShowIdentityForm(false);
      setGuestCode("");
      setShowNamePicker(false);
      setSelectedResumeId(undefined);
    }

    if (options?.revealRecoveryCode && recoveryCode) {
      setPendingRecoveryReveal({
        code: recoveryCode,
        displayName: participantWithPhoto.displayName,
      });
    }
  }

  function formatParticipantError(status: number, error?: string) {
    if (error) {
      return error;
    }

    if (status === 401) {
      return "Enter the event PIN before joining as a guest.";
    }

    return "Could not save your guest profile. Try again.";
  }

  async function ensureParticipant(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      return;
    }

    if (!participant && !consentAccepted) {
      return;
    }

    setIdentityError(null);
    const socialPayload = socialHandles;

    if (participant) {
      const response = await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: participant.id,
          displayName: trimmedName,
          socialHandles: socialPayload,
        }),
      });
      const body = await readJsonResponse<{
        participant?: EventParticipant;
        error?: string;
      }>(response);

      const staleLocalProfile =
        !response.ok &&
        body?.error?.toLowerCase().includes("participant not found");

      if (staleLocalProfile) {
        setParticipant(undefined);
        window.localStorage.removeItem(`beenthere:${event.id}:participant`);
      } else if (response.ok && body?.participant) {
        await finalizeParticipant(
          participantToStoredState(
            body.participant,
            participant?.recoveryCode,
          ),
        );
        return;
      } else if (!staleLocalProfile) {
        setIdentityError(formatParticipantError(response.status, body?.error));
        return;
      }
    }

    const { response, body } = await createGuestOnServer(trimmedName, socialPayload);

    if (response.status === 501) {
      const recoveryCode = generateGuestRecoveryCode();
      const localParticipant: StoredParticipant = {
        id: crypto.randomUUID(),
        displayName: trimmedName,
        consentVersion: CONSENT_VERSION,
        socialHandles: socialPayload,
        profilePhotoUrl: profilePhotoPreview,
        recoveryCode,
      };

      await finalizeParticipant(localParticipant, {
        recoveryCode,
        revealRecoveryCode: true,
      });
      setUploadMessage(
        "Saved locally for demo mode. Connect POSTGRES_URL to share tags with other guests.",
      );
      return;
    }

    if (!response.ok || !body?.participant) {
      setIdentityError(formatParticipantError(response.status, body?.error));
      return;
    }

    await finalizeParticipant(
      participantToStoredState(body.participant, body.recoveryCode),
      {
        recoveryCode: body.recoveryCode,
        revealRecoveryCode: Boolean(body.recoveryCode),
      },
    );
  }

  async function resumeGuestProfile() {
    const resumeByParticipantId = Boolean(selectedResumeId);
    const resumeByCode = !resumeByParticipantId && Boolean(guestCode.trim());

    if (!resumeByParticipantId && !resumeByCode) {
      return;
    }

    setIdentityError(null);
    setIsResuming(true);

    try {
      const response = await fetch("/api/participants/resume", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          participantId: resumeByParticipantId ? selectedResumeId : undefined,
          recoveryCode: resumeByCode ? guestCode : undefined,
        }),
      });
      const body = await readJsonResponse<{
        participant?: EventParticipant;
        error?: string;
      }>(response);

      if (response.status === 501) {
        const participantId = resumeByCode
          ? lookupRecoveryCodeParticipantId(event.id, guestCode)
          : selectedResumeId;
        const candidate = resumeCandidates.find(
          (entry) => entry.id === participantId,
        );

        if (!candidate) {
          setIdentityError(
            resumeByCode
              ? "No guest profile matches that code."
              : "Could not open that guest profile. Try again.",
          );
          return;
        }

        const stored = getStoredParticipant(event.id);
        const localParticipant: StoredParticipant = {
          id: candidate.id,
          displayName: candidate.displayName,
          consentVersion: CONSENT_VERSION,
          profilePhotoUrl: candidate.profilePhotoUrl,
          recoveryCode:
            stored?.id === candidate.id ? stored.recoveryCode : undefined,
        };
        await finalizeParticipant(localParticipant);
        setIdentityMode("signup");
        setGuestCode("");
        setShowNamePicker(false);
        setSelectedResumeId(undefined);
        return;
      }

      if (!response.ok || !body?.participant) {
        setIdentityError(
          body?.error ?? "Could not open that guest profile. Try again.",
        );
        return;
      }

      const stored = getStoredParticipant(event.id);
      await finalizeParticipant(
        participantToStoredState(
          body.participant,
          stored?.id === body.participant.id ? stored.recoveryCode : undefined,
        ),
      );
      setIdentityMode("signup");
      setGuestCode("");
      setShowNamePicker(false);
      setSelectedResumeId(undefined);
    } catch {
      setIdentityError("Could not open that guest profile. Try again.");
    } finally {
      setIsResuming(false);
    }
  }

  async function regenerateRecoveryCode() {
    if (!participant?.id) {
      return;
    }

    setIdentityError(null);
    setIsRegeneratingCode(true);

    try {
      const response = await fetch("/api/participants/recovery-code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          participantId: participant.id,
        }),
      });
      const body = await readJsonResponse<{ recoveryCode?: string; error?: string }>(
        response,
      );

      if (response.status === 501) {
        const recoveryCode = generateGuestRecoveryCode();
        const nextParticipant = {
          ...participant,
          recoveryCode,
        };
        storeRecoveryCodeMapping(event.id, recoveryCode, participant.id);
        storeParticipant(event.id, nextParticipant);
        setParticipant(nextParticipant);
        setPendingRecoveryReveal({
          code: recoveryCode,
          displayName: participant.displayName,
        });
        return;
      }

      if (!response.ok || !body?.recoveryCode) {
        setIdentityError(
          body?.error ?? "Could not create a new guest code. Try again.",
        );
        return;
      }

      const nextParticipant = {
        ...participant,
        recoveryCode: body.recoveryCode,
      };
      storeRecoveryCodeMapping(event.id, body.recoveryCode, participant.id);
      storeParticipant(event.id, nextParticipant);
      setParticipant(nextParticipant);
      setPendingRecoveryReveal({
        code: body.recoveryCode,
        displayName: participant.displayName,
      });
    } catch {
      setIdentityError("Could not create a new guest code. Try again.");
    } finally {
      setIsRegeneratingCode(false);
    }
  }

  async function uploadSingleFile(
    reservation: UploadReservation,
    file: File,
    onSuccess: (photo: PhotoRecord) => void,
    onFail: () => void,
  ) {
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const r2Response = await fetch(reservation.uploadUrl, {
          method: reservation.method,
          headers: reservation.headers,
          body: file,
        });
        if (!r2Response.ok) throw new Error(`R2 upload failed (${r2Response.status})`);

        const completionResponse = await fetch("/api/uploads/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photoId: reservation.photoId,
            objectKey: reservation.objectKey,
          }),
        });
        const completionBody = await readJsonResponse<CompletionResponse>(completionResponse);
        if (!completionResponse.ok || !completionBody?.photo) {
          throw new Error(completionBody?.error ?? `Failed to process ${file.name}.`);
        }

        onSuccess(completionBody.photo);
        return;
      } catch {
        if (attempt === MAX_RETRIES) {
          onFail();
          return;
        }
        // Exponential backoff: 1s, 2s before retrying.
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  async function runWithConcurrency<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>,
  ) {
    let index = 0;
    async function worker() {
      while (index < items.length) {
        const item = items[index++];
        await fn(item);
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    if (!participant || participant.consentVersion !== CONSENT_VERSION) {
      setShowIdentityForm(true);
      setUploadMessage("Add your display name and accept upload consent first.");
      return;
    }

    const selectedFiles = Array.from(files).slice(0, MAX_BATCH_SIZE);

    const reservationResponse = await fetch("/api/uploads/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: event.id,
        participantId: participant.id,
        files: selectedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        })),
      }),
    });
    const reservationBody = await readJsonResponse<ReservationResponse>(reservationResponse);

    if (!reservationResponse.ok || !reservationBody?.reservations?.length) {
      // No R2 — fall back to local demo previews.
      const localPhotos = selectedFiles.map((file) =>
        createLocalPhoto(file, event.id, participant.id),
      );
      setPhotos((currentPhotos) => [...localPhotos, ...currentPhotos]);
      setUploadMessage(
        `Using local demo previews for ${localPhotos.length} photo${localPhotos.length === 1 ? "" : "s"}. Configure Supabase/R2 to persist uploads.`,
      );
      window.setTimeout(() => {
        setPhotos((currentPhotos) =>
          currentPhotos.map((photo) =>
            localPhotos.some((localPhoto) => localPhoto.id === photo.id)
              ? { ...photo, status: "ready" }
              : photo,
          ),
        );
      }, 900);
      return;
    }

    // Build optimistic placeholders and show them immediately.
    const optimisticPhotos = reservationBody.reservations.map((reservation) => {
      const file = selectedFiles[reservation.fileIndex];
      return {
        ...createLocalPhoto(file, event.id, participant.id),
        id: reservation.photoId,
        originalKey: reservation.objectKey,
      };
    });
    for (const p of optimisticPhotos) photoIdsRef.current.add(p.id);
    setPhotos((currentPhotos) => [...optimisticPhotos, ...currentPhotos]);

    // Sort: images first (4 concurrent), then videos (2 concurrent).
    const imageReservations = reservationBody.reservations.filter(
      (r) => !selectedFiles[r.fileIndex].type.startsWith("video/"),
    );
    const videoReservations = reservationBody.reservations.filter(
      (r) => selectedFiles[r.fileIndex].type.startsWith("video/"),
    );
    const total = reservationBody.reservations.length;
    let done = 0;
    setUploadProgress({ done: 0, total });
    setUploadMessage(null);
    setFailedUploads(new Map());

    function onSuccess(photo: PhotoRecord) {
      done++;
      setUploadProgress({ done, total });
      setPhotos((currentPhotos) =>
        currentPhotos.map((p) => {
          if (p.id !== photo.id) return p;
          return {
            ...photo,
            thumbnailUrl: photo.thumbnailUrl || p.thumbnailUrl,
            previewUrl: photo.previewUrl || p.previewUrl,
          };
        }),
      );
    }

    function onFail(reservation: UploadReservation, file: File) {
      done++;
      setUploadProgress({ done, total });
      setFailedUploads((prev) => {
        const next = new Map(prev);
        next.set(reservation.photoId, { file, reservation });
        return next;
      });
      // Mark the tile as failed so the user sees it.
      setPhotos((currentPhotos) =>
        currentPhotos.map((p) =>
          p.id === reservation.photoId ? { ...p, status: "failed" } : p,
        ),
      );
    }

    await runWithConcurrency(imageReservations, 4, (reservation) =>
      uploadSingleFile(reservation, selectedFiles[reservation.fileIndex], onSuccess, () => onFail(reservation, selectedFiles[reservation.fileIndex])),
    );
    await runWithConcurrency(videoReservations, 2, (reservation) =>
      uploadSingleFile(reservation, selectedFiles[reservation.fileIndex], onSuccess, () => onFail(reservation, selectedFiles[reservation.fileIndex])),
    );

    setUploadProgress(null);

    const failCount = done - (done - (total - [...failedUploads.values()].length));
    const successCount = total - failedUploads.size;
    if (failedUploads.size === 0) {
      const skipped = reservationBody.skippedFiles?.length ?? 0;
      const videos = videoReservations.length;
      const images = imageReservations.length;
      const label = videos > 0 && images > 0
        ? `${total} file${total === 1 ? "" : "s"}`
        : videos > 0
          ? `${total} video${total === 1 ? "" : "s"}`
          : `${total} photo${total === 1 ? "" : "s"}`;
      setUploadMessage(`Uploaded ${label}${skipped ? `; ${skipped} skipped due to storage limits` : ""}.`);
    } else {
      setUploadMessage(`${successCount} uploaded, ${failedUploads.size} failed — tap to retry.`);
    }
  }

  async function retryFailedUpload(photoId: string) {
    const entry = failedUploads.get(photoId);
    if (!entry) return;

    setFailedUploads((prev) => {
      const next = new Map(prev);
      next.delete(photoId);
      return next;
    });
    setPhotos((currentPhotos) =>
      currentPhotos.map((p) =>
        p.id === photoId ? { ...p, status: "processing" } : p,
      ),
    );

    await uploadSingleFile(
      entry.reservation,
      entry.file,
      (photo) => {
        setPhotos((currentPhotos) =>
          currentPhotos.map((p) => {
            if (p.id !== photo.id) return p;
            return { ...photo, thumbnailUrl: photo.thumbnailUrl || p.thumbnailUrl, previewUrl: photo.previewUrl || p.previewUrl };
          }),
        );
        setUploadMessage(null);
      },
      () => {
        setFailedUploads((prev) => {
          const next = new Map(prev);
          next.set(photoId, entry);
          return next;
        });
        setPhotos((currentPhotos) =>
          currentPhotos.map((p) =>
            p.id === photoId ? { ...p, status: "failed" } : p,
          ),
        );
      },
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
    }
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function bulkSave(save: boolean) {
    const nextIds = new Set(savedPhotoIds);
    for (const id of selectedIds) save ? nextIds.add(id) : nextIds.delete(id);
    setSavedPhotoIds(nextIds);
    writeStoredFavoriteIds(event.id, [...nextIds], participant?.id);
    exitSelectMode();
  }

  async function toggleSaved(photoId: string) {
    const willSave = !savedPhotoIds.has(photoId);
    const nextIds = new Set(savedPhotoIds);

    if (willSave) {
      nextIds.add(photoId);
    } else {
      nextIds.delete(photoId);
    }

    setSavedPhotoIds(nextIds);
    writeStoredFavoriteIds(event.id, [...nextIds], participant?.id);

    if (!participant?.id) {
      return;
    }

    try {
      const response = await fetch("/api/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          photoId,
          saved: willSave,
        }),
      });
      const body = await readJsonResponse<FavoritesResponse>(response);

      if (!response.ok || !body?.photoIds) {
        return;
      }

      setSavedPhotoIds(new Set(body.photoIds));
      writeStoredFavoriteIds(event.id, body.photoIds, participant.id);
    } catch {
      // Keep the optimistic local save.
    }
  }

  function showPendingPhotos() {
    if (!pendingPhotos || !pendingUploaderNames) {
      return;
    }

    setPhotos(pendingPhotos);
    setUploaderNameMap(pendingUploaderNames);
    setPendingPhotos(undefined);
    setPendingUploaderNames(undefined);
  }

  function getUploaderName(photo: PhotoRecord) {
    return photo.participantId === participant?.id
      ? (participant?.displayName ?? "Guest")
      : (uploaderNameMap[photo.participantId] ?? "Guest");
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  const pendingCount = useMemo(() => {
    if (!pendingPhotos) {
      return 0;
    }

    const knownPhotoIds = new Set(photos.map((photo) => photo.id));
    return pendingPhotos.filter((photo) => !knownPhotoIds.has(photo.id)).length;
  }, [pendingPhotos, photos]);

  return (
    <main
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #090918 0%, #10122C 40%, #0C0D20 100%)",
        color: "rgba(255,255,255,.92)",
        paddingBottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(117,84,255,.12) 0%, transparent 60%)" }}
      />
      <header
        className="sticky top-0 z-40"
        style={{ background: "rgba(9,9,24,.90)", borderBottom: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        {/* Top row: logo + event name + lang toggle + guest profile */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 pb-2 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              alt="beenThere"
              className="shrink-0 opacity-80"
              height={22}
              src="/icon-white.webp"
              width={22}
            />
            <span style={{ color: "rgba(255,255,255,.15)" }}>·</span>
            <h1
              className="truncate text-sm font-semibold sm:text-base"
              style={{ color: "rgba(255,255,255,.70)", letterSpacing: "-0.01em" }}
            >
              {event.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
          <button
            aria-label={participant ? t.openGuestProfile : t.joinAsGuestAria}
            className="flex shrink-0 touch-manipulation items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-semibold transition active:scale-[0.98]"
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.80)" }}
            onClick={() => {
              setIdentityError(null);
              setIdentityMode(participant ? "signup" : "code");
              setGuestCode("");
              setShowNamePicker(false);
              setSelectedResumeId(undefined);
              setShowIdentityForm(true);
            }}
            type="button"
          >
            <ParticipantAvatar
              name={activeParticipant}
              photoUrl={participant?.profilePhotoUrl}
              size="sm"
            />
            <span className="max-w-24 truncate sm:max-w-28">
              {activeParticipant}
            </span>
          </button>
          </div>
        </div>

        <div className="pointer-events-auto relative z-50 mx-auto w-full max-w-6xl space-y-2 px-4 pb-3 sm:px-6">
          {/* Filter row: pills left, view toggle + select right */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: filter pills or select-mode controls */}
            {selectMode ? (
              <div className="flex items-center gap-2 min-w-0">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>
                  <input
                    checked={selectedIds.size === filteredPhotos.length && filteredPhotos.length > 0}
                    className="size-4 accent-accent"
                    onChange={toggleSelectAll}
                    type="checkbox"
                  />
                  {selectedIds.size > 0 ? `${selectedIds.size} ${t.selected}` : t.selectAll}
                </label>
                <button
                  className="text-sm font-semibold transition active:scale-95"
                  onClick={exitSelectMode}
                  style={{ color: "rgba(255,255,255,.40)" }}
                  type="button"
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <SegmentedControl
                className="rounded-full"
                onChange={setFilter}
                options={[
                  { id: "all" as Filter, label: t.filterAll },
                  { id: "mine" as Filter, label: t.filterMine },
                  { id: "saved" as Filter, label: t.filterSaved },
                ]}
                value={filter}
              />
            )}
            {/* Right: view toggle (desktop only) + select */}
            <div className="flex shrink-0 items-center gap-1.5">
              {!selectMode && (
                <>
                  {/* Desktop: three-button toggle */}
                  <div className="hidden sm:block">
                    <ViewSizeToggle onChange={changeViewSize} value={viewSize} />
                  </div>
                  {/* Mobile: single cycle button */}
                  <button
                    className="flex size-8 items-center justify-center rounded-lg transition active:scale-95 sm:hidden"
                    onClick={() => changeViewSize(viewSize === "compact" ? "medium" : viewSize === "medium" ? "large" : "compact")}
                    style={{ background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.55)" }}
                    title="Change grid size"
                    type="button"
                  >
                    {viewSize === "compact" ? (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
                        <rect height="4" rx="0.75" width="4" x="1" y="1"/><rect height="4" rx="0.75" width="4" x="6" y="1"/><rect height="4" rx="0.75" width="4" x="11" y="1"/>
                        <rect height="4" rx="0.75" width="4" x="1" y="6"/><rect height="4" rx="0.75" width="4" x="6" y="6"/><rect height="4" rx="0.75" width="4" x="11" y="6"/>
                        <rect height="4" rx="0.75" width="4" x="1" y="11"/><rect height="4" rx="0.75" width="4" x="6" y="11"/><rect height="4" rx="0.75" width="4" x="11" y="11"/>
                      </svg>
                    ) : viewSize === "medium" ? (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
                        <rect height="6.5" rx="1" width="6.5" x="1" y="1"/><rect height="6.5" rx="1" width="6.5" x="8.5" y="1"/>
                        <rect height="6.5" rx="1" width="6.5" x="1" y="8.5"/><rect height="6.5" rx="1" width="6.5" x="8.5" y="8.5"/>
                      </svg>
                    ) : (
                      <svg fill="currentColor" height="14" viewBox="0 0 16 16" width="14">
                        <rect height="6.5" rx="1.5" width="14" x="1" y="1"/><rect height="6.5" rx="1.5" width="14" x="1" y="8.5"/>
                      </svg>
                    )}
                  </button>
                </>
              )}
              <button
                className="rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95"
                onClick={() => { setSelectMode((v) => !v); setSelectedIds(new Set()); }}
                style={selectMode
                  ? { background: "rgba(255,109,174,.15)", border: "1px solid rgba(255,109,174,.25)", color: "#FF6DAE" }
                  : { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.65)" }
                }
                type="button"
              >
                Select
              </button>
            </div>
          </div>
          {/* Search: full width on its own row */}
          <input
            className="min-h-11 w-full rounded-full px-4 py-2.5 text-base outline-none transition"
            onChange={(inputEvent) => setSearch(inputEvent.target.value)}
            placeholder="Search by name"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.10)",
              color: "rgba(255,255,255,.80)",
            }}
            value={search}
          />
        </div>

        {pendingPhotos ? (
          <div
            className="new-photos-banner px-5 py-3 sm:px-6"
            style={{ borderBottom: "1px solid rgba(255,109,174,.15)", background: "rgba(255,109,174,.08)" }}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,.80)" }}>
                {pendingCount || "New"} photo{(pendingCount || 0) === 1 ? "" : "s"} just arrived
              </p>
              <button
                className="tap-target rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
                onClick={showPendingPhotos}
                style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
                type="button"
              >
                Show new
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative z-0 mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-5">

        {uploadProgress ? (
          <div
            className="mt-4 overflow-hidden rounded-2xl"
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm" style={{ color: "rgba(255,255,255,.55)" }}>
                Uploading {uploadProgress.done} / {uploadProgress.total}
              </p>
              <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,.30)" }}>
                {Math.round((uploadProgress.done / uploadProgress.total) * 100)}%
              </p>
            </div>
            <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,.08)" }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
                  background: "linear-gradient(90deg, #FF6DAE, #B35DFF)",
                }}
              />
            </div>
          </div>
        ) : uploadMessage ? (
          <p
            className="mt-4 rounded-2xl px-4 py-3 text-sm"
            style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.55)" }}
          >
            {uploadMessage}
          </p>
        ) : null}

        {filteredPhotos.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>No photos yet</p>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.40)" }}>
              Be the first to add a moment from this event.
            </p>
          </div>
        ) : (
          <div
            className="gallery-masonry relative mt-4 sm:mt-5"
            ref={masonryRef}
            style={{
              gap: `${getGalleryGap(masonryWidth, viewSize)}px`,
              gridTemplateColumns: `repeat(${getGalleryColumnCount(masonryWidth, viewSize)}, 1fr)`,
            }}
          >
            {filteredPhotos.map((photo, index) => {
              const uploaderName = getUploaderName(photo);
              const isProcessing = photo.status !== "ready";
              const isSaved = savedPhotoIds.has(photo.id);
              const squareCrop = GALLERY_CONFIG[viewSize].squareCrop;

              const isSelected = selectedIds.has(photo.id);

              return (
                <article
                  className={`gallery-photo-enter group relative min-h-0 overflow-hidden rounded-2xl bg-black/5 shadow-sm transition ${isSelected ? "ring-2 ring-accent ring-offset-1" : ""}`}
                  key={photo.id}
                  style={{
                    animationDelay: `${Math.min(index, 14) * 35}ms`,
                    gridRowEnd: `span ${getGalleryRowSpan(photo, masonryWidth, viewSize)}`,
                    WebkitTouchCallout: "none",
                  }}
                >
                  {selectMode && (
                    <button
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={() => toggleSelect(photo.id)}
                      type="button"
                    />
                  )}
                  {selectMode && (
                    <div className={`pointer-events-none absolute left-1.5 top-1.5 z-20 flex size-4 items-center justify-center rounded-full border-2 transition ${isSelected ? "border-accent bg-accent" : "border-white/80 bg-black/30"}`}>
                      {isSelected && (
                        <svg fill="none" height="9" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="9">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  )}
                  <button
                    className={`tap-target block touch-manipulation ${squareCrop ? "aspect-square w-full" : "absolute inset-0"}`}
                    onClick={() => !selectMode && openLightbox(index)}
                    type="button"
                  >
                    {isProcessing && !photo.thumbnailUrl ? (
                      <div
                        className={`pointer-events-none flex animate-pulse items-center justify-center bg-white/5 ${squareCrop ? "aspect-square w-full" : "absolute inset-0"}`}
                      >
                        {photo.mediaType === "video" ? (
                          <svg fill="none" height="32" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" viewBox="0 0 24 24" width="32">
                            <path d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg fill="none" height="32" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" viewBox="0 0 24 24" width="32">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={photo.mediaType === "video" ? `Video by ${uploaderName}` : `Photo by ${uploaderName}`}
                          className="pointer-events-none h-full w-full bg-border object-cover transition duration-300 group-hover:scale-[1.02]"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                          src={photo.thumbnailUrl || undefined}
                          style={{ WebkitTouchCallout: "none" }}
                        />
                        {photo.mediaType === "video" && (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <span className="flex size-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                              <svg fill="white" height="16" viewBox="0 0 24 24" width="16">
                                <polygon points="5,3 19,12 5,21" />
                              </svg>
                            </span>
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                    <div className="flex items-center gap-2 text-white">
                      <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                        {getInitials(uploaderName)}
                      </span>
                      <span className="truncate text-xs font-medium">
                        {uploaderName}
                      </span>
                    </div>
                  </div>
                  {photo.status === "failed" && failedUploads.has(photo.id) ? (
                    <button
                      className="absolute left-2 top-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white transition active:scale-95"
                      onClick={(e) => { e.stopPropagation(); void retryFailedUpload(photo.id); }}
                      style={{ background: "#FF5F7B" }}
                      type="button"
                    >
                      Tap to retry
                    </button>
                  ) : isProcessing ? (
                    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Processing
                    </span>
                  ) : null}
                  {viewSize !== "compact" && (
                    <button
                      aria-label={isSaved ? "Remove from saved" : "Save photo"}
                      className="save-pop absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full transition active:scale-95"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        void toggleSaved(photo.id);
                      }}
                      style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
                      type="button"
                    >
                      <HeartIcon
                        className={`size-4 transition ${
                          isSaved ? "text-[#FF6DAE]" : "text-white"
                        }`}
                        filled={isSaved}
                      />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-30 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
        style={{ background: "rgba(9,9,24,.85)", borderTop: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(20px)" }}
      >
        {selectMode && selectedIds.size > 0 ? (
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.80)" }}>{selectedIds.size} selected</span>
            <a
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              download
              href={`/api/events/${event.publicId}/download?${Array.from(selectedIds).map((id) => `photoId=${id}`).join("&")}`}
              onClick={exitSelectMode}
              style={{ background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.12)" }}
            >
              Download ZIP
            </a>
            <button
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              onClick={() => bulkSave(true)}
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)" }}
              type="button"
            >
              Save all
            </button>
            <button
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-95"
              onClick={() => bulkSave(false)}
              style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", color: "rgba(255,255,255,.70)" }}
              type="button"
            >
              Unsave all
            </button>
            <button
              className="rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95"
              onClick={exitSelectMode}
              style={{ color: "rgba(255,255,255,.35)" }}
              type="button"
            >
              Cancel
            </button>
          </div>
        ) : (
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="hidden text-sm sm:block" style={{ color: "rgba(255,255,255,.35)" }}>
            {filteredPhotos.length} photo{filteredPhotos.length === 1 ? "" : "s"}
          </p>
          {participant?.consentVersion === CONSENT_VERSION ? (
            <label
              className="tap-target ml-auto inline-flex cursor-pointer items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.30)" }}
            >
              Add photos &amp; videos
              <input
                accept="image/jpeg,image/png,image/heic,image/heif,video/mp4,video/quicktime,video/webm"
                className="sr-only"
                multiple
                onChange={(inputEvent) => handleUpload(inputEvent.target.files)}
                ref={fileInputRef}
                type="file"
              />
            </label>
          ) : (
            <button
              className="tap-target ml-auto inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
              onClick={() => setShowIdentityForm(true)}
              style={{ background: "linear-gradient(135deg, #FF6DAE, #B35DFF)", boxShadow: "0 8px 24px rgba(205,95,255,.30)" }}
              type="button"
            >
              Add photos &amp; videos
            </button>
          )}
        </div>
        )}
      </div>

      {showIdentityForm ? (
        <IdentitySheet
          collectSocials={event.collectSocials}
          consentAccepted={consentAccepted}
          displayName={displayName}
          errorMessage={identityError}
          guestCode={guestCode}
          hasParticipant={Boolean(participant)}
          identityMode={identityMode}
          isRegeneratingCode={isRegeneratingCode}
          isResuming={isResuming}
          onClose={() => {
            setShowIdentityForm(false);
            setIdentityError(null);
            setGuestCode("");
            setShowNamePicker(false);
            setSelectedResumeId(undefined);
          }}
          onConsentChange={setConsentAccepted}
          onDisplayNameChange={(name) => {
            setDisplayName(name);
            setIdentityError(null);
          }}
          onGuestCodeChange={(value) => {
            setGuestCode(value);
            setSelectedResumeId(undefined);
            setIdentityError(null);
          }}
          onIdentityModeChange={(mode) => {
            setIdentityMode(mode);
            setIdentityError(null);
            setGuestCode("");
            setShowNamePicker(false);
            setSelectedResumeId(undefined);
          }}
          onProfilePhotoChange={(file, previewUrl) => {
            setProfilePhotoFile(file);
            setProfilePhotoPreview(previewUrl);
          }}
          onRegenerateRecoveryCode={() => {
            void regenerateRecoveryCode();
          }}
          onLogOut={() => {
            clearStoredParticipant(event.id);
            setParticipant(undefined);
            setDisplayName("");
            setConsentAccepted(false);
            setSocialHandles(EMPTY_SOCIAL_HANDLES);
            setProfilePhotoFile(null);
            setProfilePhotoPreview(undefined);
            setIdentityMode("code");
            setGuestCode("");
            setShowNamePicker(false);
            setSelectedResumeId(undefined);
            setShowIdentityForm(false);
            setIdentityError(null);
          }}
          onResume={() => {
            void resumeGuestProfile();
          }}
          onSelectResumeCandidate={(participantId) => {
            setSelectedResumeId(participantId);
            setIdentityError(null);
          }}
          onSocialHandleChange={(platform, value) => {
            setSocialHandles((current) => ({
              ...current,
              [platform]: value,
            }));
          }}
          onSubmit={ensureParticipant}
          onToggleNamePicker={() => {
            setShowNamePicker((current) => !current);
            setSelectedResumeId(undefined);
            setIdentityError(null);
          }}
          profilePhotoPreview={profilePhotoPreview}
          recoveryCode={participant?.recoveryCode}
          resumeCandidates={resumeCandidates}
          selectedResumeId={selectedResumeId}
          showNamePicker={showNamePicker}
          socialHandles={socialHandles}
        />
      ) : null}

      {pendingRecoveryReveal ? (
        <GuestRecoveryReveal
          displayName={pendingRecoveryReveal.displayName}
          onContinue={() => {
            setPendingRecoveryReveal(undefined);
          }}
          recoveryCode={pendingRecoveryReveal.code}
        />
      ) : null}

      {lightboxIndex !== null && filteredPhotos[lightboxIndex] ? (
        <PhotoDetailView
          activeIndex={lightboxIndex}
          currentParticipantId={participant?.id}
          eventId={event.id}
          getUploaderName={getUploaderName}
          isSaved={(photoId) => savedPhotoIds.has(photoId)}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
          onRequireIdentity={() => setShowIdentityForm(true)}
          onToggleSave={toggleSaved}
          photos={filteredPhotos}
        />
      ) : null}
    </main>
  );
}
