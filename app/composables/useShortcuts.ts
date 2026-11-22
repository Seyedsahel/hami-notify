export function useShortcuts(
  handler: (event: KeyboardEvent, editing: boolean) => void,
) {
  function keydown(event: KeyboardEvent) {
    if (document.querySelector("dialog[open]")) return;
    const editing =
      event.target instanceof HTMLElement &&
      (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName) ||
        event.target.isContentEditable);
    handler(event, editing);
  }
  onMounted(() => document.addEventListener("keydown", keydown));
  onUnmounted(() => document.removeEventListener("keydown", keydown));
}
