import type { SmsSettingsResponse, SmsSettings } from "~/types/api";

export const useSmsSettingsStore = defineStore("sms-settings", () => {
  const api = useApi();
  const resource = useResourceRequest((_query: undefined, signal) =>
    api.get<SmsSettingsResponse>("/sms/settings", { signal }),
  );

  async function save(input: SmsSettings) {
    const saved = await api.put<SmsSettings, SmsSettings>(
      "/sms/settings",
      input,
    );
    if (resource.data.value)
      resource.data.value = { ...resource.data.value, settings: saved };
    return saved;
  }

  return {
    data: resource.data,
    loading: resource.loading,
    error: resource.error,
    fetchSettings: () => resource.execute(undefined),
    save,
  };
});
