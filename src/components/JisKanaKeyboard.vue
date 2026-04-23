<template>
  <div class="pointer-events-none fixed right-3 top-3 z-40 sm:right-6 sm:top-5">
    <div class="pointer-events-auto flex flex-col items-end gap-2">
      <div class="flex flex-wrap justify-end gap-2">
        <label class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/92 px-3 py-2 text-xs font-medium text-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur">
          <input
            v-model="isLarge"
            type="checkbox"
            class="h-4 w-4 rounded border-slate-500 bg-slate-950 text-sky-400 focus:ring-sky-400"
          />
          大尺寸
        </label>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/92 px-4 py-2 text-xs font-semibold text-slate-100 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur transition hover:border-sky-400/70 hover:bg-slate-900 sm:text-sm"
          @click="$emit('toggle')"
        >
          <span class="inline-flex h-2.5 w-2.5 rounded-full bg-sky-400"></span>
          {{ isVisible ? '隐藏键盘' : '显示键盘' }}
        </button>
      </div>

      <transition name="keyboard-slide">
        <section
          v-if="isVisible"
          class="jis-grid-overlay overflow-hidden rounded-[24px] border border-slate-700/60 bg-[linear-gradient(180deg,rgba(14,17,26,0.94),rgba(10,12,20,0.96))] shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur"
          :class="panelClass"
        >
          <div class="px-3 py-3 sm:px-4 sm:py-4">
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-300/70">macOS JIS</p>
                <p class="mt-0.5 text-xs text-slate-400">Kana reference</p>
              </div>
              <span class="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                {{ isLarge ? 'Full' : 'Mini' }}
              </span>
            </div>

            <div v-if="!isLarge" class="grid gap-1.5">
              <div
                v-for="group in compactGroups"
                :key="group.label"
                class="flex flex-wrap items-center gap-1.5"
              >
                <span class="min-w-12 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{{ group.label }}</span>
                <span
                  v-for="keyItem in group.keys"
                  :key="`${group.label}-${keyItem.label}`"
                  class="inline-flex min-w-[1.8rem] items-center justify-center rounded-xl border px-1.5 py-1 text-xs font-semibold"
                  :class="`${fingerClasses[keyItem.finger]} border-white/15`"
                >
                  {{ keyItem.label }}
                </span>
              </div>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="(row, rowIndex) in rows"
                :key="rowIndex"
                class="grid gap-1.5"
                :style="{ gridTemplateColumns: row.columns }"
              >
                <div
                  v-for="(keyItem, keyIndex) in row.keys"
                  :key="`${rowIndex}-${keyIndex}-${keyItem.label}`"
                  class="flex min-h-[2.6rem] flex-col justify-center rounded-2xl border px-1.5 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:min-h-[3.25rem]"
                  :class="keyItem.kind === 'modifier' ? 'border-slate-500 bg-slate-200 text-slate-700' : `${fingerClasses[keyItem.finger]} border-white/20 ${keyItem.muted ? 'opacity-70' : ''}`"
                >
                  <span class="text-xs font-semibold sm:text-base">{{ keyItem.label }}</span>
                  <span v-if="keyItem.subLabel" class="mt-0.5 text-[9px] font-medium sm:text-[10px]" :class="keyItem.kind === 'modifier' ? 'text-slate-600' : 'text-slate-800/80'">
                    {{ keyItem.subLabel }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const LARGE_STORAGE_KEY = 'global-jis-keyboard-large';

defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle']);

const isLarge = ref(false);

if (typeof window !== 'undefined') {
  isLarge.value = window.localStorage.getItem(LARGE_STORAGE_KEY) === 'true';

  watch(
    isLarge,
    (value) => {
      window.localStorage.setItem(LARGE_STORAGE_KEY, value ? 'true' : 'false');
    },
    { flush: 'post' }
  );
}

const fingerClasses = {
  pinky: 'bg-rose-200 text-slate-900',
  ring: 'bg-orange-200 text-slate-900',
  middle: 'bg-yellow-200 text-slate-900',
  index: 'bg-lime-200 text-slate-900',
  indexRight: 'bg-sky-200 text-slate-900',
  middleRight: 'bg-violet-200 text-slate-900',
  ringRight: 'bg-fuchsia-200 text-slate-900',
  pinkyRight: 'bg-slate-100 text-slate-900',
  thumb: 'bg-slate-300 text-slate-900'
};

const rows = [
  {
    columns: '0.9fr repeat(11, minmax(0, 1fr)) 1.6fr',
    keys: [
      { label: 'ぬ', subLabel: '1', finger: 'pinky' },
      { label: 'ふ', subLabel: '2', finger: 'ring' },
      { label: 'あ', subLabel: '3', finger: 'middle' },
      { label: 'う', subLabel: '4', finger: 'index' },
      { label: 'え', subLabel: '5', finger: 'index' },
      { label: 'お', subLabel: '6', finger: 'indexRight' },
      { label: 'や', subLabel: '7', finger: 'indexRight' },
      { label: 'ゆ', subLabel: '8', finger: 'middleRight' },
      { label: 'よ', subLabel: '9', finger: 'ringRight' },
      { label: 'わ', subLabel: '0', finger: 'pinkyRight' },
      { label: 'ほ', subLabel: '-', finger: 'pinkyRight' },
      { label: 'へ', subLabel: '^', finger: 'pinkyRight' },
      { label: '後退', kind: 'modifier' }
    ]
  },
  {
    columns: '1.4fr repeat(11, minmax(0, 1fr)) 1.4fr',
    keys: [
      { label: 'Tab', kind: 'modifier' },
      { label: 'た', subLabel: 'Q', finger: 'pinky' },
      { label: 'て', subLabel: 'W', finger: 'ring' },
      { label: 'い', subLabel: 'E', finger: 'middle' },
      { label: 'す', subLabel: 'R', finger: 'index' },
      { label: 'か', subLabel: 'T', finger: 'index' },
      { label: 'ん', subLabel: 'Y', finger: 'indexRight' },
      { label: 'な', subLabel: 'U', finger: 'indexRight' },
      { label: 'に', subLabel: 'I', finger: 'middleRight' },
      { label: 'ら', subLabel: 'O', finger: 'ringRight' },
      { label: 'せ', subLabel: 'P', finger: 'pinkyRight' },
      { label: '゛', subLabel: '@', finger: 'pinkyRight' },
      { label: '改行', kind: 'modifier' }
    ]
  },
  {
    columns: '1.7fr repeat(11, minmax(0, 1fr))',
    keys: [
      { label: '英数', kind: 'modifier' },
      { label: 'ち', subLabel: 'A', finger: 'pinky' },
      { label: 'と', subLabel: 'S', finger: 'ring' },
      { label: 'し', subLabel: 'D', finger: 'middle' },
      { label: 'は', subLabel: 'F', finger: 'index' },
      { label: 'き', subLabel: 'G', finger: 'index' },
      { label: 'く', subLabel: 'H', finger: 'indexRight' },
      { label: 'ま', subLabel: 'J', finger: 'indexRight' },
      { label: 'の', subLabel: 'K', finger: 'middleRight' },
      { label: 'り', subLabel: 'L', finger: 'ringRight' },
      { label: 'れ', subLabel: ';', finger: 'pinkyRight' },
      { label: 'け', subLabel: ':', finger: 'pinkyRight' }
    ]
  },
  {
    columns: '1.9fr repeat(10, minmax(0, 1fr)) 1.9fr',
    keys: [
      { label: 'Shift', kind: 'modifier' },
      { label: 'つ', subLabel: 'Z', finger: 'pinky' },
      { label: 'さ', subLabel: 'X', finger: 'ring' },
      { label: 'そ', subLabel: 'C', finger: 'middle' },
      { label: 'ひ', subLabel: 'V', finger: 'index' },
      { label: 'こ', subLabel: 'B', finger: 'index' },
      { label: 'み', subLabel: 'N', finger: 'indexRight' },
      { label: 'も', subLabel: 'M', finger: 'indexRight' },
      { label: 'ね', subLabel: ',', finger: 'middleRight' },
      { label: 'る', subLabel: '.', finger: 'ringRight' },
      { label: 'め', subLabel: '/', finger: 'pinkyRight' },
      { label: 'Shift', kind: 'modifier' }
    ]
  },
  {
    columns: '1.15fr 1.15fr 5fr 1.15fr 1.15fr',
    keys: [
      { label: 'かな', kind: 'modifier' },
      { label: 'control', kind: 'modifier', muted: true },
      { label: 'space', kind: 'modifier' },
      { label: 'command', kind: 'modifier', muted: true },
      { label: 'return', kind: 'modifier', muted: true }
    ]
  }
];

const compactGroups = computed(() => ([
  { label: 'QWERTY', keys: rows[1].keys.slice(1, 11) },
  { label: 'ASDF', keys: rows[2].keys.slice(1, 10) },
  { label: 'ZXCV', keys: rows[3].keys.slice(1, 11) }
]));

const panelClass = computed(() => (
  isLarge.value
    ? 'w-[min(92vw,54rem)]'
    : 'w-[min(92vw,28rem)]'
));
</script>