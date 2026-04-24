<template>
  <div class="pointer-events-none fixed right-3 top-3 z-40 sm:right-6 sm:top-5">
    <div class="pointer-events-auto flex flex-col items-end gap-2">
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
              <div class="flex flex-wrap justify-end gap-1.5">
                <label class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-slate-50">
                  <input
                    v-model="isLarge"
                    type="checkbox"
                    class="h-3.5 w-3.5 rounded border-slate-400 bg-white text-sky-500 focus:ring-sky-400"
                  />
                  大尺寸
                </label>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-slate-50 sm:text-xs"
                  @click="$emit('toggle')"
                >
                  <span class="inline-flex h-2 w-2 rounded-full bg-sky-400"></span>
                  隐藏键盘
                </button>
              </div>
            </div>

            <div v-if="!isLarge" class="space-y-1.5">
              <div
                v-for="(group, groupIndex) in compactRows"
                :key="groupIndex"
                class="grid gap-1.5"
                :style="{ gridTemplateColumns: `repeat(${group.keys.length}, minmax(0, 1fr))`, paddingLeft: group.indent, paddingRight: group.indentRight }"
              >
                <span
                  v-for="keyItem in group.keys"
                  :key="`${groupIndex}-${keyItem.label}`"
                  class="relative inline-flex w-full items-center justify-center rounded-2xl border px-1.5 font-semibold"
                  :class="[
                    getGojuonClass(keyItem.label),
                    'border-white/15',
                    groupIndex === 0 ? 'min-h-[2rem] py-1 sm:min-h-[2.3rem]' : 'min-h-[2.6rem] py-1.5 sm:min-h-[3rem]'
                  ]"
                >
                  <span :class="groupIndex === 0 ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'">{{ keyItem.label }}</span>
                  <span v-if="groupIndex === 0 && keyItem.subLabel" class="absolute bottom-1 right-1.5 text-[8px] font-medium leading-none text-slate-700/60">{{ keyItem.subLabel }}</span>
                  <span v-if="keyItem.home" class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <span class="inline-block h-1 w-1 rounded-full bg-slate-700/60"></span>
                    <span class="inline-block h-1 w-1 rounded-full bg-slate-700/60"></span>
                  </span>
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
                  :class="keyItem.kind === 'modifier' ? 'border-slate-500 bg-slate-200 text-slate-700' : `${getGojuonClass(keyItem.label)} border-white/20 ${keyItem.muted ? 'opacity-70' : ''}`"
                >
                  <span class="text-xs font-semibold sm:text-base">{{ keyItem.label }}</span>
                  <span v-if="keyItem.home" class="mt-0.5 flex justify-center gap-0.5">
                    <span class="inline-block h-1 w-1 rounded-full bg-slate-700/60"></span>
                    <span class="inline-block h-1 w-1 rounded-full bg-slate-700/60"></span>
                  </span>
                  <span v-if="keyItem.subLabel" class="mt-0.5 text-[9px] font-medium sm:text-[10px]" :class="keyItem.kind === 'modifier' ? 'text-slate-600' : 'text-slate-800/80'">
                    {{ keyItem.subLabel }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </transition>

      <button
        v-if="!isVisible"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:bg-slate-50 sm:text-xs"
        @click="$emit('toggle')"
      >
        <span class="inline-flex h-2 w-2 rounded-full bg-sky-400"></span>
        显示键盘
      </button>
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

const GOJUON_BLOCK_CLASSES = [
  'bg-red-300 text-slate-900',
  'bg-orange-200 text-slate-900',
  'bg-yellow-200 text-slate-900',
  'bg-lime-200 text-slate-900',
  'bg-emerald-200 text-slate-900',
  'bg-sky-200 text-slate-900',
  'bg-indigo-200 text-slate-900',
  'bg-rose-200 text-slate-900',
  'bg-fuchsia-200 text-slate-900',
  'bg-white/95 text-slate-900',
  'bg-white/95 text-slate-900'
];

// Standard gojuon blocks, 5 kana per main block.
const GOJUON_BLOCKS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', 'ゆ', 'よ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を'],
  ['ん']
];

function getGojuonClass(label) {
  const key = String(label || '').trim();
  for (let i = 0; i < GOJUON_BLOCKS.length; i++) {
    if (GOJUON_BLOCKS[i].includes(key)) {
      return GOJUON_BLOCK_CLASSES[i];
    }
  }

  return 'bg-slate-100 text-slate-900';
}

const rows = [
  {
    indent: '0%',
    indentRight: '10.5%',
    columns: '0.9fr repeat(12, minmax(0, 1fr)) 1.6fr',
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
      { label: 'ー', subLabel: '¥', finger: 'pinkyRight' },
      { label: '後退', kind: 'modifier' }
    ]
  },
  {
    indent: '4%',
    indentRight: '6.5%',
    columns: '1.4fr repeat(12, minmax(0, 1fr)) 1.4fr',
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
      { label: '゜', subLabel: '[', finger: 'pinkyRight' },
      { label: '改行', kind: 'modifier' }
    ]
  },
  {
    indent: '6.5%',
    indentRight: '4%',
    columns: '1.7fr repeat(12, minmax(0, 1fr))',
    keys: [
      { label: '英数', kind: 'modifier' },
      { label: 'ち', subLabel: 'A', finger: 'pinky' },
      { label: 'と', subLabel: 'S', finger: 'ring' },
      { label: 'し', subLabel: 'D', finger: 'middle' },
      { label: 'は', subLabel: 'F', finger: 'index', home: true },
      { label: 'き', subLabel: 'G', finger: 'index' },
      { label: 'く', subLabel: 'H', finger: 'indexRight' },
      { label: 'ま', subLabel: 'J', finger: 'indexRight', home: true },
      { label: 'の', subLabel: 'K', finger: 'middleRight' },
      { label: 'り', subLabel: 'L', finger: 'ringRight' },
      { label: 'れ', subLabel: ';', finger: 'pinkyRight' },
      { label: 'け', subLabel: ':', finger: 'pinkyRight' },
      { label: 'む', subLabel: ']', finger: 'pinkyRight' }
    ]
  },
  {
    indent: '10.5%',
    indentRight: '0%',
    columns: '1.9fr repeat(11, minmax(0, 1fr)) 1.9fr',
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
      { label: 'ろ', subLabel: '_', finger: 'pinkyRight' },
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

const compactRows = computed(() => (
  rows
    .slice(0, 4)
    .map((row) => ({
      indent: row.indent,
      indentRight: row.indentRight,
      keys: row.keys.filter((keyItem) => keyItem.kind !== 'modifier')
    }))
));

const panelClass = computed(() => (
  isLarge.value
    ? 'w-[min(92vw,54rem)]'
    : 'w-[min(94vw,36rem)]'
));
</script>