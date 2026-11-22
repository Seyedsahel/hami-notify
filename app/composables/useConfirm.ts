let pending: ((answer: boolean) => void) | undefined;
let activeOwner: symbol | undefined;

export function useConfirm() {
  const owner = Symbol("confirmation-owner");
  const prompt = useState<{
    title: string;
    message: string;
    action: string;
  } | null>("confirmation", () => null);
  function ask(
    message: string,
    action = "تأیید",
    title = "تأیید عملیات",
  ): Promise<boolean> {
    if (pending) return Promise.resolve(false);
    activeOwner = owner;
    prompt.value = { title, message, action };
    return new Promise((resolve) => {
      pending = resolve;
    });
  }
  function answer(value: boolean) {
    prompt.value = null;
    pending?.(value);
    pending = undefined;
    activeOwner = undefined;
  }
  onScopeDispose(() => {
    if (activeOwner === owner) answer(false);
  });
  return { prompt, ask, answer };
}
