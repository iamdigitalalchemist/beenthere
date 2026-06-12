import { randomBytes } from "node:crypto";
import type { RequestCookies, ResponseCookies } from "next/dist/server/web/spec-extension/cookies";
import type { Pool, PoolClient } from "pg";
import { normalizeSocialHandles } from "@/lib/social-handles";
import { sha256Hex } from "@/server/crypto";
import { getDatabasePool } from "@/server/db";
import {
  generateGuestRecoveryCode,
  hashGuestRecoveryCode,
  isValidGuestRecoveryCode,
} from "@/server/guest-recovery";
import {
  isMissingParticipantColumnError,
  mapParticipantRow,
  PARTICIPANT_BASE_RETURNING_FIELDS,
  PARTICIPANT_BASE_SELECT_FIELDS,
  PARTICIPANT_RETURNING_FIELDS,
  PARTICIPANT_SELECT_FIELDS,
  type ParticipantRow,
} from "@/server/participant-mapper";
import type { GuestSocialHandles } from "@/types/domain";

export const GUEST_SESSION_COOKIE = "bt_session";

type CookieStore = RequestCookies | ResponseCookies;

export function createGuestSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function ensureGuestSession(
  cookies: CookieStore,
  options?: { secure?: boolean },
) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  let token = cookies.get(GUEST_SESSION_COOKIE)?.value;
  if (!token) {
    token = createGuestSessionToken();
    cookies.set(GUEST_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: options?.secure ?? false,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  const sessionTokenHash = sha256Hex(token);
  const { rows } = await pool.query<{ id: string }>(
    `insert into beenthere.guest_sessions (session_token_hash, last_seen_at)
      values ($1, now())
      on conflict (session_token_hash) do update
        set last_seen_at = excluded.last_seen_at
      returning id`,
    [sessionTokenHash],
  );

  return {
    id: rows[0].id,
    token,
  };
}

const ACTIVE_PARTICIPANT_QUERY = `
  from beenthere.guest_sessions gs
  join beenthere.guest_session_participants gsp
    on gsp.guest_session_id = gs.id
  join beenthere.event_participants ep
    on ep.id = gsp.event_participant_id
 where gs.session_token_hash = $1
   and ep.event_id = $2
   and gsp.active_for_event = true
   and ep.status = 'active'
 order by gsp.last_active_at desc
 limit 1`;

async function queryActiveParticipantRow(
  pool: Pool,
  tokenHash: string,
  eventId: string,
) {
  try {
    const { rows } = await pool.query<ParticipantRow>(
      `select ${PARTICIPANT_SELECT_FIELDS} ${ACTIVE_PARTICIPANT_QUERY}`,
      [tokenHash, eventId],
    );

    return rows[0];
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    const { rows } = await pool.query<ParticipantRow>(
      `select ${PARTICIPANT_BASE_SELECT_FIELDS} ${ACTIVE_PARTICIPANT_QUERY}`,
      [tokenHash, eventId],
    );

    return rows[0];
  }
}

async function insertEventParticipant(
  client: PoolClient,
  input: {
    eventId: string;
    displayName: string;
    consentVersion: string;
    socialHandles: ReturnType<typeof normalizeSocialHandles>;
    recoveryCodeHash?: string;
  },
) {
  try {
    const participantResult = await client.query<ParticipantRow>(
      `insert into beenthere.event_participants (
          event_id, role, display_name, consent_uploaded_at, consent_version,
          instagram_handle, facebook_handle, x_handle, tiktok_handle,
          recovery_code_hash
        )
        values ($1, 'guest', $2, now(), $3, $4, $5, $6, $7, $8)
        returning ${PARTICIPANT_RETURNING_FIELDS}`,
      [
        input.eventId,
        input.displayName,
        input.consentVersion,
        input.socialHandles.instagram || null,
        input.socialHandles.facebook || null,
        input.socialHandles.x || null,
        input.socialHandles.tiktok || null,
        input.recoveryCodeHash ?? null,
      ],
    );

    return participantResult.rows[0];
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    try {
      const participantResult = await client.query<ParticipantRow>(
        `insert into beenthere.event_participants (
            event_id, role, display_name, consent_uploaded_at, consent_version,
            instagram_handle, facebook_handle, x_handle, tiktok_handle
          )
          values ($1, 'guest', $2, now(), $3, $4, $5, $6, $7)
          returning ${PARTICIPANT_RETURNING_FIELDS}`,
        [
          input.eventId,
          input.displayName,
          input.consentVersion,
          input.socialHandles.instagram || null,
          input.socialHandles.facebook || null,
          input.socialHandles.x || null,
          input.socialHandles.tiktok || null,
        ],
      );

      return participantResult.rows[0];
    } catch (nestedError) {
      if (!isMissingParticipantColumnError(nestedError)) {
        throw nestedError;
      }
    }

    const participantResult = await client.query<ParticipantRow>(
      `insert into beenthere.event_participants (
          event_id, role, display_name, consent_uploaded_at, consent_version
        )
        values ($1, 'guest', $2, now(), $3)
        returning ${PARTICIPANT_BASE_RETURNING_FIELDS}`,
      [input.eventId, input.displayName, input.consentVersion],
    );

    return participantResult.rows[0];
  }
}

async function linkParticipantToGuestSession(
  client: PoolClient,
  input: {
    guestSessionId: string;
    eventId: string;
    participantId: string;
  },
) {
  await client.query(
    `update beenthere.guest_session_participants gsp
        set active_for_event = false
      from beenthere.event_participants ep
     where gsp.event_participant_id = ep.id
       and gsp.guest_session_id = $1
       and ep.event_id = $2`,
    [input.guestSessionId, input.eventId],
  );
  await client.query(
    `insert into beenthere.guest_session_participants (
        guest_session_id, event_participant_id, active_for_event, last_active_at
      )
      values ($1, $2, true, now())
      on conflict (guest_session_id, event_participant_id) do update
        set active_for_event = true,
            last_active_at = excluded.last_active_at`,
    [input.guestSessionId, input.participantId],
  );
}

async function findActiveParticipantRow(
  client: PoolClient,
  input: {
    eventId: string;
    participantId?: string;
    recoveryCodeHash?: string;
  },
) {
  const lookupValue = input.participantId ?? input.recoveryCodeHash;

  if (!lookupValue) {
    return undefined;
  }

  const lookupClause = input.participantId
    ? "ep.id = $1"
    : "ep.recovery_code_hash = $1";

  try {
    const participantResult = await client.query<ParticipantRow>(
      `select ${PARTICIPANT_SELECT_FIELDS}
         from beenthere.event_participants ep
        where ${lookupClause}
          and ep.event_id = $2
          and ep.status = 'active'
        limit 1`,
      [lookupValue, input.eventId],
    );

    return participantResult.rows[0];
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    const participantResult = await client.query<ParticipantRow>(
      `select ${PARTICIPANT_BASE_SELECT_FIELDS}
         from beenthere.event_participants ep
        where ${lookupClause}
          and ep.event_id = $2
          and ep.status = 'active'
        limit 1`,
      [lookupValue, input.eventId],
    );

    return participantResult.rows[0];
  }
}

export async function getActiveParticipantForSession(input: {
  eventId: string;
  cookies: CookieStore;
}) {
  const pool = getDatabasePool();
  const token = input.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (!pool || !token) {
    return undefined;
  }

  const row = await queryActiveParticipantRow(
    pool,
    sha256Hex(token),
    input.eventId,
  );

  return row ? mapParticipantRow(row) : undefined;
}

export async function resumeParticipantForSession(input: {
  eventId: string;
  participantId?: string;
  recoveryCode?: string;
  cookies: CookieStore;
  secureCookies?: boolean;
}) {
  if (!input.participantId && !input.recoveryCode) {
    throw new Error("participantId or recoveryCode is required.");
  }

  if (input.recoveryCode && !isValidGuestRecoveryCode(input.recoveryCode)) {
    throw new Error("That guest code does not look valid.");
  }

  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const session = await ensureGuestSession(input.cookies, {
    secure: input.secureCookies,
  });
  const client = await pool.connect();

  try {
    await client.query("begin");

    const participant = await findActiveParticipantRow(client, {
      eventId: input.eventId,
      participantId: input.participantId,
      recoveryCodeHash: input.recoveryCode
        ? hashGuestRecoveryCode(input.recoveryCode)
        : undefined,
    });

    if (!participant) {
      throw new Error(
        input.recoveryCode
          ? "No guest profile matches that code."
          : "Guest profile not found for this event.",
      );
    }

    await linkParticipantToGuestSession(client, {
      guestSessionId: session.id,
      eventId: input.eventId,
      participantId: participant.id,
    });

    await client.query("commit");
    return mapParticipantRow(participant);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createParticipantForSession(input: {
  eventId: string;
  displayName: string;
  consentVersion: string;
  socialHandles?: Partial<GuestSocialHandles>;
  cookies: CookieStore;
  secureCookies?: boolean;
}) {
  const pool = getDatabasePool();

  if (!pool) {
    throw new Error("POSTGRES_URL is not configured.");
  }

  const socialHandles = normalizeSocialHandles(input.socialHandles);
  const session = await ensureGuestSession(input.cookies, {
    secure: input.secureCookies,
  });
  const client = await pool.connect();

  const recoveryCode = generateGuestRecoveryCode();

  try {
    await client.query("begin");
    const participant = await insertEventParticipant(client, {
      eventId: input.eventId,
      displayName: input.displayName,
      consentVersion: input.consentVersion,
      socialHandles,
      recoveryCodeHash: hashGuestRecoveryCode(recoveryCode),
    });

    await linkParticipantToGuestSession(client, {
      guestSessionId: session.id,
      eventId: input.eventId,
      participantId: participant.id,
    });

    await client.query("commit");
    return {
      participant: await mapParticipantRow(participant),
      recoveryCode,
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function regenerateRecoveryCodeForSession(input: {
  eventId: string;
  participantId: string;
  cookies: CookieStore;
}) {
  const pool = getDatabasePool();
  const token = input.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (!pool || !token) {
    throw new Error("Guest session is not available.");
  }

  const recoveryCode = generateGuestRecoveryCode();
  const tokenHash = sha256Hex(token);

  try {
    const { rows } = await pool.query<{ id: string }>(
      `update beenthere.event_participants ep
          set recovery_code_hash = $4,
              updated_at = now()
        from beenthere.guest_session_participants gsp
        join beenthere.guest_sessions gs
          on gs.id = gsp.guest_session_id
       where ep.id = $1
         and ep.event_id = $2
         and gsp.event_participant_id = ep.id
         and gs.session_token_hash = $3
         and gsp.active_for_event = true
      returning ep.id`,
      [
        input.participantId,
        input.eventId,
        tokenHash,
        hashGuestRecoveryCode(recoveryCode),
      ],
    );

    if (!rows[0]) {
      throw new Error("Participant not found for this session.");
    }

    return { recoveryCode };
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    throw new Error(
      "Guest codes are not available until the database migration is applied.",
    );
  }
}

export async function updateParticipantProfile(input: {
  participantId: string;
  displayName: string;
  socialHandles?: Partial<GuestSocialHandles>;
  profilePhotoKey?: string | null;
  cookies: CookieStore;
}) {
  const pool = getDatabasePool();
  const token = input.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (!pool || !token) {
    throw new Error("Guest session is not available.");
  }

  const socialHandles = normalizeSocialHandles(input.socialHandles);
  const tokenHash = sha256Hex(token);

  try {
    const { rows } = await pool.query<ParticipantRow>(
      `update beenthere.event_participants ep
          set display_name = $3,
              instagram_handle = $4,
              facebook_handle = $5,
              x_handle = $6,
              tiktok_handle = $7,
              profile_photo_key = coalesce($8, ep.profile_photo_key),
              updated_at = now()
        from beenthere.guest_session_participants gsp
        join beenthere.guest_sessions gs
          on gs.id = gsp.guest_session_id
       where ep.id = $1
         and gsp.event_participant_id = ep.id
         and gs.session_token_hash = $2
      returning ${PARTICIPANT_SELECT_FIELDS}`,
      [
        input.participantId,
        tokenHash,
        input.displayName,
        socialHandles.instagram || null,
        socialHandles.facebook || null,
        socialHandles.x || null,
        socialHandles.tiktok || null,
        input.profilePhotoKey ?? null,
      ],
    );

    if (!rows[0]) {
      throw new Error("Participant not found for this session.");
    }

    return mapParticipantRow(rows[0]);
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    const { rows } = await pool.query<ParticipantRow>(
      `update beenthere.event_participants ep
          set display_name = $3,
              updated_at = now()
        from beenthere.guest_session_participants gsp
        join beenthere.guest_sessions gs
          on gs.id = gsp.guest_session_id
       where ep.id = $1
         and gsp.event_participant_id = ep.id
         and gs.session_token_hash = $2
      returning ${PARTICIPANT_BASE_SELECT_FIELDS}`,
      [input.participantId, tokenHash, input.displayName],
    );

    if (!rows[0]) {
      throw new Error("Participant not found for this session.");
    }

    return mapParticipantRow(rows[0]);
  }
}

export async function setParticipantProfilePhotoKey(input: {
  participantId: string;
  profilePhotoKey: string;
  cookies: CookieStore;
}) {
  const pool = getDatabasePool();
  const token = input.cookies.get(GUEST_SESSION_COOKIE)?.value;

  if (!pool || !token) {
    throw new Error("Guest session is not available.");
  }

  const tokenHash = sha256Hex(token);

  try {
    const { rows } = await pool.query<ParticipantRow>(
      `update beenthere.event_participants ep
          set profile_photo_key = $3,
              updated_at = now()
        from beenthere.guest_session_participants gsp
        join beenthere.guest_sessions gs
          on gs.id = gsp.guest_session_id
       where ep.id = $1
         and gsp.event_participant_id = ep.id
         and gs.session_token_hash = $2
      returning ${PARTICIPANT_SELECT_FIELDS}`,
      [input.participantId, tokenHash, input.profilePhotoKey],
    );

    if (!rows[0]) {
      throw new Error("Participant not found for this session.");
    }

    return mapParticipantRow(rows[0]);
  } catch (error) {
    if (!isMissingParticipantColumnError(error)) {
      throw error;
    }

    const eventResult = await pool.query<{ event_id: string }>(
      `select event_id from beenthere.event_participants where id = $1 limit 1`,
      [input.participantId],
    );
    const eventId = eventResult.rows[0]?.event_id;

    if (!eventId) {
      throw new Error("Participant not found for this session.");
    }

    const row = await queryActiveParticipantRow(pool, tokenHash, eventId);

    if (!row || row.id !== input.participantId) {
      throw new Error("Participant not found for this session.");
    }

    return mapParticipantRow(row);
  }
}
