/** Solo se toma la posición inicial al abrir el selector, nunca durante la exploración manual. */
export function shouldApplyInitialPickerPosition(open: boolean, wasOpen: boolean) {
  return open && !wasOpen;
}
