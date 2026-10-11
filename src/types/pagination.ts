/** Offset paging (?top=&skip=) — used where items don't shift while scrolling much, e.g. the chat list. */
export interface OffsetPageRequest {
  top: number;
  skip?: number;
}

/** Cursor paging (?top=&before=) — `before` is the id of the oldest item already loaded. */
export interface CursorPageRequest {
  top: number;
  before?: string;
}
