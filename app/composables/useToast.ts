export function useToast() {
  const messages = useState<
    { id: string; message: string; kind: "success" | "error" }[]
  >("toast-messages", () => []);
  function dismiss(id: string) {
    messages.value = messages.value.filter((item) => item.id !== id);
  }
  function show(message: string, kind: "success" | "error") {
    const id = crypto.randomUUID();
    messages.value = [...messages.value, { id, message, kind }];
    setTimeout(() => dismiss(id), 6000);
  }
  return {
    messages,
    dismiss,
    success: (message: string) => show(message, "success"),
    error: (message: string) => show(message, "error"),
  };
}
