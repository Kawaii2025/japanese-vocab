<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-6 sm:pb-6">
    <div class="pointer-events-auto w-full max-w-6xl">
      <transition name="keyboard-slide">
        <section
          v-if="isVisible"
          class="mb-3 overflow-hidden rounded-[28px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(16,18,28,0.97),rgba(10,12,20,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur"
        >
          <div class="jis-grid-overlay px-4 py-4 sm:px-6 sm:py-5">
            <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/70">macOS JIS Reference</p>
                <h2 class="text-lg font-semibold text-slate-100 sm:text-xl">JIS Kana Keyboard</h2>
                <p class="text-sm text-slate-400">输入单词时可对照假名位置，不影响页面跳转。</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
                @click="$emit('toggle')"
              >
                隐藏键盘
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(row, rowIndex) in rows"
                :key="rowIndex"
                class="grid gap-2"
                :style="{ gridTemplateColumns: row.columns }"
              >
                <div
                  v-for="(keyItem, keyIndex) in row.keys"
                  :key="`${rowIndex}-${keyIndex}-${keyItem.label}`"
                  class="flex min-h-[3.75rem] flex-col justify-center rounded-2xl border px-2 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:min-h-[4.5rem]"
                  :class="keyItem.kind === 'modifier' ? 'border-slate-500 bg-slate-200 text-slate-700' : `${fingerClasses[keyItem.finger]} border-white/20 ${keyItem.muted ? 'opacity-70' : ''}`"
                >
                  <span class="text-base font-semibold sm:text-xl">{{ keyItem.label }}</span>
                  <span v-if="keyItem.subLabel" class="mt-1 text-xs font-medium text-slate-700/80 sm:text-sm" :class="keyItem.kind === 'modifier' ? 'text-slate-600' : 'text-slate-800/80'">
                    {{ keyItem.subLabel }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <p>彩色分区对应手指区域，布局参考 macOS JIS 键盘。</p>
              <p class="sm:text-right">建议继续使用系统日语输入法，这个面板只做位置参考。</p>
            </div>
          </div>
        </section>
      </transition>

      <div class="flex justify-end">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition hover:border-sky-400/70 hover:bg-slate-900"
          @click="$emit('toggle')"
        >
          <span class="inline-flex h-2.5 w-2.5 rounded-full bg-sky-400"></span>
          {{ isVisible ? '隐藏 JIS 键盘' : '显示 JIS 键盘' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
});

defineEmits(['toggle']);

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
</script>