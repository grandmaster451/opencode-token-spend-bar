import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import BetterSqlite3 from 'better-sqlite3';
import type { Database } from 'better-sqlite3';

import { getCurrentMonthBounds } from '../domain/period';
import { normalizeProvider, type ProviderBucket } from '../domain/provider';
import { getTokenCount, type TokenPayload } from '../domain/tokens';

export type MessageRecord = {
  id: string;
  sessionID: string;
  role: string;
  providerID: string;
  cost: number | null;
  tokens: TokenPayload;
  timestamp: number;
};

export type StepFinishRecord = {
  messageID: string;
  cost: number | null;
  tokens: TokenPayload;
};

export type UsageRecord = {
  provider: ProviderBucket;
  tokens: number;
  cost: number | null;
  timestamp: number;
};

type SqlRow = {
  id: string;
  sessionID: string;
  messageID?: string;
  data: string;
};

type JsonObject = Record<string, unknown>;

export function getOpencodeDbPath(): string {
  const configuredPath = process.env.OPENCODE_DB_PATH ?? process.env.TOKEN_SPEND_BAR_OPENCODE_DB_PATH;

  if (configuredPath && configuredPath.trim().length > 0) {
    return configuredPath;
  }

  const dataHome = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share');
  return path.join(dataHome, 'opencode', 'opencode.db');
}

export function ensureDbExists(): boolean {
  return fs.existsSync(getOpencodeDbPath());
}

export function queryCurrentMonthMessages(db: Pick<Database, 'prepare'>): MessageRecord[] {
  const { start, end } = getCurrentMonthBounds();
  const rows = db
    .prepare(
      `
        SELECT
          id,
          session_id AS sessionID,
          data
        FROM message
        WHERE json_extract(data, '$.time.created') >= ?
          AND json_extract(data, '$.time.created') < ?
      `,
    )
    .all(start.getTime(), end.getTime()) as SqlRow[];

  return rows.flatMap((row) => {
    const parsed = safeParseJson(row.data);
    if (!parsed) {
      return [];
    }

    const time = getOptionalObject(parsed.time);
    const model = getOptionalObject(parsed.model);
    const timestamp = toFiniteNumber(time?.created);
    const providerID = toStringValue(parsed.providerID) ?? toStringValue(model?.providerID);
    const role = toStringValue(parsed.role) ?? 'unknown';

    if (timestamp === null || providerID === null) {
      return [];
    }

    return [{
      id: row.id,
      sessionID: row.sessionID,
      role,
      providerID,
      cost: toNullableNumber(parsed.cost),
      tokens: toTokenPayload(parsed.tokens),
      timestamp,
    }];
  });
}

export function queryStepFinishParts(
  db: Pick<Database, 'prepare'>,
  messageIds: string[],
): StepFinishRecord[] {
  if (messageIds.length === 0) {
    return [];
  }

  const placeholders = messageIds.map(() => '?').join(', ');
  const rows = db
    .prepare(
      `
        SELECT
          message_id AS messageID,
          data
        FROM part
        WHERE json_extract(data, '$.type') = 'step-finish'
          AND message_id IN (${placeholders})
      `,
    )
    .all(...messageIds) as SqlRow[];

  return rows.flatMap((row) => {
    const parsed = safeParseJson(row.data);
    if (!parsed || row.messageID === undefined) {
      return [];
    }

    return [{
      messageID: row.messageID,
      cost: toNullableNumber(parsed.cost),
      tokens: toTokenPayload(parsed.tokens),
    }];
  });
}

export function normalizeMessageRecord(record: MessageRecord): UsageRecord | null {
  const provider = normalizeProvider(record.providerID);
  if (provider === null) {
    return null;
  }

  const tokens = getTokenCount(record.tokens);
  if (tokens === 0 && record.cost === null) {
    return null;
  }

  return {
    provider,
    tokens,
    cost: record.cost,
    timestamp: record.timestamp,
  };
}

export function scanCurrentMonthHistory(): UsageRecord[] {
  const dbPath = getOpencodeDbPath();

  if (!ensureDbExists()) {
    console.warn(`[token-spend-bar] OpenCode database not found at ${dbPath}.`);
    return [];
  }

  let db: BetterSqlite3.Database | null = null;

  try {
    db = new BetterSqlite3(dbPath, { readonly: true });
  } catch (error) {
    console.warn(`[token-spend-bar] Failed to open OpenCode database at ${dbPath}.`, error);
    return [];
  }

  try {
    const messages = queryCurrentMonthMessages(db);
    const stepFinishParts = queryStepFinishParts(
      db,
      messages.map((message) => message.id),
    );
    const stepFinishByMessage = groupStepFinishParts(stepFinishParts);

    return messages.flatMap((message) => {
      const parts = stepFinishByMessage.get(message.id);
      const mergedMessage = parts ? mergeMessageUsage(message, parts) : message;
      const normalized = normalizeMessageRecord(mergedMessage);

      return normalized ? [normalized] : [];
    });
  } catch (error) {
    console.warn('[token-spend-bar] Failed to query usage history from the OpenCode database.', error);
    return [];
  } finally {
    try {
      db.close();
    } catch (error) {
      console.warn('[token-spend-bar] Failed to close the OpenCode database connection cleanly.', error);
    }
  }
}

function groupStepFinishParts(parts: StepFinishRecord[]): Map<string, StepFinishRecord[]> {
  const grouped = new Map<string, StepFinishRecord[]>();

  for (const part of parts) {
    const existing = grouped.get(part.messageID);
    if (existing) {
      existing.push(part);
      continue;
    }

    grouped.set(part.messageID, [part]);
  }

  return grouped;
}

function mergeMessageUsage(message: MessageRecord, parts: StepFinishRecord[]): MessageRecord {
  const totalTokens = parts.reduce((sum, part) => sum + getTokenCount(part.tokens), 0);
  const costs = parts
    .map((part) => part.cost)
    .filter((cost): cost is number => cost !== null);

  return {
    ...message,
    cost: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) : message.cost,
    tokens: { total: totalTokens },
  };
}

function safeParseJson(value: string): JsonObject | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function toTokenPayload(value: unknown): TokenPayload {
  if (!isJsonObject(value)) {
    return null;
  }

  const cache = getOptionalObject(value.cache);

  return {
    total: toNullableNumber(value.total) ?? undefined,
    input: toNullableNumber(value.input) ?? undefined,
    output: toNullableNumber(value.output) ?? undefined,
    reasoning: toNullableNumber(value.reasoning) ?? undefined,
    cache: cache
      ? {
          read: toNullableNumber(cache.read) ?? undefined,
          write: toNullableNumber(cache.write) ?? undefined,
        }
      : undefined,
  };
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getOptionalObject(value: unknown): JsonObject | null {
  return isJsonObject(value) ? value : null;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null;
}
