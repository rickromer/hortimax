export type CalendarLoadState = "loading" | "error" | "empty" | "ready";

export function getCalendarLoadState({
  isLoading,
  isError,
  entriesCount,
}: {
  isLoading: boolean;
  isError: boolean;
  entriesCount: number;
}): CalendarLoadState {
  if (isLoading) return "loading";
  if (isError) return "error";
  return entriesCount === 0 ? "empty" : "ready";
}
