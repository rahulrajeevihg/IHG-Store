import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  aiSearchProductsV2,
  applyPromptDerivedSpecFilters,
  adaptFacetCounts,
  buildFeatureFlagOverride,
  buildMasterOptions,
  DEFAULT_V2_STATE,
  getIsSystemManager,
  normalizeSearchHit,
  queryFromState,
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
  get_all_masters,
  get_product_details,
  insert_cart_items,
} from "@/libs/api";
import V2QuickViewDrawer from "./V2QuickViewDrawer";
import { VISIBLE_FILTERS } from "./constants";
import {
  hasActiveFilters,
  looksLikeSku,
  summarizeFiltersForMetrics,
} from "./utils/format";
import SearchHero from "./components/SearchHero";
import ResultsToolbar from "./components/ResultsToolbar";
import FilterPanel, { MobileFilterDialog } from "./components/FilterPanel";
import ActiveFiltersSummary from "./components/ActiveFiltersSummary";
import ProductCard from "./components/ProductCard";
import Pagination from "./components/Pagination";
import ResultsSkeleton from "./components/ResultsSkeleton";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import AiSearchDialog from "./components/AiSearchDialog";
import DiagnosticsDialog from "./components/DiagnosticsDialog";
import AiStatusBanner from "@/components/Sales/AiStatusBanner";

const DENSITY_STORAGE_KEY = "v2:density";
const DEV_MODE = process.env.NODE_ENV !== "production";
const AI_DISPLAY_CONTRACT_ERROR =
  "AI search response is missing display metadata. Please refresh after the backend update or use standard search.";

export default function V2SearchPage({
  onFallback,
  fallbackMessage,
  // Sales workspace props
  salesMode = false,
  onAddToCart,
  rightPanel,
}) {
  const router = useRouter();
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
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
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
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [aiSession, setAiSession] = useState(null);

  const initializedRef = useRef(false);
  const syncUrlRef = useRef(false);
  const skipNextSearchRef = useRef(false);
  const preserveAiSessionOnRouteSyncRef = useRef(false);
  const activeSearchController = useRef(null);
  const activeSuggestController = useRef(null);
  const detailCacheRef = useRef({});
  const suggestionsContainerRef = useRef(null);

  const searchV2Requested = searchState.search_v2 || router.query.search_v2 === "1";
  const diagnosticsEnabled = isSystemManager && router.query.debug_v2 === "1";
  const featureFlagOverride = useMemo(
    () => buildFeatureFlagOverride(searchV2Requested),
    [searchV2Requested]
  );
  const isAiMode = Boolean(aiSession?.mode === "ai" && aiSession?.message);
  const aiDisplayChips = useMemo(() => buildAiDisplayChips(aiSession), [aiSession]);
  const activeResultQuery = isAiMode ? aiSession.display_query || "" : searchState.q;

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
      const masterOptions = mastersData?.[filter.key] || [];
      const currentFacetMap = facetMap?.[filter.key] || {};
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

  const exitAiMode = () => {
    if (isAiMode) {
      setSearchInput(searchState.q || "");
    }
    clearAiSession();
  };

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

    if (activeSearchController.current) activeSearchController.current.abort();
    const controller = new AbortController();
    activeSearchController.current = controller;

    setLoading(true);
    setError("");

    try {
      if (DEV_MODE) {
        console.debug("[V2 search] request", requestPayload);
      }

      const response = isAiSearch
        ? await aiSearchProductsV2(requestPayload, { signal: controller.signal })
        : await searchProductsV2(requestPayload, { signal: controller.signal });

      if (isAiSearch) {
        assertAiDisplayResponse(response);
      }

      const hits = Array.isArray(response?.hits) ? response.hits : [];

      setResults(hits);
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
      if (DEV_MODE) {
        console.error("[V2 search] failed", {
          requestPayload,
          error: err,
        });
      }
      const message = getSearchErrorMessage(err?.message);
      if (isAiSearch && message === AI_DISPLAY_CONTRACT_ERROR) {
        clearAiSession();
      }
      setError(message);
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
    executeSearch(searchState);
  }, [searchState, hydrated, isSystemManager]);

  useEffect(() => {
    if (!hydrated) return;
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
        if (err?.name !== "AbortError") {
          setSuggestions([]);
          logV2Event("suggestions_failed", {
            query: searchInput.trim(),
            message: err?.message || "Suggestion request failed.",
          });
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput, hydrated, featureFlagOverride]);

  const updateState = (updater) => {
    setSearchState((current) => {
      const nextState = typeof updater === "function" ? updater(current) : updater;
      return nextState;
    });
  };

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

  const clearFilters = () => {
    if (isAiMode) {
      clearAiSearch();
      return;
    }
    clearAiSession();
    updateState((current) => ({
      ...DEFAULT_V2_STATE,
      search_v2: current.search_v2,
      q: current.q,
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
        [key]: current.filters[key].filter((entry) => entry !== value),
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
    try {
      const detail = await ensureProductDetail(document.item_code);
      setSelectedDetail({ ...document, ...detail });
    } catch (err) {
      toast.error(err?.message || "Unable to load product detail.");
    } finally {
      setQuickViewLoading(false);
    }
  };

  const handleNavigate = (document) => {
    const itemCode = document?.item_code || document?.name;
    if (!itemCode) return;
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
    if (selectedDetail) {
      localStorage.setItem("product_detail", JSON.stringify(selectedDetail));
    }
    router.push(`/pr/${itemCode}`);
  };

  const handleAiSearch = async () => {
    const message = aiPrompt.trim();
    if (!message) {
      toast.info("Enter a search intent first.");
      return;
    }
    setAiLoading(true);
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

      const deterministicSearch = applyPromptDerivedSpecFilters(
        {
          ...DEFAULT_V2_STATE,
          search_v2: searchState.search_v2,
          page: 1,
          page_length: searchState.page_length,
          include_inactive: searchState.include_inactive,
        },
        message
      );
      const hasDerivedPowerConstraint = deterministicSearch.displayFilters.some(
        (filter) => filter.key === "power_value_range"
      );

      if (hasDerivedPowerConstraint) {
        const response = await searchProductsV2({
          query: deterministicSearch.state.q || "",
          filters: sanitizeV2FiltersForRequest(deterministicSearch.state.filters),
          sort_by: "",
          page: 1,
          page_length: searchState.page_length,
          include_inactive: searchState.include_inactive,
          feature_flag_override: featureFlagOverride,
        });
        const explanation = "Deterministic parsing extracted SKU/spec/sort signals.";

        setAiExplanation(explanation);
        setAiSession({
          mode: "ai",
          message,
          display_query: deterministicSearch.state.q || "",
          display_filters: deterministicSearch.displayFilters,
          search_event_id: "",
          resolved_intent: {
            intent_class: "spec_match",
            provider: "deterministic",
            llm_used: false,
          },
          applied_filters: deterministicSearch.state.filters,
          applied_sort: "",
          applied_relaxations: [],
          quality_signals: {
            deterministic_only: true,
          },
          explanation,
          found: Number(response?.found) || 0,
        });
        setSearchInput(message);
        setResults(Array.isArray(response?.hits) ? response.hits : []);
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
        setAiModalOpen(false);
        toast.success("AI search applied.");
        logV2Event("ai_search_applied", {
          prompt: message,
          found: Number(response?.found) || 0,
          applied_sort: "",
          display_query: deterministicSearch.state.q || "",
          display_filters: deterministicSearch.displayFilters,
        });
        return;
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
      setResults(Array.isArray(response?.hits) ? response.hits : []);
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
      setAiModalOpen(false);
      toast.success("AI search applied.");
      logV2Event("ai_search_applied", {
        prompt: message,
        search_event_id: response?.search_event_id || "",
        found: Number(response?.found) || 0,
        applied_sort: response?.applied_sort || "",
        display_query: response.display_query,
        display_filters: response.display_filters,
      });
    } catch (err) {
      const message = getSearchErrorMessage(err?.message);
      clearAiSession();
      setError(message);
      setResults([]);
      setFound(0);
      setLoading(false);
      toast.error(message || "AI search failed.");
      logV2Event("ai_search_failed", {
        prompt: aiPrompt.trim(),
        message,
      });
    } finally {
      setAiLoading(false);
    }
  };

  const gridClass = salesMode
    ? density === "compact"
      ? "grid grid-cols-2 gap-[12px] sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
      : "grid grid-cols-2 gap-[12px] sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
    : density === "compact"
      ? "grid grid-cols-2 gap-[12px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      : "grid grid-cols-2 gap-[12px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5";

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased">
      <SearchHero
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSubmit={handleSubmitSearch}
        onOpenAi={() => setAiModalOpen(true)}
        onKeyDown={handleSuggestionKeyDown}
        suggestionsLoading={suggestionsLoading}
        suggestionsOpen={suggestionsOpen}
        setSuggestionsOpen={setSuggestionsOpen}
        suggestions={suggestions}
        activeSuggestionIndex={activeSuggestionIndex}
        onSuggestionSelect={handleSuggestionSelect}
        suggestionsContainerRef={suggestionsContainerRef}
        loading={loading}
        found={found}
        searchLatencyMs={searchLatencyMs}
        suggestLatencyMs={suggestLatencyMs}
        fallbackMessage={fallbackMessage}
        aiExplanation={aiExplanation}
      />

      <div className="mx-auto max-w-[1700px] px-[24px]">
        <div className={`grid gap-[20px] py-[20px] ${
          salesMode && rightPanel
            ? "lg:grid-cols-[270px_minmax(0,1fr)_380px]"
            : "lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[310px_minmax(0,1fr)]"
        }`}>
          <aside className="hidden lg:block">
            <div className="sticky top-[20px]">
              <FilterPanel
                filters={searchState.filters}
                visibleFilterOptions={visibleFilterOptions}
                updateMultiFilter={updateMultiFilter}
                updateRangeFilter={updateRangeFilter}
                clearFilters={clearFilters}
                setInStock={setInStock}
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

            {loading ? (
              <ResultsSkeleton count={density === "compact" ? 18 : 15} />
            ) : error ? (
              <ErrorState
                message={error}
                hasFilters={isAiMode ? aiDisplayChips.length > 0 : hasActiveFilters(searchState.filters)}
                onRetry={() => executeSearch(searchState)}
              />
            ) : results.length === 0 ? (
              <EmptyState
                query={activeResultQuery || (isAiMode ? aiSession.message : searchState.q)}
                hasFilters={isAiMode ? aiDisplayChips.length > 0 : hasActiveFilters(searchState.filters)}
                onClear={clearFilters}
                onAskAi={() => setAiModalOpen(true)}
              />
            ) : (
              <div className={gridClass}>
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
                      isWishlisted={isWishlisted(document)}
                      isShortlisted={isShortlisted(document)}
                      includeInactive={searchState.include_inactive}
                      dense={density === "compact"}
                      salesMode={salesMode}
                      cartQty={salesMode ? getCartQty(document) : 0}
                      onAddToCart={salesMode ? onAddToCart : undefined}
                    />
                  );
                })}
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
              <div className="sticky top-[20px]">
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

      <AiSearchDialog
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        loading={aiLoading}
        onApply={handleAiSearch}
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

function getSearchErrorMessage(message) {
  const fallback = "Unable to load search results.";
  if (!message || typeof message !== "string") {
    return fallback;
  }

  const lowered = message.toLowerCase();
  if (lowered.includes("timed out")) {
    return "Search is taking too long to respond. Please try again.";
  }

  if (lowered.includes("filter") && lowered.includes("validation")) {
    return "The selected filters could not be applied. Please adjust them and try again.";
  }

  if (lowered.includes("malformed") && lowered.includes("filter")) {
    return "The selected filters could not be applied. Please adjust them and try again.";
  }

  return message;
}
