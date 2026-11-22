import type {
  Page,
  SmsMessage,
  SmsDetail,
  SmsQuery,
  EducationSmsInput,
  StockSmsInput,
} from "~/types/api";

export const useSmsStore = defineStore("sms", () => {
  const api = useApi();
  const list = useResourceRequest((query: SmsQuery, signal) =>
    api.get<Page<SmsMessage>>("/sms/messages", { query: { ...query }, signal }),
  );
  const detail = useResourceRequest((id: string, signal) =>
    api.get<SmsDetail>(`/sms/messages/${encodeURIComponent(id)}`, { signal }),
  );

  function reconcile(message: SmsMessage) {
    if (list.data.value) {
      list.data.value = {
        ...list.data.value,
        items: list.data.value.items.map((item) =>
          item.id === message.id ? message : item,
        ),
      };
    }
    if (detail.data.value?.message.id === message.id) detail.reset();
    return message;
  }

  async function sendEducation(
    input: EducationSmsInput,
    idempotencyKey: string,
  ) {
    const result = await api.post<SmsMessage, EducationSmsInput>(
      "/sms/education",
      input,
      {
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
    list.reset();
    return result;
  }

  async function sendStock(input: StockSmsInput) {
    const result = await api.post<{ items: SmsMessage[] }, StockSmsInput>(
      "/sms/stock",
      input,
    );
    list.reset();
    return result.items;
  }

  async function retry(id: string) {
    return reconcile(
      await api.post<SmsMessage, never>(
        `/sms/messages/${encodeURIComponent(id)}/retry`,
      ),
    );
  }

  async function refreshDelivery(id: string) {
    return reconcile(
      await api.post<SmsMessage, never>(
        `/sms/messages/${encodeURIComponent(id)}/refresh-delivery`,
      ),
    );
  }

  return {
    page: list.data,
    loading: list.loading,
    error: list.error,
    fetchPage: list.execute,
    detail: detail.data,
    detailLoading: detail.loading,
    detailError: detail.error,
    fetchDetail: detail.execute,
    sendEducation,
    sendStock,
    retry,
    refreshDelivery,
  };
});
