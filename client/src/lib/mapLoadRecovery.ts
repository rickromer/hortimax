/** Un fallo de red aislado se recupera automáticamente una vez; luego el usuario decide reintentar. */
export const MAX_AUTOMATIC_MAP_RETRIES = 1;

export function canRetryMapLoadAutomatically(attempts: number) {
  return attempts < MAX_AUTOMATIC_MAP_RETRIES;
}
