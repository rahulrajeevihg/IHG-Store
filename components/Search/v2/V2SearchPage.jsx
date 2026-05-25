import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
const ProductDetail = dynamic(() => import("@/components/Detail/ProductDetail"), { ssr: false });
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { recordLmsEvent } from "@/redux/slice/lmsSlice";
import { setTourFlag } from "@/redux/slice/tourSlice";
import { toast } from "react-toastify";
import {
  aiSearchProductsV2,
  applyPromptDerivedSpecFilters,
  adaptFacetCounts,
  buildFeatureFlagOverride,
  buildMasterOptions,
  DEFAULT_V2_STATE,
  getIsSystemManager,
  isAuthRequiredError,
  isSearchV2DisabledError,
  normalizeSearchHit,
  queryFromState,
  reportSearchV2DisabledOnce,
  sanitizeV2FiltersForRequest,
  searchProductsV2,
  stateFromQuery,
  suggestProductsV2,
  trackAiSearchClick,
  trackAiSearchReformulation,
  trackAiSearchShortlist,
} from "@/libs/ighSearchV2";
import { getV2Events, logV2Event } from "@/libs/ighSearchV2Metrics";
import {
  delete_cart_items,
  continueGuidedAiSearch,
  get_all_masters,
  get_product_details,
  insert_cart_items,
  startGuidedAiSearch,
} from "@/libs/api";
import {
  buildGuidedSessionFromResponse,
  buildV2StateFromGuidedResponse,
  deriveV2SuggestedAnswers,
  getGuidedQuestionMeta,
  getGuidedUserMessages,
  isGuidedSkipAnswer,
  mergeGuidedSuggestedAnswers,
  normalizeGuidedAiResponse,
} from "@/libs/aiGuidedSearch";
import V2QuickViewDrawer from "./V2QuickViewDrawer";
import { VISIBLE_FILTERS } from "./constants";
import {
  hasActiveFilters,
  looksLikeSku,
  summarizeFiltersForMetrics,
} from "./utils/format";
import { resolveStockQty } from "./utils/stock";
import SearchHero from "./components/SearchHero";
import ResultsToolbar from "./components/ResultsToolbar";
import FilterPanel, { MobileFilterDialog } from "./components/FilterPanel";
import ActiveFiltersSummary from "./components/ActiveFiltersSummary";
import ProductCard from "./components/ProductCard";
import Pagination from "./components/Pagination";
import ResultsSkeleton from "./components/ResultsSkeleton";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import SearchUnavailableState from "./components/SearchUnavailableState";
import DiagnosticsDialog from "./components/DiagnosticsDialog";
import AiStatusBanner from "@/components/Sales/AiStatusBanner";
import SalesAddToCartModal from "@/components/Sales/SalesAddToCartModal";
import CartModal from "@/components/Sales/CartModal";
import { openRaiseQuery } from "@/redux/slice/productQuerySlice";

const DENSITY_STORAGE_KEY = "v2:density";
const DEV_MODE = process.env.NODE_ENV !== "production";
const LIVE_SEARCH_DEBOUNCE_MS = 320;
const SEARCH_EXECUTE_DEBOUNCE_MS = 220;
const LIVE_STOCK_CACHE_TTL_MS = 5 * 60 * 1000;
const LIVE_STOCK_RECONCILE_LIMIT = 20;
const AI_DISPLAY_CONTRACT_ERROR =
  "AI search response is missing display metadata. Please refresh after the backend update or use standard search.";
const INVENTORY_VALUE_ASC = "inventory_value:asc";
const INVENTORY_VALUE_DESC = "inventory_value:desc";

const getEffectiveUnitPrice = (document = {}) => {
  const rate = Number(document?.rate);
  const offerRate = Number(document?.offer_rate);
  const hasValidPromo = offerRate > 0 && rate > 0 && offerRate < rate;
  const unitPrice = hasValidPromo ? offerRate : rate;
  return Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : 0;
};

const getStockValue = (document = {}) => {
  const stock = resolveStockQty(document);
  const qty = Number.isFinite(stock) && stock > 0 ? stock : 0;
  return qty * getEffectiveUnitPrice(document);
};

const applyInventoryValueSortFallback = (hits = [], sortBy = "") => {
  if (!Array.isArray(hits)) return [];
  if (sortBy !== INVENTORY_VALUE_ASC && sortBy !== INVENTORY_VALUE_DESC) return hits;

  const direction = sortBy === INVENTORY_VALUE_DESC ? -1 : 1;
  return [...hits].sort((left, right) => {
    const leftDoc = normalizeSearchHit(left);
    const rightDoc = normalizeSearchHit(right);
    const delta = getStockValue(leftDoc) - getStockValue(rightDoc);
    if (delta === 0) return 0;
    return delta * direction;
  });
};

const FILTER_SOURCE_ALIASES = {
  brand: ["brand", "brands"],
  item_group: ["item_group", "item_groups"],
  category_list: ["category_list", "categories"],
  series: ["series"],
  input_voltage: ["input_voltage", "input"],
  lumen_output: ["lumen_output", "lumen"],
  output_current: ["output_current", "current_output"],
  output_voltage: ["output_voltage", "voltage_output"],
  is_manufactured_item: ["is_manufactured_item", "manufactured_item"],
};

const getFilterSourceKeys = (key) => FILTER_SOURCE_ALIASES[key] || [key];

export default function V2SearchPage({
  onFallback,
  fallbackMessage,
  // Sales workspace props
  salesMode = false,
  onAddToCart,
  rightPanel,
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cartSettings.cartItems);
  const wishlistItems = useSelector((state) => state.cartSettings.wishlistItems);
  const isSystemManager = useMemo(() => getIsSystemManager(), []);

  const [mastersData, setMastersData] = useState({});
  const [searchState, setSearchState] = useState(() =>
    stateFromQuery(router.query, isSystemManager)
  );
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState([]);
  const [found, setFound] = useState(0);
  const [facetMap, setFacetMap] = useState({});
  const [queryDebug, setQueryDebug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [aiInputMode, setAiInputMode] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState("search"); // "search" | "guided"
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiPreviewError, setAiPreviewError] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [guidedAssistantOpen, setGuidedAssistantOpen] = useState(false);
  const [guidedAssistantLoading, setGuidedAssistantLoading] = useState(false);
  const [guidedAssistantInput, setGuidedAssistantInput] = useState("");
  const [guidedAssistantSession, setGuidedAssistantSession] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState(null);
  const [suggestLatencyMs, setSuggestLatencyMs] = useState(null);
  const [searchDisabled, setSearchDisabled] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [aiSession, setAiSession] = useState(null);
  const [addModalProduct, setAddModalProduct] = useState(null);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalProduct, setDetailModalProduct] = useState(null);

  const initializedRef = useRef(false);
  const syncUrlRef = useRef(false);
  const skipNextSearchRef = useRef(false);
  const preserveAiSessionOnRouteSyncRef = useRef(false);
  const activeSearchController = useRef(null);
  const activeSuggestController = useRef(null);
  const activeSearchFingerprintRef = useRef("");
  const searchDebounceTimerRef = useRef(null);
  const detailCacheRef = useRef({});
  const liveStockCacheRef = useRef({});
  const liveStockReconcileRunRef = useRef(0);
  const suggestionsContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const guidedAutoQuestionKeyRef = useRef("");

  const mergeLiveStockIntoHit = (hit, liveStock) => {
    if (!liveStock || !liveStock.item_code) {
      return hit;
    }
    const safeHit = hit && typeof hit === "object" ? hit : {};
    const doc = safeHit?.document && typeof safeHit.document === "object" ? safeHit.document : safeHit;
    const code = String(doc?.item_code || doc?.name || "").trim().toLowerCase();
    if (!code || code !== String(liveStock.item_code).trim().toLowerCase()) {
      return hit;
    }

    const nextDoc = {
      ...doc,
      stock: liveStock.stock,
      total_stock: liveStock.total_stock,
      in_stock: liveStock.in_stock ? 1 : 0,
    };

    if (safeHit?.document && typeof safeHit.document === "object") {
      return {
        ...safeHit,
        document: nextDoc,
      };
    }
    return nextDoc;
  };

  const reconcileHitsWithLiveStock = async (rawHits = []) => {
    // Live stock for the full page is now reconciled server-side inside
    // search_products_v2 (one batched SQL via get_authoritative_stock_snapshot).
    // The old client-side per-item fan-out (up to LIVE_STOCK_RECONCILE_LIMIT
    // get_product_details calls) is redundant and was a major source of
    // /list slowness. Disabled by default; set NEXT_PUBLIC_CLIENT_STOCK_RECONCILE=1
    // to restore it.
    if (process.env.NEXT_PUBLIC_CLIENT_STOCK_RECONCILE !== "1") return;
    const hits = Array.isArray(rawHits) ? rawHits : [];
    if (!hits.length) return;

    const runId = ++liveStockReconcileRunRef.current;
    const itemCodes = Array.from(
      new Set(
        hits
          .slice(0, LIVE_STOCK_RECONCILE_LIMIT)
          .map((hit) => {
            const doc = normalizeSearchHit(hit);
            return String(doc?.item_code || doc?.name || "").trim();
          })
          .filter(Boolean)
      )
    );
    if (!itemCodes.length) return;

    const now = Date.now();
    const liveStocks = {};

    const pendingCodes = itemCodes.filter((itemCode) => {
      const cached = liveStockCacheRef.current[itemCode];
      if (cached && now - cached.fetchedAt < LIVE_STOCK_CACHE_TTL_MS) {
        liveStocks[itemCode] = cached.value;
        return false;
      }
      return true;
    });

    const fetched = await Promise.all(
      pendingCodes.map(async (itemCode) => {
        try {
          const response = await get_product_details(itemCode);
          const detail = response?.message && typeof response.message === "object" ? response.message : {};
          const stockRows = Array.isArray(detail?.stock_rows)
            ? detail.stock_rows
            : Array.isArray(detail?.stock)
              ? detail.stock
              : [];
          const totalStock = Number(
            detail?.total_stock ??
              stockRows.reduce((total, row) => total + Number(row?.actual_qty || row?.available_qty || 0), 0)
          );
          const resolvedTotalStock = Number.isFinite(totalStock) ? totalStock : 0;
          const inStock =
            detail?.in_stock !== undefined
              ? Boolean(detail.in_stock)
              : resolvedTotalStock > 0;
          const liveValue = {
            item_code: itemCode,
            stock: resolvedTotalStock,
            total_stock: resolvedTotalStock,
            in_stock: inStock,
          };
          return [itemCode, liveValue];
        } catch (_) {
          return null;
        }
      })
    );

    fetched.forEach((entry) => {
      if (!entry) return;
      const [itemCode, liveValue] = entry;
      liveStocks[itemCode] = liveValue;
      liveStockCacheRef.current[itemCode] = {
        value: liveValue,
        fetchedAt: Date.now(),
      };
    });

    if (runId !== liveStockReconcileRunRef.current) {
      return;
    }

    if (!Object.keys(liveStocks).length) {
      return;
    }

    setResults((currentHits) =>
      (Array.isArray(currentHits) ? currentHits : []).map((hit) => {
        const doc = normalizeSearchHit(hit);
        const itemCode = String(doc?.item_code || doc?.name || "").trim();
        const liveStock = liveStocks[itemCode];
        return liveStock ? mergeLiveStockIntoHit(hit, liveStock) : hit;
      })
    );
  };

  const searchV2Requested = true;
  const diagnosticsEnabled = isSystemManager && router.query.debug_v2 === "1";
  const featureFlagOverride = useMemo(
    () => buildFeatureFlagOverride(searchV2Requested),
    [searchV2Requested]
  );
  const isAiMode = Boolean(aiSession?.mode === "ai" && aiSession?.message);
  const aiDisplayChips = useMemo(() => buildAiDisplayChips(aiSession), [aiSession]);
  const activeResultQuery = isAiMode ? aiSession.display_query || "" : searchState.q;

  // Inline AI search: chips for the held (not-yet-applied) interpretation, and
  // whether that preview still matches the current prompt text.
  const aiPreviewChips = useMemo(
    () =>
      aiPreview
        ? buildAiDisplayChips({
            mode: "ai",
            display_query: aiPreview.display_query,
            display_filters: aiPreview.display_filters,
          })
        : [],
    [aiPreview]
  );
  const aiPreviewFresh = Boolean(
    aiPreview && aiPreview.message === aiPrompt.trim() && aiPrompt.trim().length > 0
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const detailOpen = drawerOpen || detailModalOpen;
    if (detailOpen) {
      document.body.dataset.detailViewOpen = "1";
      return;
    }
    if (document.body.dataset.detailViewOpen === "1") {
      delete document.body.dataset.detailViewOpen;
    }
  }, [drawerOpen, detailModalOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(DENSITY_STORAGE_KEY);
    if (stored === "comfortable" || stored === "compact") {
      setDensity(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
  }, [density]);

  const visibleFilterOptions = useMemo(() => {
    return VISIBLE_FILTERS.reduce((accumulator, filter) => {
      const sourceKeys = getFilterSourceKeys(filter.key);
      let masterOptions = sourceKeys.flatMap((sourceKey) =>
        Array.isArray(mastersData?.[sourceKey]) ? mastersData[sourceKey] : []
      );
      if (
        filter.key === "category_list" &&
        masterOptions.length === 0 &&
        mastersData?.attributes &&
        typeof mastersData.attributes === "object"
      ) {
        const categoryAttributeKeys = ["Product Category", "Category"];
        for (const attrKey of categoryAttributeKeys) {
          if (Array.isArray(mastersData.attributes[attrKey]) && mastersData.attributes[attrKey].length > 0) {
            masterOptions = mastersData.attributes[attrKey];
            break;
          }
        }
      }
      if (filter.key === "is_manufactured_item") {
        masterOptions = masterOptions.map((value) => {
          const stringValue = String(value);
          if (stringValue === "1") {
            return { value: "1", label: "Manufactured" };
          }
          if (stringValue === "0") {
            return { value: "0", label: "Non-manufactured" };
          }
          return { value: stringValue, label: stringValue };
        });
      }
      const currentFacetMap = sourceKeys.reduce((merged, sourceKey) => {
        const sourceFacet = facetMap?.[sourceKey];
        if (sourceFacet && typeof sourceFacet === "object") {
          return { ...merged, ...sourceFacet };
        }
        return merged;
      }, {});
      accumulator[filter.key] = buildMasterOptions(masterOptions, currentFacetMap);
      return accumulator;
    }, {});
  }, [mastersData, facetMap]);

  useEffect(() => {
    let active = true;
    const loadMasters = async () => {
      try {
        const response = await get_all_masters();
        if (!active) return;
        setMastersData(response?.message || {});
      } catch (err) {
        if (active) toast.error(err?.message || "Unable to load filter options.");
      }
    };
    loadMasters();
    return () => {
      active = false;
    };
  }, []);

  // Cart state loading intentionally removed from V2.
  // ecommerce_business_store is not installed on this server — get_cart_items would 417.

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target)
      ) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const preserveAiSession = preserveAiSessionOnRouteSyncRef.current;
    preserveAiSessionOnRouteSyncRef.current = false;
    const nextState = stateFromQuery(router.query, isSystemManager);
    setSearchState((current) => {
      const currentSerialized = JSON.stringify(current);
      const nextSerialized = JSON.stringify(nextState);
      if (currentSerialized === nextSerialized) return current;
      return nextState;
    });
    if (!preserveAiSession) {
      setSearchInput(nextState.q || "");
      setAiSession(null);
      setAiExplanation("");
    }
    initializedRef.current = true;
    setHydrated(true);
    syncUrlRef.current = false;
  }, [router.isReady, router.asPath, isSystemManager]);

  const clearAiSession = () => {
    setAiSession(null);
    setAiExplanation("");
  };

  const resetGuidedAssistant = (resetFilters = true) => {
    setGuidedAssistantInput("");
    setGuidedAssistantSession(null);
    guidedAutoQuestionKeyRef.current = "";
    if (resetFilters) {
      clearAiSearch();
    }
  };

  const rebuildGuidedAssistantFromMessages = async (userMessages) => {
    const normalizedMessages = (Array.isArray(userMessages) ? userMessages : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean);

    if (normalizedMessages.length === 0) {
      resetGuidedAssistant(true);
      return;
    }

    let previousSession = null;
    let latestNormalized = null;

    for (let index = 0; index < normalizedMessages.length; index += 1) {
      const userMessage = normalizedMessages[index];
      const response = previousSession
        ? await continueGuidedAiSearch({
            session_id: previousSession?.session_id || "",
            source_message: normalizedMessages.slice(0, index).join(" "),
            applied_query: previousSession?.current_query || "",
            current_intent: previousSession?.current_intent || {},
            resolved_intent: previousSession?.resolved_intent || null,
            question_key: previousSession?.question_key || "",
            answer: userMessage,
            page_context: { route: router.pathname, search: searchState.q || "" },
            feature_flag_override: featureFlagOverride,
          })
        : await startGuidedAiSearch({
            message: userMessage,
            page_context: { route: router.pathname, search: searchState.q || "" },
            feature_flag_override: featureFlagOverride,
          });

      latestNormalized = normalizeGuidedAiResponse(response);
      if (!latestNormalized) {
        throw new Error("Guided assistant did not return a valid replay response.");
      }

      previousSession = buildGuidedSessionFromResponse(
        {
          ...latestNormalized,
          suggested_answers: latestNormalized.suggested_answers || [],
        },
        previousSession,
        userMessage
      );
    }

    if (!latestNormalized || !previousSession) {
      throw new Error("Unable to rebuild the guided assistant session.");
    }

    const suggestedAnswers = mergeGuidedSuggestedAnswers(
      latestNormalized.suggested_answers,
      deriveV2SuggestedAnswers(
        latestNormalized.question_key,
        visibleFilterOptions,
        latestNormalized.suggested_answers
      )
    );

    const nextSession = {
      ...previousSession,
      suggested_answers: suggestedAnswers,
      result_count:
        latestNormalized.result_count !== null && latestNormalized.result_count !== undefined
          ? latestNormalized.result_count
          : found,
    };

    setGuidedAssistantSession(nextSession);
    setGuidedAssistantInput("");
    setGuidedAssistantOpen(true);
    clearAiSession();

    const nextState = buildV2StateFromGuidedResponse(latestNormalized, searchState);
    syncUrlRef.current = true;
    setSearchInput(latestNormalized.applied_query || "");
    updateState(nextState);
  };

  const exitAiMode = () => {
    if (isAiMode) {
      setSearchInput(searchState.q || "");
    }
    clearAiSession();
  };

  // Open the inline AI search bar: seed the prompt from whatever is already in
  // the search input / active query, collapse the suggestion dropdown, and
  // focus the field so the user can type immediately.
  const enterAiMode = () => {
    setAiInputMode(true);
    setAiPanelMode("search");
    setAiPreviewError("");
    setSuggestionsOpen(false);
    setAiPrompt((prev) => prev || searchInput || searchState.q || "");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  // Collapse the inline AI panel and discard any unapplied interpretation.
  const exitAiInputMode = () => {
    setAiInputMode(false);
    setAiPanelMode("search");
    setAiPreview(null);
    setAiPreviewError("");
    setAiLoading(false);
  };

  // From a one-shot preview, switch the panel into guided mode and kick off the
  // guided session seeded with the same prompt (reuses start_guided_ai_search).
  const startGuidedFromAi = () => {
    const seed = (aiPreview?.message || aiPrompt || searchInput || "").trim();
    setAiPanelMode("guided");
    setAiPreview(null);
    setGuidedAssistantInput("");
    if (seed) {
      submitGuidedAssistant(seed);
    }
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  // Leave guided mode but keep the applied filters; collapse the panel.
  const showGuidedResults = () => {
    setAiInputMode(false);
    setAiPanelMode("search");
  };

  const guidedPlaceholder = getGuidedQuestionMeta(
    guidedAssistantSession?.question_key
  )?.placeholder;

  // ⌘K / Ctrl+K opens AI search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        enterAiMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, searchState.q]);

  const shouldTrackReformulation = (session) => {
    if (!session?.search_event_id) return false;
    if (Number(session?.found) === 0) return true;
    if (Array.isArray(session?.applied_relaxations) && session.applied_relaxations.length > 0) {
      return true;
    }

    const resultQuality = String(session?.quality_signals?.result_quality || "").toLowerCase();
    return ["weak", "poor", "low"].includes(resultQuality);
  };

  const fireAndForgetAiTracking = async (tracker, payload, eventType) => {
    try {
      await tracker(payload);
      logV2Event(eventType, payload);
    } catch (trackingError) {
      logV2Event(`${eventType}_failed`, {
        ...payload,
        message: trackingError?.message || "Tracking request failed.",
      });
    }
  };

  const executeSearch = async (stateToSearch) => {
    const activeState = stateToSearch || searchState;
    const startedAt = performance.now();
    const trimmedQuery = typeof activeState.q === "string" ? activeState.q.trim() : "";
    const skuSearch = looksLikeSku(trimmedQuery);
    const derivedSearch = skuSearch
      ? { state: activeState, displayFilters: [] }
      : applyPromptDerivedSpecFilters(activeState, trimmedQuery);
    const requestState = derivedSearch.state || activeState;
    const requestQuery =
      typeof requestState.q === "string" ? requestState.q.trim() : trimmedQuery;
    const isAiSearch = Boolean(aiSession?.mode === "ai" && aiSession?.message);
    const requestPayload = isAiSearch
      ? {
          message: aiSession.message,
          page_context: {
            route: "/list",
            search: activeState.q || "",
          },
          page: activeState.page,
          page_length: activeState.page_length,
          include_inactive: activeState.include_inactive,
          feature_flag_override: featureFlagOverride,
        }
      : {
          query: skuSearch ? "" : requestQuery,
          filters: sanitizeV2FiltersForRequest(requestState.filters),
          sort_by: activeState.sort_by,
          page: activeState.page,
          page_length: activeState.page_length,
          include_inactive: activeState.include_inactive,
          item_code_hint: skuSearch ? trimmedQuery : "",
          feature_flag_override: featureFlagOverride,
        };
    const requestFingerprint = buildSearchFingerprint({
      isAiSearch,
      payload: requestPayload,
    });

    if (
      activeSearchController.current &&
      activeSearchFingerprintRef.current === requestFingerprint
    ) {
      return;
    }

    if (activeSearchController.current) activeSearchController.current.abort();
    const controller = new AbortController();
    activeSearchController.current = controller;
    activeSearchFingerprintRef.current = requestFingerprint;

    setLoading(true);
    setError("");

    try {
      if (DEV_MODE) {
        console.debug("[V2 search] request", requestPayload);
      }

      const response = isAiSearch
        ? await aiSearchProductsV2(requestPayload, { signal: controller.signal })
        : await searchProductsV2(requestPayload, {
            signal: controller.signal,
            onRetry: () => {
              setError("Search is taking longer than expected. Retrying…");
            },
          });

      if (isAiSearch) {
        assertAiDisplayResponse(response);
      }

      const rawHits = Array.isArray(response?.hits) ? response.hits : [];
      const hits = applyInventoryValueSortFallback(rawHits, activeState.sort_by);

      setResults(hits);
      void reconcileHitsWithLiveStock(hits);
      setFound(Number(response?.found) || 0);
      setFacetMap(adaptFacetCounts(response?.facet_counts));
      setQueryDebug(response?.query_debug || null);
      if (isAiSearch) {
        setAiExplanation(response?.explanation || "");
        setAiSession((current) =>
          current
            ? {
                ...current,
                display_query: response.display_query,
                display_filters: response.display_filters,
                search_event_id: response?.search_event_id || current.search_event_id || "",
                resolved_intent: response?.resolved_intent || null,
                applied_filters: response?.applied_filters || {},
                applied_sort: response?.applied_sort || "",
                applied_relaxations: Array.isArray(response?.applied_relaxations)
                  ? response.applied_relaxations
                  : [],
                quality_signals: response?.quality_signals || null,
                explanation: response?.explanation || "",
                found: Number(response?.found) || 0,
              }
            : current
        );
      }
      if (DEV_MODE && response?.query_debug) {
        console.debug("[V2 search] query_debug", response.query_debug);
      }
      const latency = Math.round(performance.now() - startedAt);
      setSearchLatencyMs(latency);
      setError("");
      logV2Event(isAiSearch ? "ai_search_results_loaded" : "search_results_loaded", {
        query:
          requestPayload.query ||
          requestPayload.item_code_hint ||
          requestPayload.message ||
          "*",
        found: Number(response?.found) || 0,
        page: activeState.page,
        page_length: activeState.page_length,
        latency_ms: latency,
        ...(isAiSearch
          ? {
              search_event_id: response?.search_event_id || "",
              applied_sort: response?.applied_sort || "",
              applied_relaxations: Array.isArray(response?.applied_relaxations)
                ? response.applied_relaxations
                : [],
            }
          : {}),
      });
      if (!(Number(response?.found) || 0)) {
        logV2Event(isAiSearch ? "ai_search_results_empty" : "search_results_empty", {
          query:
            requestPayload.query ||
            requestPayload.item_code_hint ||
            requestPayload.message ||
            "*",
          filters: summarizeFiltersForMetrics(activeState.filters),
        });
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      // Not authenticated — parseJsonResponse already kicked off the redirect to
      // /login; bail out without rendering the generic error state. (The
      // `finally` below still resets the loading flag.)
      if (isAuthRequiredError(err)) {
        return;
      }
      if (isSearchV2DisabledError(err)) {
        reportSearchV2DisabledOnce({
          source: isAiSearch ? "ai_search_products_v2" : "search_products_v2",
          query:
            requestPayload.query ||
            requestPayload.item_code_hint ||
            requestPayload.message ||
            "",
        });
        if (isAiSearch) clearAiSession();
        setSearchDisabled(true);
        setError("");
        liveStockReconcileRunRef.current += 1;
        setResults([]);
        setFound(0);
        setFacetMap({});
        setQueryDebug(null);
        setSearchLatencyMs(Math.round(performance.now() - startedAt));
        return;
      }
      if (DEV_MODE) {
        console.error("[V2 search] failed", {
          requestPayload,
          error: err,
        });
      }
      const message = getSearchErrorMessage(err);
      if (isAiSearch && message === AI_DISPLAY_CONTRACT_ERROR) {
        clearAiSession();
      }
      setError(message);
      liveStockReconcileRunRef.current += 1;
      setResults([]);
      setFound(0);
      setSearchLatencyMs(Math.round(performance.now() - startedAt));
      logV2Event(isAiSearch ? "ai_search_results_failed" : "search_results_failed", {
        query:
          requestPayload.query ||
          requestPayload.item_code_hint ||
          requestPayload.message ||
          "*",
        message,
      });
      if (message.toLowerCase().includes("v2") || message.toLowerCase().includes("feature")) {
        onFallback?.("V2 unavailable, switched to V1");
        return;
      }
    } finally {
      if (activeSearchFingerprintRef.current === requestFingerprint) {
        activeSearchFingerprintRef.current = "";
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !initializedRef.current) return;
    const queryString = queryFromState(searchState, isSystemManager);
    const targetUrl = queryString ? `/list?${queryString}` : "/list";
    if (!syncUrlRef.current) {
      syncUrlRef.current = true;
    } else if (router.asPath !== targetUrl) {
      preserveAiSessionOnRouteSyncRef.current = Boolean(
        aiSession?.mode === "ai" && aiSession?.message
      );
      router.replace(targetUrl, undefined, { shallow: true });
    }
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (searchDisabled) {
      // Feature flag is off; don't keep hitting the server with the same call.
      // Filters, nav, and cart remain interactive — only result fetches are gated.
      setLoading(false);
      return;
    }
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
      searchDebounceTimerRef.current = null;
    }

    const isAiSearch = Boolean(aiSession?.mode === "ai" && aiSession?.message);
    if (isAiSearch) {
      executeSearch(searchState);
      return;
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      executeSearch(searchState);
    }, SEARCH_EXECUTE_DEBOUNCE_MS);
    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
  }, [searchState, hydrated, isSystemManager, searchDisabled, aiSession]);

  useEffect(() => {
    if (!hydrated) return;
    if (searchDisabled) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionsLoading(false);
      return;
    }
    if (!searchInput || searchInput.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionsLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      const startedAt = performance.now();
      if (activeSuggestController.current) activeSuggestController.current.abort();
      const controller = new AbortController();
      activeSuggestController.current = controller;
      setSuggestionsLoading(true);
      try {
        const response = await suggestProductsV2(
          {
            query: searchInput.trim(),
            limit: 8,
            feature_flag_override: featureFlagOverride,
          },
          { signal: controller.signal }
        );
        setSuggestions(Array.isArray(response?.suggestions) ? response.suggestions : []);
        setSuggestionsOpen(true);
        setActiveSuggestionIndex(-1);
        const latency = Math.round(performance.now() - startedAt);
        setSuggestLatencyMs(latency);
        logV2Event("suggestions_loaded", {
          query: searchInput.trim(),
          count: Array.isArray(response?.suggestions) ? response.suggestions.length : 0,
          latency_ms: latency,
        });
      } catch (err) {
        if (err?.name === "AbortError") return;
        if (isSearchV2DisabledError(err)) {
          // Once-per-session report; do NOT log per keystroke.
          reportSearchV2DisabledOnce({
            source: "suggest_products_v2",
            query: searchInput.trim(),
          });
          setSearchDisabled(true);
          setSuggestions([]);
          setSuggestionsOpen(false);
          return;
        }
        setSuggestions([]);
        logV2Event("suggestions_failed", {
          query: searchInput.trim(),
          message: err?.message || "Suggestion request failed.",
        });
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput, hydrated, featureFlagOverride, searchDisabled]);

  useEffect(() => {
    if (!hydrated || searchDisabled) return;
    const nextQuery = typeof searchInput === "string" ? searchInput.trim() : "";
    const currentQuery = typeof searchState.q === "string" ? searchState.q.trim() : "";
    if (nextQuery === currentQuery) return;

    const timer = window.setTimeout(() => {
      handleSubmitSearch(nextQuery);
    }, LIVE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput, hydrated, searchDisabled, searchState.q]);

  const updateState = (updater) => {
    setSearchState((current) => {
      const nextState = typeof updater === "function" ? updater(current) : updater;
      return nextState;
    });
  };

  // Emit a `filters_changed` event into the LMS event log whenever the user
  // toggles filters. The LMS reducer ignores events while no scenario is
  // active, so this stays cheap outside of training.
  const filtersJson = JSON.stringify(searchState.filters || {});
  useEffect(() => {
    if (!hydrated) return;
    try {
      const filters = JSON.parse(filtersJson);
      dispatch(recordLmsEvent({ type: "filters_changed", filters }));
    } catch (_) { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersJson, hydrated]);

  // Push the current visible result item codes into the LMS event log so the
  // SKU-verification task in the "precise-filter-and-find" scenario can check
  // whether a user-entered code matches any product currently on screen.
  useEffect(() => {
    if (!Array.isArray(results) || results.length === 0) return;
    const codes = results
      .slice(0, 50)
      .map((hit) => {
        const doc = hit?.document || hit;
        return doc?.item_code || doc?.name;
      })
      .filter(Boolean);
    if (codes.length === 0) return;
    dispatch(recordLmsEvent({ type: "search_results", item_codes: codes }));
  }, [results, dispatch]);

  // Tour hook — Joyride's "Opening Product Detail…" step flips this Redux
  // flag; we react by opening the detail sheet on the first result so the
  // subsequent product-detail-* tour steps have real DOM targets.
  const tourRequestOpenDetail = useSelector((state) => state.tour?.requestOpenProductDetail);
  useEffect(() => {
    if (!tourRequestOpenDetail) return;
    const firstResult = results?.[0];
    if (firstResult) {
      const normalized = normalizeSearchHit(firstResult);
      setDetailModalProduct(normalized);
      setDetailModalOpen(true);
      if (typeof window !== "undefined") window.document.body.style.overflow = "hidden";
    }
    dispatch(setTourFlag({ key: "requestOpenProductDetail", value: false }));
  }, [tourRequestOpenDetail, results, dispatch]);

  const clearAiSearch = () => {
    clearAiSession();
    setSearchInput("");
    syncUrlRef.current = true;
    updateState((current) => ({
      ...DEFAULT_V2_STATE,
      search_v2: current.search_v2,
      page_length: current.page_length,
      include_inactive: current.include_inactive,
    }));
  };

  const handleSubmitSearch = (nextQuery = searchInput) => {
    setSuggestionsOpen(false);
    clearAiSession();
    const query = typeof nextQuery === "string" ? nextQuery.trim() : "";

    if (query) dispatch(recordLmsEvent({ type: "search", query }));

    updateState((current) => {
      const nextState = {
        ...current,
        q: query,
        page: 1,
      };

      return looksLikeSku(query)
        ? nextState
        : applyPromptDerivedSpecFilters(nextState, query).state;
    });
  };

  const handleSuggestionSelect = (suggestion) => {
    const nextQuery = suggestion?.item_code || suggestion?.item_name || "";
    logV2Event("suggestion_selected", { query: searchInput, selected: nextQuery });
    setSearchInput(nextQuery);
    setSuggestionsOpen(false);
    handleSubmitSearch(nextQuery);
  };

  const handleSuggestionKeyDown = (event) => {
    if (!suggestions.length) {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmitSearch();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestionIndex((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (suggestionsOpen && suggestions[activeSuggestionIndex]) {
        handleSuggestionSelect(suggestions[activeSuggestionIndex]);
      } else {
        handleSubmitSearch();
      }
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  };

  const updateMultiFilter = (key, selected) => {
    exitAiMode();
    updateState((current) => ({
      ...current,
      page: 1,
      filters: {
        ...current.filters,
        [key]: Array.isArray(selected) ? selected.map((option) => option.value) : [],
      },
    }));
  };

  const updateRangeFilter = (key, part, value) => {
    exitAiMode();
    updateState((current) => ({
      ...current,
      page: 1,
      filters: {
        ...current.filters,
        [key]: { ...current.filters[key], [part]: value },
      },
    }));
  };

  const setInStock = (checked) => {
    exitAiMode();
    updateState((current) => ({
      ...current,
      page: 1,
      filters: { ...current.filters, in_stock: checked },
    }));
  };

  const setShowPromotion = (checked) => {
    exitAiMode();
    updateState((current) => ({
      ...current,
      page: 1,
      filters: { ...current.filters, show_promotion: checked },
    }));
  };

  const setManufacturedOnly = (checked) => {
    exitAiMode();
    updateState((current) => ({
      ...current,
      page: 1,
      filters: {
        ...current.filters,
        is_manufactured_item: checked ? ["1"] : [],
      },
    }));
  };

  const clearFilters = () => {
    if (isAiMode) {
      clearAiSearch();
      return;
    }
    clearAiSession();
    setSearchInput("");
    updateState((current) => ({
      ...DEFAULT_V2_STATE,
      search_v2: current.search_v2,
      q: "",
      sort_by: current.sort_by,
      page_length: current.page_length,
      include_inactive: current.include_inactive,
    }));
  };

  const handleClearFilter = (key, value) => {
    if (isAiMode) {
      clearAiSearch();
      return;
    }
    clearAiSession();
    if (key === "query") {
      setSearchInput("");
      updateState((current) => ({ ...current, q: "", page: 1 }));
      return;
    }
    if (key === "in_stock") {
      updateState((current) => ({
        ...current,
        page: 1,
        filters: { ...current.filters, in_stock: false },
      }));
      return;
    }
    if (key === "show_promotion") {
      updateState((current) => ({
        ...current,
        page: 1,
        filters: { ...current.filters, show_promotion: false },
      }));
      return;
    }
    if (key.endsWith("_range")) {
      updateState((current) => ({
        ...current,
        page: 1,
        filters: { ...current.filters, [key]: { min: "", max: "" } },
      }));
      return;
    }
    updateState((current) => ({
      ...current,
      page: 1,
      filters: {
        ...current.filters,
        [key]:
          value === null
            ? []
            : current.filters[key].filter((entry) => entry !== value),
      },
    }));
  };

  const ensureProductDetail = async (itemCode) => {
    if (!itemCode) throw new Error("Missing product code.");
    if (detailCacheRef.current[itemCode]) return detailCacheRef.current[itemCode];
    const response = await get_product_details(itemCode);
    const detail = response?.message || {};
    detailCacheRef.current[itemCode] = detail;
    return detail;
  };

  // ecommerce_business_store not installed — cart sync is a no-op in V2
  const syncCartState = async () => {};

  const isWishlisted = (document) =>
    wishlistItems.some((item) => item.product === document.item_code);

  const isShortlisted = (document) =>
    cartItems.some((item) =>
      salesMode
        ? item.item_code === document.item_code
        : item.product === document.item_code
    );

  const getCartQty = (document) => {
    const found = cartItems.find((item) => item.item_code === document.item_code);
    return found ? (found.count || found.quantity || 0) : 0;
  };

  const addToWishlist = async (document) => {
    try {
      const wishlistEntry = wishlistItems.find(
        (item) => item.product === document.item_code
      );
      if (wishlistEntry?.name) {
        const response = await delete_cart_items({ name: wishlistEntry.name });
        if (response?.message?.status !== "success") {
          throw new Error(response?.message?.message || "Unable to remove saved item.");
        }
        await syncCartState();
        toast.success(`${document.item_code} removed from saved items`);
        logV2Event("wishlist_removed", { item_code: document.item_code });
        return;
      }
      const detail = await ensureProductDetail(document.item_code);
      const response = await insert_cart_items({
        item_code: detail.name || detail.item_code || document.item_code,
        qty: 1,
        qty_type: "",
        cart_type: "Wishlist",
        customer: localStorage.getItem("customerRefId"),
        attribute: detail.attribute || "",
        attribute_id: detail.attribute_id || "",
        business: detail.business || "",
      });
      if (!response?.message?.marketplace_items) {
        throw new Error(response?.message?.message || "Unable to save item.");
      }
      await syncCartState();
      toast.success(`${document.item_code} saved successfully`);
      logV2Event("wishlist_saved", { item_code: document.item_code });
    } catch (err) {
      toast.error(err?.message || "Unable to update saved items.");
    }
  };

  const addToShortlist = async (document) => {
    try {
      if (isShortlisted(document)) {
        toast.info(`${document.item_code} is already in the shortlist`);
        logV2Event("shortlist_duplicate", { item_code: document.item_code });
        return;
      }
      const detail = await ensureProductDetail(document.item_code);
      const response = await insert_cart_items({
        item_code: detail.name || detail.item_code || document.item_code,
        qty: detail.minimum_order_qty || 1,
        qty_type: "",
        cart_type: "Shopping Cart",
        customer: localStorage.getItem("customerRefId"),
        attribute: detail.variant_text || detail.attribute || "",
        attribute_id: detail.attribute_id || "",
        business: detail.business || "",
      });
      if (!response?.message?.marketplace_items) {
        throw new Error(response?.message?.message || "Unable to add to shortlist.");
      }
      await syncCartState();
      toast.success(`${document.item_code} added to shortlist`);
      logV2Event("shortlist_added", { item_code: document.item_code });
      if (aiSession?.search_event_id && document?.item_code) {
        fireAndForgetAiTracking(
          trackAiSearchShortlist,
          {
            search_event_id: aiSession.search_event_id,
            item_code: document.item_code,
          },
          "ai_search_shortlist_tracked"
        );
      }
    } catch (err) {
      toast.error(err?.message || "Unable to add item to shortlist.");
    }
  };

  const openQuickView = async (document) => {
    setSelectedItem(document);
    setDrawerOpen(true);
    setQuickViewLoading(true);
    logV2Event("quick_view_opened", { item_code: document.item_code });
    dispatch(recordLmsEvent({ type: "detail_opened", item_code: document?.item_code, source: "quick_view" }));
    try {
      const detail = await ensureProductDetail(document.item_code);
      setSelectedDetail({ ...document, ...detail });
    } catch (err) {
      toast.error(err?.message || "Unable to load product detail.");
    } finally {
      setQuickViewLoading(false);
    }
  };

  const handleOpenCartModal = (productDoc) => {
    setAddModalProduct(productDoc);
  };

  const handleOpenIssueModal = (productDoc) => {
    dispatch(openRaiseQuery(productDoc));
  };

  const handleNavigate = (productDoc) => {
    const itemCode = productDoc?.item_code || productDoc?.name;
    if (!itemCode) return;
    dispatch(recordLmsEvent({ type: "detail_opened", item_code: itemCode, source: "card_click" }));
    if (aiSession?.search_event_id) {
      fireAndForgetAiTracking(
        trackAiSearchClick,
        {
          search_event_id: aiSession.search_event_id,
          item_code: itemCode,
        },
        "ai_search_click_tracked"
      );
    }
    setDetailModalProduct(productDoc);
    setDetailModalOpen(true);
    window.document.body.style.overflow = "hidden";
  };

  // Interpret the prompt: fetch the AI response (filters + count + hits) and
  // hold it as a preview. Nothing is committed to the product grid yet — the
  // user reviews the interpreted filters first, then Applies. The interpret
  // call already returns the hits, so Apply needs no second network round-trip.
  const interpretAiSearch = async (overrideMessage) => {
    const message = (
      typeof overrideMessage === "string" ? overrideMessage : aiPrompt
    ).trim();
    if (!message) {
      toast.info("Describe what you need first.");
      return;
    }
    dispatch(recordLmsEvent({ type: "ai_search", query: message }));
    setAiLoading(true);
    setAiPreviewError("");
    try {
      if (shouldTrackReformulation(aiSession)) {
        fireAndForgetAiTracking(
          trackAiSearchReformulation,
          {
            search_event_id: aiSession.search_event_id,
            reformulated_message: message,
          },
          "ai_search_reformulation_tracked"
        );
      }

      const response = await aiSearchProductsV2({
        message,
        page_context: { route: "/list", search: searchState.q || "" },
        page: 1,
        page_length: searchState.page_length,
        include_inactive: searchState.include_inactive,
        feature_flag_override: featureFlagOverride,
      });
      assertAiDisplayResponse(response);
      setAiPreview({ ...response, message });
      logV2Event("ai_search_interpreted", {
        prompt: message,
        search_event_id: response?.search_event_id || "",
        found: Number(response?.found) || 0,
      });
    } catch (err) {
      if (isSearchV2DisabledError(err)) {
        reportSearchV2DisabledOnce({
          source: "ai_search_products_v2",
          prompt: message,
        });
        setSearchDisabled(true);
        setAiPreview(null);
        exitAiInputMode();
        return;
      }
      const errorMessage = getSearchErrorMessage(err?.message);
      setAiPreview(null);
      setAiPreviewError(errorMessage);
      logV2Event("ai_search_failed", { prompt: message, message: errorMessage });
    } finally {
      setAiLoading(false);
    }
  };

  // Commit the held interpretation to the product grid. Pure client-side swap
  // of already-fetched results, then collapse the inline panel. The applied AI
  // filters surface as read-only chips in ActiveFiltersSummary (via aiSession).
  const applyAiPreview = () => {
    const response = aiPreview;
    if (!response) return;
    const message = response.message;
    setAiExplanation(response?.explanation || "");
    setAiSession({
      mode: "ai",
      message,
      display_query: response.display_query,
      display_filters: response.display_filters,
      search_event_id: response?.search_event_id || "",
      resolved_intent: response?.resolved_intent || null,
      applied_filters: response?.applied_filters || {},
      applied_sort: response?.applied_sort || "",
      applied_relaxations: Array.isArray(response?.applied_relaxations)
        ? response.applied_relaxations
        : [],
      quality_signals: response?.quality_signals || null,
      explanation: response?.explanation || "",
      found: Number(response?.found) || 0,
    });
    setSearchInput(message);
    const rawHits = Array.isArray(response?.hits) ? response.hits : [];
    const sortedHits = applyInventoryValueSortFallback(rawHits, searchState.sort_by);
    setResults(sortedHits);
    void reconcileHitsWithLiveStock(sortedHits);
    setFound(Number(response?.found) || 0);
    setFacetMap(adaptFacetCounts(response?.facet_counts));
    setQueryDebug(response?.query_debug || null);
    setError("");
    setLoading(false);
    skipNextSearchRef.current = true;
    syncUrlRef.current = true;
    setSearchState((current) => ({
      ...DEFAULT_V2_STATE,
      search_v2: current.search_v2,
      page: 1,
      page_length: current.page_length,
      include_inactive: current.include_inactive,
    }));
    setAiInputMode(false);
    setAiPreview(null);
    toast.success("AI search applied.");
    logV2Event("ai_search_applied", {
      prompt: message,
      search_event_id: response?.search_event_id || "",
      found: Number(response?.found) || 0,
      applied_sort: response?.applied_sort || "",
      display_query: response.display_query,
      display_filters: response.display_filters,
    });
  };

  const applyGuidedAssistantResponse = (payload, userMessage = "") => {
    const normalized = normalizeGuidedAiResponse(payload);
    if (!normalized) {
      throw new Error("Guided assistant did not return a valid response.");
    }

    const suggestedAnswers = mergeGuidedSuggestedAnswers(
      normalized.suggested_answers,
      deriveV2SuggestedAnswers(
        normalized.question_key,
        visibleFilterOptions,
        normalized.suggested_answers
      )
    );

    const nextSession = buildGuidedSessionFromResponse(
      {
        ...normalized,
        suggested_answers: suggestedAnswers,
        result_count:
          normalized.result_count !== null && normalized.result_count !== undefined
            ? normalized.result_count
            : found,
      },
      guidedAssistantSession,
      userMessage
    );

    setGuidedAssistantSession(nextSession);
    setGuidedAssistantInput("");
    setGuidedAssistantOpen(true);
    clearAiSession();

    const nextState = buildV2StateFromGuidedResponse(normalized, searchState);
    syncUrlRef.current = true;
    setSearchInput(normalized.applied_query || "");
    updateState(nextState);

    if (normalized.done) {
      toast.success("Guided assistant applied the latest filters.");
    }
  };

  const submitGuidedAssistant = async (overrideValue) => {
    const message = String(overrideValue ?? guidedAssistantInput).trim();
    if (!message) {
      toast.info("Tell the assistant what you need first.");
      return;
    }
    if (guidedAssistantSession?.question_key && isGuidedSkipAnswer(message)) {
      await skipGuidedAssistantQuestion();
      return;
    }

    setGuidedAssistantLoading(true);
    try {
      const isContinuation = Boolean(guidedAssistantSession?.messages?.length);
      const response = isContinuation
        ? await continueGuidedAiSearch({
            session_id: guidedAssistantSession?.session_id || "",
            source_message: (guidedAssistantSession?.messages || [])
              .filter((entry) => entry?.role === "user")
              .map((entry) => entry?.content || "")
              .join(" "),
            applied_query: guidedAssistantSession?.current_query || "",
            current_intent: guidedAssistantSession?.current_intent || {},
            resolved_intent: guidedAssistantSession?.resolved_intent || null,
            question_key: guidedAssistantSession?.question_key || "",
            answer: message,
            page_context: { route: router.pathname, search: searchState.q || "" },
            feature_flag_override: featureFlagOverride,
          })
        : await startGuidedAiSearch({
            message,
            page_context: { route: router.pathname, search: searchState.q || "" },
            feature_flag_override: featureFlagOverride,
          });

      applyGuidedAssistantResponse(response, message);
    } catch (err) {
      toast.error(err?.message || "Guided assistant failed. Please try again.");
    } finally {
      setGuidedAssistantLoading(false);
    }
  };

  const skipGuidedAssistantQuestion = async () => {
    if (!guidedAssistantSession?.question_key) return;
    setGuidedAssistantLoading(true);
    try {
      const response = await continueGuidedAiSearch({
        session_id: guidedAssistantSession?.session_id || "",
        source_message: (guidedAssistantSession?.messages || [])
          .filter((entry) => entry?.role === "user")
          .map((entry) => entry?.content || "")
          .join(" "),
        applied_query: guidedAssistantSession?.current_query || "",
        current_intent: guidedAssistantSession?.current_intent || {},
        resolved_intent: guidedAssistantSession?.resolved_intent || null,
        question_key: guidedAssistantSession?.question_key || "",
        skip: 1,
        page_context: { route: router.pathname, search: searchState.q || "" },
        feature_flag_override: featureFlagOverride,
      });
      applyGuidedAssistantResponse(response);
    } catch (err) {
      toast.error(err?.message || "Unable to skip this question right now.");
    } finally {
      setGuidedAssistantLoading(false);
    }
  };

  const openGuidedAssistant = () => {
    setGuidedAssistantOpen(true);
  };

  const closeGuidedAssistant = () => {
    setGuidedAssistantOpen(false);
  };

  const removeLastGuidedAnswer = async () => {
    const userMessages = getGuidedUserMessages(guidedAssistantSession);
    if (userMessages.length === 0) return;

    setGuidedAssistantLoading(true);
    try {
      await rebuildGuidedAssistantFromMessages(userMessages.slice(0, -1));
      toast.success(
        userMessages.length > 1
          ? "Removed the last answer and rebuilt the guided search."
          : "Cleared the guided search and reset the catalog."
      );
    } catch (error) {
      toast.error(error?.message || "Unable to remove the last answer right now.");
    } finally {
      setGuidedAssistantLoading(false);
    }
  };

  useEffect(() => {
    if (!guidedAssistantSession?.question_key) return;

    const fallbackSuggestions = deriveV2SuggestedAnswers(
      guidedAssistantSession.question_key,
      visibleFilterOptions,
      guidedAssistantSession.suggested_answers
    );
    const nextSuggestions = mergeGuidedSuggestedAnswers(
      guidedAssistantSession.suggested_answers,
      fallbackSuggestions
    );

    setGuidedAssistantSession((current) => {
      if (!current?.question_key) return current;
      const sameSuggestions =
        JSON.stringify(current.suggested_answers || []) === JSON.stringify(nextSuggestions);
      const sameCount = Number(current.result_count || 0) === Number(found || 0);
      if (sameSuggestions && sameCount) return current;
      return {
        ...current,
        suggested_answers: nextSuggestions,
        result_count: Number(found || 0),
      };
    });
  }, [visibleFilterOptions, found, guidedAssistantSession?.question_key]);

  useEffect(() => {
    if (!guidedAssistantSession?.question_key) {
      guidedAutoQuestionKeyRef.current = "";
      return;
    }
    if ((guidedAssistantSession?.suggested_answers || []).length !== 1) {
      guidedAutoQuestionKeyRef.current = "";
      return;
    }
    if (guidedAutoQuestionKeyRef.current === guidedAssistantSession.question_key) {
      return;
    }

    const onlySuggestion = guidedAssistantSession.suggested_answers[0];
    if (!onlySuggestion?.value || guidedAssistantLoading) return;

    guidedAutoQuestionKeyRef.current = guidedAssistantSession.question_key;
    submitGuidedAssistant(onlySuggestion.value);
  }, [guidedAssistantSession, guidedAssistantLoading]);

  const gridClass =
    "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1920px]:grid-cols-6";

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased">
      <SearchHero
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSubmit={handleSubmitSearch}
        onKeyDown={handleSuggestionKeyDown}
        suggestionsLoading={suggestionsLoading}
        suggestionsOpen={suggestionsOpen}
        setSuggestionsOpen={setSuggestionsOpen}
        suggestions={suggestions}
        activeSuggestionIndex={activeSuggestionIndex}
        onSuggestionSelect={handleSuggestionSelect}
        suggestionsContainerRef={suggestionsContainerRef}
        searchInputRef={searchInputRef}
        loading={loading}
        found={found}
        searchLatencyMs={searchLatencyMs}
        suggestLatencyMs={suggestLatencyMs}
        fallbackMessage={fallbackMessage}
        aiExplanation={aiExplanation}
        aiInputMode={aiInputMode}
        onEnterAiMode={enterAiMode}
        onExitAiMode={exitAiInputMode}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        aiLoading={aiLoading}
        aiPreview={aiPreview}
        aiPreviewChips={aiPreviewChips}
        aiPreviewFresh={aiPreviewFresh}
        aiPreviewError={aiPreviewError}
        onInterpretAi={interpretAiSearch}
        onApplyAi={applyAiPreview}
        aiPanelMode={aiPanelMode}
        guidedSession={guidedAssistantSession}
        guidedLoading={guidedAssistantLoading}
        guidedInputValue={guidedAssistantInput}
        setGuidedInputValue={setGuidedAssistantInput}
        guidedPlaceholder={guidedPlaceholder}
        onStartGuided={startGuidedFromAi}
        onGuidedSubmit={() => submitGuidedAssistant()}
        onGuidedChip={(suggestion) =>
          submitGuidedAssistant(suggestion?.value || suggestion?.label || "")
        }
        onGuidedSkip={skipGuidedAssistantQuestion}
        onGuidedShowResults={showGuidedResults}
        onGuidedStartOver={() => resetGuidedAssistant(true)}
        onGuidedRemoveLast={removeLastGuidedAnswer}
      />

      <div className="mx-auto max-w-[1700px] px-[12px]">
        <div className={`grid gap-[8px] py-4 ${
          salesMode && rightPanel
            ? "lg:grid-cols-[240px_minmax(0,1fr)_360px]"
            : "lg:grid-cols-[230px_minmax(0,1fr)]"
        }`}>
          <aside className="hidden lg:block">
            <div className="sticky top-[12px] rounded-[10px] border border-[#e9edf2] bg-white">
              <FilterPanel
                filters={searchState.filters}
                visibleFilterOptions={visibleFilterOptions}
                updateMultiFilter={updateMultiFilter}
                updateRangeFilter={updateRangeFilter}
                clearFilters={clearFilters}
                setInStock={setInStock}
                setShowPromotion={setShowPromotion}
                setManufacturedOnly={setManufacturedOnly}
              />
            </div>
          </aside>

          <section className="min-w-0">
            <ResultsToolbar
              loading={loading}
              found={found}
              sortValue={searchState.sort_by}
              onSortChange={(value) => {
                exitAiMode();
                updateState((current) => ({ ...current, sort_by: value, page: 1 }));
              }}
              pageLength={searchState.page_length}
              onPageLengthChange={(value) =>
                updateState((current) => ({ ...current, page_length: value, page: 1 }))
              }
              density={density}
              onDensityChange={setDensity}
              includeInactive={searchState.include_inactive}
              onIncludeInactiveChange={(checked) =>
                updateState((current) => ({
                  ...current,
                  include_inactive: checked,
                  page: 1,
                }))
              }
              isSystemManager={isSystemManager}
              diagnosticsEnabled={diagnosticsEnabled}
              onOpenDiagnostics={() => setDiagnosticsOpen(true)}
              onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            />

            <ActiveFiltersSummary
              filters={searchState.filters}
              query={isAiMode ? "" : searchState.q}
              chips={isAiMode ? aiDisplayChips : undefined}
              readOnly={isAiMode}
              debugMode={diagnosticsEnabled}
              onClearFilter={handleClearFilter}
              onClearAll={isAiMode ? clearAiSearch : clearFilters}
            />

            {salesMode && (
              <AiStatusBanner aiSession={aiSession} onClear={clearAiSession} />
            )}

            {searchDisabled ? (
              <SearchUnavailableState />
            ) : loading && results.length === 0 ? (
              <ResultsSkeleton count={density === "compact" ? 18 : 15} />
            ) : error ? (
              <ErrorState
                message={error}
                hasFilters={isAiMode ? aiDisplayChips.length > 0 : hasActiveFilters(searchState.filters)}
                onRetry={() => executeSearch(searchState)}
              />
            ) : !loading && results.length === 0 ? (
              <EmptyState
                query={activeResultQuery || (isAiMode ? aiSession.message : searchState.q)}
                hasFilters={isAiMode ? aiDisplayChips.length > 0 : hasActiveFilters(searchState.filters)}
                onClear={clearFilters}
                onAskAi={enterAiMode}
              />
            ) : (
              <div className="relative">
                {loading && (
                  <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-white/60 backdrop-blur-[1px]" />
                )}
                <div className={`${gridClass} transition-opacity duration-200 ${loading ? "opacity-50" : "opacity-100"}`}>
                  {results.map((hit, index) => {
                    const document = normalizeSearchHit(hit);
                    return (
                      <ProductCard
                        key={`${document.item_code || "result"}-${index}`}
                        document={document}
                        query={activeResultQuery}
                        onNavigate={handleNavigate}
                        onQuickView={openQuickView}
                        onShortlist={addToShortlist}
                        onWishlist={addToWishlist}
                        onReportIssue={handleOpenIssueModal}
                        isWishlisted={isWishlisted(document)}
                        isShortlisted={isShortlisted(document)}
                        includeInactive={searchState.include_inactive}
                        dense={density === "compact"}
                        salesMode={salesMode}
                        cartQty={salesMode ? getCartQty(document) : 0}
                        onAddToCart={salesMode ? handleOpenCartModal : undefined}
                        isTourAnchor={index === 0}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <Pagination
              page={searchState.page}
              pageLength={searchState.page_length}
              total={found}
              onPageChange={(page) => updateState((current) => ({ ...current, page }))}
            />
          </section>

          {salesMode && rightPanel && (
            <aside className="hidden lg:block">
              <div className="sticky top-[12px] rounded-[10px] border border-[#e9edf2] bg-white">
                {rightPanel}
              </div>
            </aside>
          )}
        </div>
      </div>

      <MobileFilterDialog
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={searchState.filters}
        visibleFilterOptions={visibleFilterOptions}
        updateMultiFilter={updateMultiFilter}
        updateRangeFilter={updateRangeFilter}
        clearFilters={clearFilters}
        setInStock={setInStock}
        setShowPromotion={setShowPromotion}
        setManufacturedOnly={setManufacturedOnly}
      />

      <V2QuickViewDrawer
        open={drawerOpen}
        item={selectedItem}
        detail={selectedDetail}
        loading={quickViewLoading}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedItem(null);
          setSelectedDetail(null);
        }}
        onNavigate={handleNavigate}
        onShortlist={addToShortlist}
        onWishlist={addToWishlist}
        isWishlisted={selectedDetail ? isWishlisted(selectedDetail) : false}
        isShortlisted={selectedDetail ? isShortlisted(selectedDetail) : false}
        searchV2Requested={searchV2Requested}
      />

      {diagnosticsEnabled && (
        <DiagnosticsDialog
          open={diagnosticsOpen}
          onClose={() => setDiagnosticsOpen(false)}
          searchLatencyMs={searchLatencyMs}
          suggestLatencyMs={suggestLatencyMs}
          queryDebug={queryDebug}
          searchState={searchState}
          found={found}
          aiSession={aiSession}
          events={getV2Events()}
        />
      )}

      {addModalProduct && (
        <SalesAddToCartModal
          product={addModalProduct}
          onClose={() => setAddModalProduct(null)}
          onConfirm={async (qty) => {
            await onAddToCart?.(addModalProduct, qty);
          }}
        />
      )}

      {detailModalOpen && (
        <ProductDetail
          visible={detailModalOpen}
          productData={detailModalProduct}
          hide={() => {
            setDetailModalOpen(false);
            setDetailModalProduct(null);
            window.document.body.style.overflow = "unset";
          }}
        />
      )}
    </div>
  );
}

function assertAiDisplayResponse(response) {
  if (
    typeof response?.display_query !== "string" ||
    !Array.isArray(response?.display_filters)
  ) {
    throw new Error(AI_DISPLAY_CONTRACT_ERROR);
  }
}

function buildAiDisplayChips(session) {
  if (!session || session.mode !== "ai") {
    return [];
  }

  const chips = [];
  const displayQuery =
    typeof session.display_query === "string" ? session.display_query.trim() : "";

  if (displayQuery) {
    chips.push({
      id: "ai-query",
      key: "query",
      label: "Search",
      value: displayQuery,
    });
  }

  (Array.isArray(session.display_filters) ? session.display_filters : []).forEach(
    (filter, index) => {
      const label = typeof filter?.label === "string" ? filter.label.trim() : "";
      const displayValue =
        filter?.value_display !== undefined && filter?.value_display !== null
          ? filter.value_display
          : filter?.value;
      const value = String(displayValue ?? "").trim();

      if (!label || !value) {
        return;
      }

      chips.push({
        id: `ai-${filter?.key || "filter"}-${index}`,
        key: filter?.key || `filter-${index}`,
        label,
        value,
      });
    }
  );

  return chips;
}

function buildSearchFingerprint({ isAiSearch, payload }) {
  return JSON.stringify({
    mode: isAiSearch ? "ai" : "standard",
    payload: payload || {},
  });
}

function getSearchErrorMessage(errorOrMessage) {
  const fallback = "Unable to load search results.";
  const message =
    typeof errorOrMessage === "string"
      ? errorOrMessage
      : errorOrMessage?.message || "";
  if (!message || typeof message !== "string") {
    return fallback;
  }

  const lowered = message.toLowerCase();
  if (lowered.includes("timed out")) {
    return "Search timed out. Please narrow filters and try again.";
  }

  if (lowered.includes("filter") && lowered.includes("validation")) {
    return "The selected filters could not be applied. Please adjust them and try again.";
  }

  if (lowered.includes("malformed") && lowered.includes("filter")) {
    return "The selected filters could not be applied. Please adjust them and try again.";
  }

  return message;
}
