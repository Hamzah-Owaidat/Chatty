"use client";
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Components, Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { countPrepended } from "@/utils/virtualList";

/**
 * Generic virtualized list on top of react-virtuoso — only the rows in (or near) view
 * are in the DOM, and rows can have any height (measured automatically).
 *
 * Covers both shapes of infinite list in the app:
 * - Feed (chat list): starts at the top, `onLoadMore` fires near the bottom.
 * - Chat (messages): `startAtBottom` + `onLoadPrevious` fires near the top, and with
 *   `preservePositionOnPrepend` the rows the user is looking at stay put when an older
 *   page is inserted above them.
 */

// Virtuoso needs a large positive starting index to count down from when prepending.
const START_INDEX = 1_000_000;

export type FollowOutput = boolean | "smooth" | "auto";

export interface VirtualListHandle {
  /** Scrolls to the last item — works even when rows near the end were never measured. */
  scrollToBottom: (behavior?: "smooth" | "auto") => void;
  scrollToTop: (behavior?: "smooth" | "auto") => void;
  /** The scrolling element, for DOM measurements. */
  getScroller: () => HTMLElement | null;
}

export interface VirtualListItemMeta {
  /**
   * True the first time this item is rendered by this list — false when it scrolls back
   * into view after being virtualized away. Use it to play entry animations only once.
   */
  isFirstMount: boolean;
}

export interface VirtualListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** `index` is the item's position in `items`. */
  renderItem: (item: T, index: number, meta: VirtualListItemMeta) => React.ReactNode;

  /** Called near the end of the list while `hasMore` is true and nothing is loading. */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;

  /** Called near the start of the list while `hasPrevious` is true and nothing is loading. */
  onLoadPrevious?: () => void;
  hasPrevious?: boolean;
  isLoadingPrevious?: boolean;

  /** Open scrolled to the last item (chat style). Only read on mount — re-key the list to reset. */
  startAtBottom?: boolean;
  /** Keep the visible rows in place when items are inserted above them. */
  preservePositionOnPrepend?: boolean;
  /** What to do when items are appended: scroll to follow them or stay put. */
  followOutput?: (isAtBottom: boolean) => FollowOutput;
  /** Distance in px from the bottom still counted as "at the bottom". */
  atBottomThreshold?: number;
  onAtBottomChange?: (atBottom: boolean) => void;
  onScroll?: (scroller: HTMLElement) => void;

  /** Rendered above the first / below the last item, inside the scroll area. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Replaces the default spinner shown while a page loads. */
  loadingIndicator?: React.ReactNode;
  /** Extra px rendered above and below the viewport, so fast scrolling shows fewer blanks. */
  overscan?: number;

  className?: string;
  style?: React.CSSProperties;
  ref?: React.Ref<VirtualListHandle>;
  "aria-label"?: string;
}

interface ListContext {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showTopLoader: boolean;
  showBottomLoader: boolean;
  loadingIndicator: React.ReactNode;
}

const DefaultLoadingIndicator = () => (
  <div className="flex justify-center py-3" role="status" aria-label="Loading more">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a7b9b] border-t-transparent dark:border-[#60c7e3] dark:border-t-transparent" />
  </div>
);

// Defined once at module level — Virtuoso remounts these if their identity changes, so
// everything dynamic reaches them through `context` instead of closures.
const components: Components<unknown, ListContext> = {
  Header: ({ context }) => (
    <>
      {context?.showTopLoader && context.loadingIndicator}
      {context?.header}
    </>
  ),
  Footer: ({ context }) => (
    <>
      {context?.footer}
      {context?.showBottomLoader && context.loadingIndicator}
    </>
  ),
  List: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function List(props, ref) {
    return <div {...props} ref={ref} role="list" />;
  }),
  Item: ({ children, ...props }) => (
    <div {...props} role="listitem">
      {children}
    </div>
  ),
};

/**
 * Wraps each row so it knows whether this is its first appearance. The flow-root makes
 * the row contain its children's margins — otherwise a child's top/bottom margin would
 * leak out of the row and Virtuoso would measure the row too short, making it jump.
 */
function VirtualRow({
  itemKey,
  seenKeys,
  children,
}: {
  itemKey: string;
  seenKeys: Set<string>;
  children: (meta: VirtualListItemMeta) => React.ReactNode;
}) {
  const [isFirstMount] = useState(() => !seenKeys.has(itemKey));

  useEffect(() => {
    seenKeys.add(itemKey);
  }, [itemKey, seenKeys]);

  return <div style={{ display: "flow-root" }}>{children({ isFirstMount })}</div>;
}

export default function VirtualList<T>({
  items,
  getKey,
  renderItem,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onLoadPrevious,
  hasPrevious = false,
  isLoadingPrevious = false,
  startAtBottom = false,
  preservePositionOnPrepend = false,
  followOutput,
  atBottomThreshold = 4,
  onAtBottomChange,
  onScroll,
  header,
  footer,
  loadingIndicator,
  overscan = 400,
  className,
  style,
  ref,
  "aria-label": ariaLabel,
}: VirtualListProps<T>) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const [seenKeys] = useState(() => new Set<string>());

  // Virtuoso keeps the viewport anchored on a prepend only if firstItemIndex drops by
  // exactly the number of inserted items, in the same render as the new data. Adjusting
  // state during render (rather than in an effect) guarantees that.
  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX);
  const [prevItems, setPrevItems] = useState(items);
  let currentFirstItemIndex = firstItemIndex;

  if (items !== prevItems) {
    setPrevItems(items);

    if (preservePositionOnPrepend) {
      const prepended = countPrepended(prevItems, items, getKey);
      if (prepended > 0) {
        currentFirstItemIndex = firstItemIndex - prepended;
        setFirstItemIndex(currentFirstItemIndex);
      }
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom: (behavior = "auto") =>
        virtuosoRef.current?.scrollToIndex({ index: "LAST", align: "end", behavior }),
      scrollToTop: (behavior = "auto") => virtuosoRef.current?.scrollTo({ top: 0, behavior }),
      getScroller: () => scrollerRef.current,
    }),
    []
  );

  // onScroll is a prop that can change every render — read it through a ref so the
  // listener is attached once per scroller.
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;

  const handleScroll = useCallback((e: Event) => {
    onScrollRef.current?.(e.currentTarget as HTMLElement);
  }, []);

  const setScroller = useCallback(
    (el: HTMLElement | Window | null) => {
      scrollerRef.current?.removeEventListener("scroll", handleScroll);
      scrollerRef.current = el instanceof HTMLElement ? el : null;
      scrollerRef.current?.addEventListener("scroll", handleScroll, { passive: true });
    },
    [handleScroll]
  );

  useEffect(() => () => scrollerRef.current?.removeEventListener("scroll", handleScroll), [handleScroll]);

  const indicator = loadingIndicator ?? <DefaultLoadingIndicator />;

  return (
    <Virtuoso<T, ListContext>
      ref={virtuosoRef}
      scrollerRef={setScroller}
      data={items}
      firstItemIndex={currentFirstItemIndex}
      initialTopMostItemIndex={startAtBottom && items.length > 0 ? { index: items.length - 1, align: "end" } : 0}
      computeItemKey={(_, item) => getKey(item)}
      itemContent={(index, item) => (
        <VirtualRow itemKey={getKey(item)} seenKeys={seenKeys}>
          {(meta) => renderItem(item, index - currentFirstItemIndex, meta)}
        </VirtualRow>
      )}
      endReached={() => {
        if (hasMore && !isLoadingMore) onLoadMore?.();
      }}
      startReached={() => {
        if (hasPrevious && !isLoadingPrevious) onLoadPrevious?.();
      }}
      followOutput={followOutput}
      atBottomThreshold={atBottomThreshold}
      atBottomStateChange={onAtBottomChange}
      increaseViewportBy={overscan}
      context={{
        header,
        footer,
        showTopLoader: isLoadingPrevious,
        showBottomLoader: isLoadingMore,
        loadingIndicator: indicator,
      }}
      components={components as Components<T, ListContext>}
      className={className}
      // A smooth scroll-behavior (e.g. from .chat-scrollbar) would animate the instant
      // scroll corrections Virtuoso makes when rows are measured or prepended.
      style={{ height: "100%", scrollBehavior: "auto", ...style }}
      aria-label={ariaLabel}
    />
  );
}
