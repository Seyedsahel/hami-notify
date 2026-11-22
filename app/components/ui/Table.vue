<script setup lang="ts" generic="T extends object">
defineProps<{
  rows: T[];
  columns: { key: string; label: string }[];
  rowKey: (row: T) => string;
  caption: string;
}>();
function cellValue(row: T, key: string) {
  return (row as Record<string, unknown>)[key] ?? "—";
}
</script>
<template>
  <div class="table-scroll" tabindex="0" :aria-label="caption">
    <table>
      <caption class="sr-only">
        {{
          caption
        }}
      </caption>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="rowKey(row)">
          <td v-for="column in columns" :key="column.key">
            <slot :name="column.key" :row="row">{{
              cellValue(row, column.key)
            }}</slot>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="empty-cell">موردی پیدا نشد.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
