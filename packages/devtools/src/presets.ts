/**
 * Component names rendered by the Next.js App Router itself, as observed in
 * Next 16.4 development builds. This is a maintained list, not detection:
 * it can go stale when Next changes its internals.
 *
 * Deliberately excluded because the names are generic and a user component
 * could share them: Root, Router, Head, ErrorBoundary. Use the "Hide names"
 * input to hide those yourself.
 */
export const NEXTJS_INTERNAL_NAMES: readonly string[] = [
  "__next_*",
  "ServerRoot",
  "AppRouter",
  "RootErrorBoundary",
  "ErrorBoundaryHandler",
  "HistoryUpdater",
  "HotReload",
  "AppDevOverlayErrorBoundary",
  "ReplaySsrOnlyErrors",
  "DevRootHTTPAccessFallbackBoundary",
  "HTTPAccessFallbackBoundary",
  "HTTPAccessFallbackErrorBoundary",
  "RedirectBoundary",
  "RedirectErrorBoundary",
  "IconMark",
  "OuterLayoutRouter",
  "InnerLayoutRouter",
  "SegmentStateProvider",
  "RenderFromTemplateContext",
  "ScrollHandler",
  "InnerScrollHandler",
  "LoadingBoundary",
  "SegmentViewNode",
  "SegmentTrieNode",
  "SegmentViewStateNode",
  "SegmentBoundaryTriggerNode",
  "AppRouterAnnouncer",
];