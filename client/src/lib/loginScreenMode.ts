export function shouldShowInitialSetup(needsSetup: boolean, search: string) {
  return needsSetup && new URLSearchParams(search).get("setup") === "1";
}
