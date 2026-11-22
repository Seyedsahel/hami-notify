<script setup lang="ts">
import { normalizeSearch, publicLink, formatDate } from "~/utils/format";
definePageMeta({ layout: "admin" });
const store = useEducationStore();
const q = useQueryFilter("q");
const page = usePageNumber();
const { reload } = useListLoader(
  () => ({ q: normalizeSearch(q.value), page: page.value, limit: 12 }),
  store.fetchPage,
);
</script>
<template>
  <AdminHeading
    title="آموزش‌ها"
    description="آموزش‌های منتشرشده در سایت فروشگاه"
    ><NuxtLink class="button button-primary" to="/education/send"
      >ارسال لینک برای مشتری</NuxtLink
    ></AdminHeading
  >
  <div class="card stack">
    <UiInput
      v-model="q"
      label="جست‌وجوی آموزش"
      type="search"
      placeholder="عنوان، خلاصه یا کد آموزش"
    />
    <UiAsyncState
      :loading="store.loading"
      :error="store.error?.message"
      :empty="!store.page?.items?.length"
      @retry="reload"
      ><div class="education-list">
        <article
          v-for="item in store.page?.items || []"
          :key="item.slug"
          class="card education-row"
        >
          <img
            v-if="publicLink(item.thumbnail_url || '')"
            :src="publicLink(item.thumbnail_url || '')"
            alt=""
            loading="lazy"
          />
          <div class="education-content">
            <h2>{{ item.title }}</h2>
            <p>{{ item.summary }}</p>
          </div>
          <div class="education-meta">
            <small class="muted">{{ formatDate(item.published_at) }}</small>
            <a
              v-if="publicLink(item.url)"
              class="text-link"
              :href="publicLink(item.url)"
              target="_blank"
              rel="noopener noreferrer"
              >مشاهده در فروشگاه</a
            >
          </div>
        </article>
      </div></UiAsyncState
    >
    <UiPagination
      :page="page"
      :has-more="store.page?.has_more || false"
      :disabled="store.loading"
      @change="page = $event"
    />
  </div>
</template>
