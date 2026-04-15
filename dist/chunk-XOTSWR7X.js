// src/components/ErrorFallback.tsx
import { createElement, insert, setProp } from "@opentui/solid";
function ErrorFallback(props) {
  console.error("[TokenSpendBar] Error:", props.error.message, props.error.stack);
  const box = createElement("box");
  setProp(box, "flexDirection", "column");
  setProp(box, "borderStyle", "round");
  const title = createElement("text");
  insert(title, "Token spend (error)");
  insert(box, title);
  const msg = createElement("text");
  insert(msg, truncate(props.error.message, 60));
  insert(box, msg);
  return box;
}
function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "\u2026" : str;
}

// src/components/SessionSpendWidget.tsx
import { createElement as createElement3, insert as insert3, setProp as setProp2 } from "@opentui/solid";

// src/components/format-row.ts
var NARROW_THRESHOLD = 40;
function padEnd(str, length) {
  return str.length >= length ? str : str + " ".repeat(length - str.length);
}
function formatRowNormal(row, labelWidth) {
  const remaining = row.remainingFormatted;
  const paddedLabel = padEnd(row.label, labelWidth);
  const parts = [`${paddedLabel}  ${remaining}`];
  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }
  if (row.percentage !== null) {
    parts.push(`| ${row.percentage}% used`);
  }
  return parts.join("  ");
}
function formatRowNarrow(row) {
  const remaining = row.remainingFormatted;
  const parts = [`${row.label}:${remaining}`];
  if (row.showCost && row.costFormatted !== null) {
    parts.push(`(${row.costFormatted})`);
  }
  if (row.percentage !== null) {
    parts.push(`${row.percentage}%`);
  }
  return parts.join("/");
}
function formatRow(row, narrow, labelWidth = 0) {
  return narrow ? formatRowNarrow(row) : formatRowNormal(row, labelWidth);
}

// src/components/AnimatedNumber.tsx
import { createSignal, createEffect, onCleanup, untrack, batch } from "solid-js";
import { createElement as createElement2, insert as insert2 } from "@opentui/solid";
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function shouldSkipAnimation(from, to) {
  const reference = Math.max(Math.abs(from), Math.abs(to), 1);
  return Math.abs(to - from) < reference * 0.01;
}
function interpolateValue(from, to, easedProgress) {
  return from + (to - from) * easedProgress;
}
var DEFAULT_DURATION = 400;
function useAnimatedNumber(getValue, options = {}) {
  const duration = options.duration ?? DEFAULT_DURATION;
  const [displayValue, setDisplayValue] = createSignal(getValue());
  let rafHandle = null;
  let anim = {
    target: getValue(),
    startValue: getValue(),
    startTime: 0,
    elapsed: 0,
    // accumulated elapsed time across rAF frames
    active: false
  };
  let lastTimestamp = -1;
  let lastSource = getValue();
  let displayValueRef = getValue();
  const tick = (timestamp) => {
    if (!anim.active) return;
    if (lastTimestamp < 0) {
      lastTimestamp = timestamp;
    } else {
      anim.elapsed += timestamp - lastTimestamp;
      lastTimestamp = timestamp;
    }
    const progress = Math.min(anim.elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    displayValueRef = interpolateValue(anim.startValue, anim.target, eased);
    if (progress < 1) {
      rafHandle = requestAnimationFrame(tick);
    } else {
      rafHandle = null;
      anim.active = false;
      lastTimestamp = -1;
    }
  };
  const isVitest = typeof process !== "undefined" && process.env.VITEST === "true";
  const isBrowser = typeof window !== "undefined" && typeof requestAnimationFrame !== "undefined" && !isVitest;
  if (isBrowser) {
    createEffect(() => {
      const target = getValue();
      const current = untrack(displayValue);
      if (shouldSkipAnimation(current, target)) {
        batch(() => {
          setDisplayValue(target);
          anim.target = target;
          anim.active = false;
        });
        return;
      }
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
      anim.target = target;
      anim.startValue = current;
      anim.startTime = 0;
      anim.active = true;
      rafHandle = requestAnimationFrame(tick);
    });
    onCleanup(() => {
      anim.active = false;
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
      }
    });
    return displayValue;
  }
  anim.active = false;
  lastTimestamp = -1;
  onCleanup(() => {
    anim.active = false;
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
    }
  });
  return () => {
    const source = getValue();
    if (source !== lastSource) {
      const current = displayValueRef;
      lastSource = source;
      if (shouldSkipAnimation(current, source)) {
        displayValueRef = source;
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        anim.active = false;
      } else {
        if (rafHandle !== null) {
          cancelAnimationFrame(rafHandle);
          rafHandle = null;
        }
        anim.target = source;
        anim.startValue = current;
        anim.startTime = 0;
        anim.elapsed = 0;
        anim.active = true;
        lastTimestamp = -1;
        let ts = 0;
        const maxTicks = Math.ceil(duration / 16) + 3;
        for (let i = 0; i < maxTicks; i++) {
          if (!anim.active) break;
          ts = i * 16;
          if (ts > duration) ts = duration + 1;
          if (lastTimestamp < 0) {
            lastTimestamp = ts;
          } else {
            anim.elapsed += ts - lastTimestamp;
            lastTimestamp = ts;
          }
          const progress = Math.min(anim.elapsed / duration, 1);
          const eased = easeOutCubic(progress);
          displayValueRef = interpolateValue(anim.startValue, anim.target, eased);
          if (progress >= 1) {
            anim.active = false;
            lastTimestamp = -1;
            break;
          }
        }
      }
    }
    return displayValueRef;
  };
}

// src/domain/formatter.ts
function formatTokens(count) {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function formatCost(amount, currency) {
  if (amount === null) {
    return null;
  }
  return `${currency}${amount.toFixed(2)}`;
}
function shouldShowCost(bucket) {
  return bucket !== "chatgpt-plus";
}
function calculateSpentPercentage(spent, limit) {
  if (limit === null || limit <= 0) {
    return null;
  }
  const percentage = spent / limit * 100;
  return Math.round(percentage * 100) / 100;
}

// src/components/SessionSpendWidget.tsx
function SessionSpendWidget(props) {
  const columns = props.columns ?? 80;
  const narrow = columns < NARROW_THRESHOLD;
  const maxLabelWidth = props.viewModel.rows.reduce((max, row) => Math.max(max, row.label.length), 0);
  const box = createElement3("box");
  setProp2(box, "flexDirection", "column");
  const heading = createElement3("text");
  if (props.colors?.text) {
    setProp2(heading, "fg", props.colors.text);
  }
  insert3(heading, props.viewModel.heading);
  insert3(box, heading);
  for (const row of props.viewModel.rows) {
    const animatedDisplay = useAnimatedNumber(() => row.tokens);
    const text = createElement3("text");
    if (props.colors?.muted) {
      setProp2(text, "fg", props.colors.muted);
    }
    insert3(text, () => {
      const animatedTokens = formatTokens(animatedDisplay());
      const animatedRow = { ...row, remainingFormatted: `${animatedTokens}${row.remainingFormatted.slice(row.tokensFormatted.length)}` };
      return formatRow(animatedRow, narrow, maxLabelWidth);
    });
    insert3(box, text);
  }
  return box;
}

// src/domain/provider.ts
var PROVIDER_LABELS = {
  minimax: "MM",
  "opencode-go": "OCG",
  "chatgpt-plus": "GPT+"
};
function normalizeProvider(rawProviderID) {
  switch (rawProviderID) {
    case "minimax":
      return "minimax";
    case "opencode-go":
      return "opencode-go";
    case "openai":
      return "chatgpt-plus";
    default:
      return null;
  }
}
function getProviderDisplayLabel(bucket) {
  return PROVIDER_LABELS[bucket];
}
function isProviderBucket(value) {
  return value === "minimax" || value === "opencode-go" || value === "chatgpt-plus";
}

// src/domain/tokens.ts
function getTokenCount(tokens) {
  if (!tokens) {
    return 0;
  }
  if (typeof tokens.total === "number" && Number.isFinite(tokens.total)) {
    return tokens.total;
  }
  const values = [
    tokens.input,
    tokens.output,
    tokens.reasoning,
    tokens.cache?.read,
    tokens.cache?.write
  ].map((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
  return values.reduce((sum, value) => sum + value, 0);
}

// src/adapters/chatgpt-usage.ts
var WHAM_USAGE_ENDPOINT = "https://chatgpt.com/backend-api/wham/usage";
async function fetchChatGPTUsage(token) {
  try {
    const response = await fetch(WHAM_USAGE_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.warn(`[token-spend-bar] ChatGPT usage endpoint returned ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (!response.ok) {
      console.warn(`[token-spend-bar] ChatGPT usage endpoint returned ${response.status}`);
      return null;
    }
    const usedRequests = data.await_guilds;
    const usedTokens = data.await_usage;
    if (usedRequests === void 0 && usedTokens === void 0) {
      return null;
    }
    const REQUEST_LIMIT = 100;
    const TOKEN_LIMIT = 1e6;
    const remainingRequests = Math.max(0, REQUEST_LIMIT - usedRequests);
    const remainingTokens = Math.max(0, TOKEN_LIMIT - usedTokens);
    return {
      requests: {
        limit: REQUEST_LIMIT,
        remaining: remainingRequests,
        percentage: calculatePercentage(REQUEST_LIMIT, remainingRequests)
      },
      tokens: {
        limit: TOKEN_LIMIT,
        remaining: remainingTokens,
        percentage: calculatePercentage(TOKEN_LIMIT, remainingTokens)
      }
    };
  } catch (error) {
    console.warn("[token-spend-bar] Failed to fetch ChatGPT usage data from unofficial endpoint.");
    return null;
  }
}
function calculatePercentage(limit, remaining) {
  if (limit === 0) {
    return 0;
  }
  const used = limit - remaining;
  return Math.round(used / limit * 100 * 100) / 100;
}

// src/adapters/minimax-quota.ts
var MINI_MAX_API_BASE = "https://api.minimax.chat";
var ENDPOINT = "/v1/api/openplatform/coding_plan/remains";
async function fetchMiniMaxQuota(cookie) {
  const url = `${MINI_MAX_API_BASE}${ENDPOINT}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json"
    }
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`MiniMax authentication failed: ${response.status} ${response.statusText}`);
  }
  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const remaining = data.current_interval_usage_count ?? 0;
  const total = data.current_interval_total_count ?? 0;
  const used = total - remaining;
  return {
    requests: {
      limit: total,
      remaining,
      used,
      percentage: total > 0 ? Math.round(used / total * 1e4) / 100 : 0
    }
  };
}

// src/services/quota-aggregator.ts
var CACHE_TTL_MS = 5 * 60 * 1e3;
var QuotaAggregator = class {
  constructor(config = {}) {
    this.config = config;
  }
  config;
  cache = /* @__PURE__ */ new Map();
  /**
   * Fetches quota data for a provider with caching and priority fallback.
   *
   * Priority order:
   * 1. Cache (if valid, return immediately)
   * 2. API (try to fetch fresh data)
   * 3. Config fallback (return static limits if API fails)
   *
   * @param provider - The provider bucket ('minimax' | 'opencode-go' | 'chatgpt-plus')
   * @returns Promise<QuotaData | null> - Quota data or null if unavailable
   */
  async getQuota(provider) {
    if (!this.isValidProvider(provider)) {
      return null;
    }
    const bucket = provider;
    const cached = this.getCached(bucket);
    if (cached !== null) {
      return cached;
    }
    const result = await this.fetchWithPriority(bucket);
    if (result === null) {
      return this.getConfigFallback(bucket);
    }
    this.setCache(bucket, result.data);
    return result.data;
  }
  /**
   * Clears the cache for a specific provider or all providers.
   */
  clearCache(provider) {
    if (provider) {
      this.cache.delete(provider);
    } else {
      this.cache.clear();
    }
  }
  /**
   * Gets cached quota data if still valid.
   */
  getCached(provider) {
    const entry = this.cache.get(provider);
    if (entry === void 0) {
      return null;
    }
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL_MS) {
      this.cache.delete(provider);
      return null;
    }
    return entry.data;
  }
  /**
   * Sets quota data in cache.
   */
  setCache(provider, data) {
    this.cache.set(provider, {
      data,
      timestamp: Date.now()
    });
  }
  /**
   * Fetches quota data using priority fallback: API → config
   */
  async fetchWithPriority(provider) {
    switch (provider) {
      case "minimax":
        return this.fetchMiniMaxQuotaWithFallback();
      case "chatgpt-plus":
        return this.fetchChatGPTQuotaWithFallback();
      case "opencode-go":
        return null;
      default:
        return null;
    }
  }
  /**
   * Fetches MiniMax quota with graceful error handling.
   * MiniMax adapter doesn't support headers (real-time) - only API mode.
   */
  async fetchMiniMaxQuotaWithFallback() {
    if (!this.config.minimaxCookie) {
      return null;
    }
    try {
      const data = await fetchMiniMaxQuota(this.config.minimaxCookie);
      return { data, source: "api" };
    } catch (error) {
      console.warn("[quota-aggregator] MiniMax quota fetch failed:", error);
      return null;
    }
  }
  /**
   * Fetches ChatGPT quota with graceful error handling.
   * Tries the unofficial API endpoint.
   *
   * Note: The 'headers' priority would be used if we had access to real-time
   * headers from ChatGPT API responses. Currently, we only support API mode.
   */
  async fetchChatGPTQuotaWithFallback() {
    if (!this.config.chatgptToken) {
      return null;
    }
    try {
      const data = await fetchChatGPTUsage(this.config.chatgptToken);
      if (data === null) {
        return null;
      }
      return { data, source: "api" };
    } catch (error) {
      console.warn("[quota-aggregator] ChatGPT quota fetch failed:", error);
      return null;
    }
  }
  /**
   * Returns config-based fallback quota data when all API sources fail.
   */
  getConfigFallback(provider) {
    const limits = this.config.fallbackLimits;
    if (provider === "opencode-go" || !limits) {
      return null;
    }
    return {
      requests: {
        limit: limits.requests ?? 0,
        remaining: limits.requests ?? 0,
        percentage: 0
      },
      tokens: {
        limit: limits.tokens ?? 0,
        remaining: limits.tokens ?? 0,
        percentage: 0
      }
    };
  }
  /**
   * Validates that the provider is a known ProviderBucket.
   */
  isValidProvider(provider) {
    return provider === "minimax" || provider === "opencode-go" || provider === "chatgpt-plus";
  }
};
function createQuotaAggregator(config) {
  return new QuotaAggregator(config);
}

// src/domain/row-state.ts
var ROW_ORDER = ["minimax", "opencode-go", "chatgpt-plus"];
function createEmptyRowState(bucket) {
  return {
    bucket,
    tokens: 0,
    cost: 0,
    remaining: null,
    percentage: null
  };
}

// src/state/kv-ledger.ts
var KV_NAMESPACE_PREFIX = "token-spend-bar:v1";
var LEDGER_SCHEMA_VERSION = 1;
var MAX_PROCESSED_FINGERPRINTS = 1e4;
var SCHEMA_VERSION_KEY = `${KV_NAMESPACE_PREFIX}:schema:version`;
var ACTIVE_MONTH_KEY = `${KV_NAMESPACE_PREFIX}:meta:currentMonth`;
var MISSING = /* @__PURE__ */ Symbol("missing");
function getCurrentMonthKey(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function buildLedgerKey(month, type, id) {
  return `${KV_NAMESPACE_PREFIX}:${month}:${type}:${id}`;
}
function createLedger(kv) {
  const loaded = loadLedgerState(kv);
  let state = loaded.state;
  let rebuildRequired = loaded.shouldRebuild;
  return {
    isRecordProcessed(fingerprint) {
      return state.fingerprintOrder.includes(fingerprint);
    },
    markRecordProcessed(fingerprint) {
      const idx = state.fingerprintOrder.indexOf(fingerprint);
      if (idx !== -1) {
        state.fingerprintOrder.splice(idx, 1);
      }
      state.fingerprintOrder.push(fingerprint);
      state.processedFingerprints.add(fingerprint);
      if (state.fingerprintOrder.length > MAX_PROCESSED_FINGERPRINTS) {
        const evicted = state.fingerprintOrder.shift();
        if (evicted) {
          state.processedFingerprints.delete(evicted);
        }
      }
    },
    updateAggregate(provider, tokens, cost) {
      const existing = state.aggregates.find((aggregate) => aggregate.provider === provider);
      if (!existing) {
        state.aggregates.push({
          month: state.currentMonth,
          provider,
          tokens,
          cost
        });
        return;
      }
      existing.tokens += tokens;
      existing.cost = existing.cost === null || cost === null ? null : existing.cost + cost;
    },
    getAggregates() {
      return state.aggregates.map((aggregate) => ({ ...aggregate }));
    },
    shouldRebuild() {
      return rebuildRequired;
    },
    triggerRebuild() {
      state = createEmptyLedgerState(state.currentMonth);
      rebuildRequired = true;
    },
    save() {
      saveLedgerState(kv, state);
      rebuildRequired = false;
    }
  };
}
function loadLedgerState(kv) {
  const currentMonth = getCurrentMonthKey();
  const schemaVersion = kv.get(SCHEMA_VERSION_KEY, MISSING);
  const activeMonth = kv.get(ACTIVE_MONTH_KEY, MISSING);
  const kvIsEmpty = schemaVersion === MISSING && activeMonth === MISSING;
  if (kvIsEmpty) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  if (schemaVersion !== LEDGER_SCHEMA_VERSION) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  if (activeMonth !== currentMonth) {
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
  try {
    const aggregateProviders = readStringArray(
      kv.get(buildLedgerKey(currentMonth, "meta", "aggregateProviders"), [])
    );
    const processedFingerprints = readStringArray(
      kv.get(buildLedgerKey(currentMonth, "meta", "processedFingerprints"), [])
    );
    const fingerprintOrder = readStringArray(
      kv.get(buildLedgerKey(currentMonth, "meta", "fingerprintOrder"), [])
    ).reverse();
    const aggregates = aggregateProviders.map((provider) => {
      const aggregate = kv.get(buildLedgerKey(currentMonth, "aggregate", provider), null);
      return validateAggregate(aggregate, currentMonth);
    });
    return {
      state: {
        schemaVersion: LEDGER_SCHEMA_VERSION,
        currentMonth,
        aggregates,
        // Use processedFingerprints array to build Set (fingerprintOrder may be empty/missing on reload)
        processedFingerprints: new Set(processedFingerprints),
        fingerprintOrder
      },
      shouldRebuild: false
    };
  } catch (error) {
    console.warn("[token-spend-bar] Corrupt KV ledger detected, rebuilding state.", error);
    return { state: createEmptyLedgerState(currentMonth), shouldRebuild: true };
  }
}
function saveLedgerState(kv, state) {
  kv.set(SCHEMA_VERSION_KEY, state.schemaVersion);
  kv.set(ACTIVE_MONTH_KEY, state.currentMonth);
  kv.set(buildLedgerKey(state.currentMonth, "meta", "lastRebuild"), Date.now());
  const aggregateProviders = state.aggregates.map((aggregate) => aggregate.provider);
  kv.set(buildLedgerKey(state.currentMonth, "meta", "aggregateProviders"), aggregateProviders);
  for (const aggregate of state.aggregates) {
    kv.set(buildLedgerKey(state.currentMonth, "aggregate", aggregate.provider), aggregate);
  }
  const processedFingerprints = [...state.processedFingerprints];
  kv.set(
    buildLedgerKey(state.currentMonth, "meta", "processedFingerprints"),
    processedFingerprints
  );
  kv.set(
    buildLedgerKey(state.currentMonth, "meta", "fingerprintOrder"),
    [...state.fingerprintOrder].reverse()
  );
  for (const fingerprint of processedFingerprints) {
    kv.set(buildLedgerKey(state.currentMonth, "processed", fingerprint), true);
  }
}
function createEmptyLedgerState(currentMonth) {
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    currentMonth,
    aggregates: [],
    processedFingerprints: /* @__PURE__ */ new Set(),
    fingerprintOrder: []
  };
}
function readStringArray(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Expected string array in KV ledger metadata.");
  }
  return value;
}
function validateAggregate(value, currentMonth) {
  if (!isRecord(value)) {
    throw new Error("Aggregate entry must be an object.");
  }
  const { month, provider, tokens, cost } = value;
  if (month !== currentMonth) {
    throw new Error("Aggregate month mismatch.");
  }
  if (!isProviderBucket(provider)) {
    throw new Error("Aggregate provider is invalid.");
  }
  if (typeof tokens !== "number" || Number.isNaN(tokens)) {
    throw new Error("Aggregate token count is invalid.");
  }
  if (cost !== null && (typeof cost !== "number" || Number.isNaN(cost))) {
    throw new Error("Aggregate cost is invalid.");
  }
  return { month, provider, tokens, cost };
}
function isRecord(value) {
  return typeof value === "object" && value !== null;
}

// src/services/usage-aggregator.ts
var UsageAggregator = class {
  constructor(ledger, config = { currency: "$" }) {
    this.ledger = ledger;
    this.config = config;
  }
  ledger;
  config;
  async initialize() {
    if (!this.ledger.shouldRebuild()) {
      return;
    }
    this.ledger.triggerRebuild();
    this.ledger.save();
  }
  processRecord(record) {
    if (!isProviderBucket(record.provider)) {
      return;
    }
    const fingerprint = this.createFingerprint(record);
    if (this.ledger.isRecordProcessed(fingerprint)) {
      return;
    }
    this.ledger.updateAggregate(record.provider, record.tokens, record.cost);
    this.ledger.markRecordProcessed(fingerprint);
    this.ledger.save();
  }
  getViewModel(quotaByProvider = {}) {
    const aggregates = this.ledger.getAggregates();
    const rows = this.buildRows(aggregates, quotaByProvider);
    const hasAnyRemainingQuota = rows.some((row) => row.hasRemainingQuota);
    const heading = hasAnyRemainingQuota ? "Remaining" : "Usage";
    return {
      month: getCurrentMonthKey(),
      heading,
      rows
    };
  }
  buildRows(aggregates, quotaByProvider) {
    const aggregateMap = /* @__PURE__ */ new Map();
    for (const aggregate of aggregates) {
      if (isProviderBucket(aggregate.provider)) {
        aggregateMap.set(aggregate.provider, aggregate);
      }
    }
    return ROW_ORDER.map((bucket) => {
      const aggregate = aggregateMap.get(bucket);
      const emptyState = createEmptyRowState(bucket);
      const state = aggregate ? { ...emptyState, tokens: aggregate.tokens, cost: aggregate.cost } : emptyState;
      const hasRealCost = aggregate !== void 0 && aggregate.cost !== null;
      const showCost = shouldShowCost(bucket) && hasRealCost;
      const quota = this.resolveQuota(quotaByProvider[bucket]);
      const spentPercentage = quota.percentage ?? calculateSpentPercentage(state.tokens, quota.limit);
      const hasRemainingQuota = quota.remaining !== null && quota.limit !== null && quota.limit > 0;
      return {
        bucket,
        label: getProviderDisplayLabel(bucket),
        tokens: state.tokens,
        tokensFormatted: formatTokens(state.tokens),
        cost: showCost ? state.cost : null,
        costFormatted: showCost ? formatCost(state.cost, this.config.currency) : null,
        showCost,
        remaining: quota.remaining,
        remainingFormatted: hasRemainingQuota && quota.remaining !== null ? `${formatTokens(state.tokens)}  (${quota.remaining}, ${quota.percentage}%)` : formatTokens(state.tokens),
        percentage: spentPercentage,
        hasRemainingQuota
      };
    });
  }
  resolveQuota(quota) {
    if (!quota) {
      return { remaining: null, limit: null, percentage: null };
    }
    if ("tokens" in quota && quota.tokens) {
      return {
        remaining: quota.tokens.remaining,
        limit: quota.tokens.limit,
        percentage: quota.tokens.percentage
      };
    }
    if ("requests" in quota && quota.requests) {
      return {
        remaining: quota.requests.remaining,
        limit: quota.requests.limit,
        percentage: quota.requests.percentage
      };
    }
    return { remaining: null, limit: null, percentage: null };
  }
  createFingerprint(record) {
    return `${record.provider}:${record.timestamp}:${record.tokens}:${record.cost ?? "null"}`;
  }
};
function createAggregator(kv) {
  const ledger = createLedger(kv);
  return new UsageAggregator(ledger);
}

// src/plugin.tsx
var TokenSpendBarPlugin = async (api, options, _meta) => {
  let aggregator = null;
  let initError = null;
  const parsedOptions = parseOptions(options);
  const quotaAggregator = createQuotaAggregator(parsedOptions);
  const quotaByProvider = {};
  const inFlightQuotaRequestId = /* @__PURE__ */ new Map();
  try {
    aggregator = createAggregator(api.kv);
    await aggregator.initialize();
    await refreshAllQuotas();
    api.renderer.requestRender();
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error("[TokenSpendBar] Initialization failed:", initError.message);
  }
  const handleMessageUpdated = (event) => {
    void handleMessageUpdatedAsync(event);
  };
  const handleMessageUpdatedAsync = async (event) => {
    if (!aggregator) return;
    const record = toUsageRecord(event.properties.info);
    if (!record) {
      return;
    }
    aggregator.processRecord(record);
    await refreshQuota(record.provider);
    api.renderer.requestRender();
  };
  const unsubscribeMessageUpdated = api.event.on("message.updated", handleMessageUpdated);
  api.lifecycle.onDispose(() => {
    unsubscribeMessageUpdated();
  });
  const slotPlugin = {
    order: 150,
    slots: {
      sidebar_content: (_ctx, _props) => {
        if (initError) {
          return ErrorFallback({ error: initError });
        }
        if (!aggregator) {
          return ErrorFallback({ error: new Error("Aggregator not initialized") });
        }
        const viewModel = aggregator.getViewModel(quotaByProvider);
        return SessionSpendWidget({
          viewModel,
          colors: {
            text: _ctx.theme?.current?.text,
            muted: _ctx.theme?.current?.textMuted
          }
        });
      }
    }
  };
  api.slots.register(slotPlugin);
  async function refreshAllQuotas() {
    await Promise.all([
      refreshQuota("minimax"),
      refreshQuota("chatgpt-plus"),
      refreshQuota("opencode-go")
    ]);
  }
  async function refreshQuota(provider) {
    const requestId = (inFlightQuotaRequestId.get(provider) ?? 0) + 1;
    inFlightQuotaRequestId.set(provider, requestId);
    quotaAggregator.clearCache(provider);
    const result = await quotaAggregator.getQuota(provider);
    if (inFlightQuotaRequestId.get(provider) === requestId) {
      quotaByProvider[provider] = result;
    }
  }
};
function parseOptions(options) {
  if (!options || typeof options !== "object") {
    return {};
  }
  const value = options;
  return {
    minimaxCookie: typeof value.minimaxCookie === "string" ? value.minimaxCookie : void 0,
    chatgptToken: typeof value.chatgptToken === "string" ? value.chatgptToken : void 0,
    fallbackLimits: value.fallbackLimits && typeof value.fallbackLimits === "object" ? {
      requests: typeof value.fallbackLimits.requests === "number" ? value.fallbackLimits.requests : void 0,
      tokens: typeof value.fallbackLimits.tokens === "number" ? value.fallbackLimits.tokens : void 0
    } : void 0
  };
}
function toUsageRecord(message) {
  if (!isCompletedAssistantMessage(message)) {
    return null;
  }
  const provider = normalizeProvider(message.providerID);
  if (provider === null) {
    return null;
  }
  const tokens = getTokenCount(message.tokens);
  return {
    provider,
    tokens,
    cost: Number.isFinite(message.cost) ? message.cost : null,
    timestamp: message.time.completed
  };
}
function isCompletedAssistantMessage(message) {
  return message.role === "assistant" && typeof message.time.completed === "number";
}

export {
  TokenSpendBarPlugin
};
