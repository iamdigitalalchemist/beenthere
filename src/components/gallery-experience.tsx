"use client";

import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { HeartIcon } from "@/components/gallery/heart-icon";
import { GuestRecoveryReveal } from "@/components/gallery/guest-recovery-reveal";
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
const GALLERY_GAP_MOBILE_PX = 12;
const GALLERY_GAP_DESKTOP_PX = 16;

function getGalleryColumnCount(containerWidth: number) {
  if (containerWidth >= 1024) {
    return 4;
  }
  if (containerWidth >= 640) {
    return 3;
  }
  return 2;
}

function getGalleryGap(containerWidth: number) {
  return containerWidth >= 640
    ? GALLERY_GAP_DESKTOP_PX
    : GALLERY_GAP_MOBILE_PX;
}

function getGalleryRowSpan(photo: PhotoRecord, containerWidth: number) {
  if (containerWidth <= 0) {
    return 12;
  }

  const columns = getGalleryColumnCount(containerWidth);
  const gap = getGalleryGap(containerWidth);
  const columnWidth = (containerWidth - gap * (columns - 1)) / columns;
  const aspectRatio = Math.max(photo.height, 1) / Math.max(photo.width, 1);
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

  return {
    id: crypto.randomUUID(),
    eventId,
    participantId,
    status: "processing",
    visibility: "visible",
    originalKey: `local/${file.name}`,
    thumbnailUrl: previewUrl,
    previewUrl,
    originalFileName: file.name,
    originalContentType: file.type || "image/jpeg",
    originalSizeBytes: file.size,
    width: 1,
    height: 1,
    uploadedAt: now,
  };
}

export function GalleryExperience({
  event,
  initialPhotos,
  uploaderNames,
}: GalleryExperienceProps) {
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
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
        async () => {
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
            setPhotos(body.photos);
            setUploaderNameMap(body.uploaderNames);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [event.id]);

  useEffect(() => {
    photoIdsRef.current = new Set(photos.map((photo) => photo.id));
  }, [photos]);

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

    try {
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
      const reservationBody =
        await readJsonResponse<ReservationResponse>(reservationResponse);

      if (
        !reservationResponse.ok ||
        !reservationBody?.reservations?.length
      ) {
        throw new Error(
          reservationBody?.error ?? "Upload API unavailable.",
        );
      }

      const optimisticPhotos = reservationBody.reservations.map(
        (reservation) => {
          const file = selectedFiles[reservation.fileIndex];
          return {
            ...createLocalPhoto(file, event.id, participant.id),
            id: reservation.photoId,
            originalKey: reservation.objectKey,
          };
        },
      );

      setPhotos((currentPhotos) => [...optimisticPhotos, ...currentPhotos]);
      setUploadMessage(
        `Uploading ${optimisticPhotos.length} photo${
          optimisticPhotos.length === 1 ? "" : "s"
        } to private storage...`,
      );

      const completedPhotos = await Promise.all(
        reservationBody.reservations.map(async (reservation) => {
          const file = selectedFiles[reservation.fileIndex];
          await fetch(reservation.uploadUrl, {
            method: reservation.method,
            headers: reservation.headers,
            body: file,
          });

          const completionResponse = await fetch("/api/uploads/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              photoId: reservation.photoId,
              objectKey: reservation.objectKey,
            }),
          });
          const completionBody =
            await readJsonResponse<CompletionResponse>(completionResponse);

          if (!completionResponse.ok || !completionBody?.photo) {
            throw new Error(
              completionBody?.error ?? `Failed to process ${file.name}.`,
            );
          }

          return completionBody.photo;
        }),
      );

      setPhotos((currentPhotos) =>
        currentPhotos.map((photo) => {
          const completedPhoto = completedPhotos.find(
            (nextPhoto) => nextPhoto.id === photo.id,
          );
          return completedPhoto ?? photo;
        }),
      );
      setUploadMessage(
        `Uploaded ${completedPhotos.length} photo${
          completedPhotos.length === 1 ? "" : "s"
        }${reservationBody.skippedFiles?.length ? `; ${reservationBody.skippedFiles.length} skipped due to storage limits` : ""}.`,
      );
    } catch {
      const localPhotos = selectedFiles.map((file) =>
        createLocalPhoto(file, event.id, participant.id),
      );

      setPhotos((currentPhotos) => [...localPhotos, ...currentPhotos]);
      setUploadMessage(
        `Using local demo previews for ${localPhotos.length} photo${
          localPhotos.length === 1 ? "" : "s"
        }. Configure Supabase/R2 to persist uploads.`,
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
    }
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
    <main className="min-h-screen bg-canvas pb-28 text-ink">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-canvas sm:bg-canvas/90 sm:backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              BeenThere
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-2xl">
              {event.name}
            </h1>
          </div>
          <button
            aria-label={participant ? "Open guest profile" : "Join as a guest"}
            className="flex min-h-11 shrink-0 touch-manipulation items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-3 text-sm font-semibold shadow-sm transition hover:border-accent/30 active:scale-[0.98]"
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

        <div className="pointer-events-auto relative z-50 mx-auto w-full max-w-6xl space-y-3 px-5 pb-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0 sm:px-6">
          <fieldset className="flex w-full rounded-full bg-surface p-1 shadow-sm ring-1 ring-border sm:w-auto">
            <legend className="sr-only">Filter photos</legend>
            {FILTER_OPTIONS.map((option) => (
              <label
                className={`tap-target flex flex-1 cursor-pointer justify-center rounded-full px-3 py-2.5 text-center text-sm font-semibold transition active:scale-[0.98] sm:flex-none sm:px-4 ${
                  filter === option.id
                    ? "bg-ink text-surface"
                    : "text-ink-muted"
                }`}
                key={option.id}
              >
                <input
                  checked={filter === option.id}
                  className="sr-only"
                  name="gallery-filter"
                  onChange={() => setFilter(option.id)}
                  type="radio"
                  value={option.id}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          <input
            className="min-h-11 w-full rounded-full border border-border bg-surface px-4 py-2.5 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 sm:max-w-xs"
            onChange={(inputEvent) => setSearch(inputEvent.target.value)}
            placeholder="Search by name"
            value={search}
          />
        </div>

        {pendingPhotos ? (
          <div className="new-photos-banner border-b border-accent/20 bg-accent-soft px-5 py-3 sm:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">
                {pendingCount || "New"} photo
                {(pendingCount || 0) === 1 ? "" : "s"} just arrived
              </p>
              <button
                className="tap-target rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover active:scale-[0.98]"
                onClick={showPendingPhotos}
                type="button"
              >
                Show new
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative z-0 mx-auto w-full max-w-6xl px-5 pt-4 sm:px-6 sm:pt-5">

        {uploadMessage ? (
          <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink-muted">
            {uploadMessage}
          </p>
        ) : null}

        {filteredPhotos.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-semibold text-ink">No photos yet</p>
            <p className="mt-2 text-sm text-ink-muted">
              Be the first to add a moment from this event.
            </p>
          </div>
        ) : (
          <div
            className="gallery-masonry relative mt-4 sm:mt-5"
            ref={masonryRef}
          >
            {filteredPhotos.map((photo, index) => {
              const uploaderName = getUploaderName(photo);
              const isProcessing = photo.status !== "ready";
              const isSaved = savedPhotoIds.has(photo.id);

              return (
                <article
                  className="gallery-photo-enter group relative min-h-0 overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm"
                  key={photo.id}
                  style={{
                    animationDelay: `${Math.min(index, 14) * 35}ms`,
                    gridRowEnd: `span ${getGalleryRowSpan(photo, masonryWidth)}`,
                  }}
                >
                  <button
                    className="tap-target absolute inset-0 block touch-manipulation"
                    onClick={() => openLightbox(index)}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Photo by ${uploaderName}`}
                      className="pointer-events-none h-full w-full bg-border object-cover transition duration-300 group-hover:scale-[1.02]"
                      draggable={false}
                      src={photo.thumbnailUrl}
                    />
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
                  {isProcessing ? (
                    <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Processing
                    </span>
                  ) : null}
                  <button
                    aria-label={isSaved ? "Remove from saved" : "Save photo"}
                    className="save-pop tap-target absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 transition active:scale-95"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      void toggleSaved(photo.id);
                    }}
                    type="button"
                  >
                    <HeartIcon
                      className={`size-5 transition ${
                        isSaved ? "text-accent" : "text-white"
                      }`}
                      filled={isSaved}
                    />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bg-surface/95 sm:backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <p className="hidden text-sm text-ink-muted sm:block">
            {filteredPhotos.length} photo
            {filteredPhotos.length === 1 ? "" : "s"}
          </p>
          <label className="tap-target ml-auto inline-flex cursor-pointer items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-accent-hover active:scale-[0.98]">
            Add photos
            <input
              accept="image/jpeg,image/png,image/heic,image/heif"
              className="sr-only"
              multiple
              onChange={(inputEvent) => handleUpload(inputEvent.target.files)}
              ref={fileInputRef}
              type="file"
            />
          </label>
        </div>
      </div>

      {showIdentityForm ? (
        <IdentitySheet
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
