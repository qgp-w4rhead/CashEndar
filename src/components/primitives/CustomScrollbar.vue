<template>
  <div
    ref="wrapperRef"
    :class="['custom-scrollbar', `variant-${variant}`, directionClass]"
    :style="containerStyle"
  >
    <!-- scrollRef is the actual scrollable element exposed to parents -->
    <div
      ref="scrollRef"
      class="scroll-content"
      @scroll="onContentScroll"
    >
      <slot />
    </div>

    <!-- Custom vertical track + thumb -->
    <div
      v-if="showY"
      ref="trackYRef"
      class="scrollbar-track track-y"
      :class="{ 'track-thin': variant === 'thin' }"
      @mousedown.self="onTrackYClick"
    >
      <div
        class="scrollbar-thumb"
        :style="thumbYStyle"
        @mousedown="onThumbYMouseDown"
      ></div>
    </div>

    <!-- Custom horizontal track + thumb -->
    <div
      v-if="showX"
      ref="trackXRef"
      class="scrollbar-track track-x"
      :class="{ 'track-thin': variant === 'thin' }"
      @mousedown.self="onTrackXClick"
    >
      <div
        class="scrollbar-thumb"
        :style="thumbXStyle"
        @mousedown="onThumbXMouseDown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  maxHeight?: string
  height?: string
  variant?: 'default' | 'thin'
  direction?: 'y' | 'x' | 'both'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  direction: 'y',
})

const wrapperRef = ref<HTMLElement>()
const scrollRef  = ref<HTMLElement>()
const trackYRef  = ref<HTMLElement>()
const trackXRef  = ref<HTMLElement>()

const scrollTop  = ref(0)
const scrollLeft = ref(0)
const showY      = ref(false)
const showX      = ref(false)

const isVertical   = computed(() => props.direction === 'y' || props.direction === 'both')
const isHorizontal = computed(() => props.direction === 'x' || props.direction === 'both')

const directionClass = computed(() => {
  switch (props.direction) {
    case 'x':    return 'scroll-x'
    case 'both': return 'scroll-both'
    default:     return 'scroll-y'
  }
})

const containerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (props.maxHeight) style.maxHeight = props.maxHeight
  if (props.height)    style.height    = props.height
  return style
})

// ── Thumb geometry helpers ──────────────────────────────────────────────────

const thumbYStyle = computed(() => {
  const el = scrollRef.value
  if (!el) return {}
  const trackH   = el.clientHeight
  const contentH = el.scrollHeight
  const ratio     = Math.min(1, trackH / contentH)
  const size      = Math.max(24, trackH * ratio)
  const maxTop    = trackH - size
  const top       = contentH > trackH
    ? (scrollTop.value / (contentH - trackH)) * maxTop
    : 0
  return { height: `${size}px`, top: `${top}px` }
})

const thumbXStyle = computed(() => {
  const el = scrollRef.value
  if (!el) return {}
  const trackW   = el.clientWidth
  const contentW = el.scrollWidth
  const ratio     = Math.min(1, trackW / contentW)
  const size      = Math.max(24, trackW * ratio)
  const maxLeft   = trackW - size
  const left      = contentW > trackW
    ? (scrollLeft.value / (contentW - trackW)) * maxLeft
    : 0
  return { width: `${size}px`, left: `${left}px` }
})

// ── Scroll sync ─────────────────────────────────────────────────────────────

const onContentScroll = () => {
  const el = scrollRef.value
  if (!el) return
  scrollTop.value  = el.scrollTop
  scrollLeft.value = el.scrollLeft
}

// ── Visibility ──────────────────────────────────────────────────────────────

const updateVisibility = () => {
  const el = scrollRef.value
  if (!el) return
  if (isVertical.value)   showY.value = el.scrollHeight > el.clientHeight
  if (isHorizontal.value) showX.value = el.scrollWidth  > el.clientWidth
}

// ── Thumb drag – Y ──────────────────────────────────────────────────────────

let dragStartClientY   = 0
let dragStartScrollTop = 0

const onThumbYMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  dragStartClientY   = e.clientY
  dragStartScrollTop = scrollRef.value!.scrollTop
  document.body.style.cursor     = 'grabbing'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onThumbYMouseMove)
  document.addEventListener('mouseup',   onThumbYMouseUp)
}

const onThumbYMouseMove = (e: MouseEvent) => {
  const el = scrollRef.value
  if (!el) return
  const trackH  = el.clientHeight
  const thumbH  = parseFloat(thumbYStyle.value.height ?? '0')
  const ratio   = (e.clientY - dragStartClientY) / (trackH - thumbH)
  el.scrollTop  = dragStartScrollTop + ratio * (el.scrollHeight - trackH)
}

const onThumbYMouseUp = () => {
  document.body.style.cursor     = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onThumbYMouseMove)
  document.removeEventListener('mouseup',   onThumbYMouseUp)
}

// ── Track click – Y ─────────────────────────────────────────────────────────

const onTrackYClick = (e: MouseEvent) => {
  const el    = scrollRef.value
  const track = trackYRef.value
  if (!el || !track) return
  const rect   = track.getBoundingClientRect()
  const thumbH = parseFloat(thumbYStyle.value.height ?? '0')
  const ratio  = (e.clientY - rect.top - thumbH / 2) / (track.clientHeight - thumbH)
  el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
}

// ── Thumb drag – X ──────────────────────────────────────────────────────────

let dragStartClientX    = 0
let dragStartScrollLeft = 0

const onThumbXMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  dragStartClientX    = e.clientX
  dragStartScrollLeft = scrollRef.value!.scrollLeft
  document.body.style.cursor     = 'grabbing'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onThumbXMouseMove)
  document.addEventListener('mouseup',   onThumbXMouseUp)
}

const onThumbXMouseMove = (e: MouseEvent) => {
  const el = scrollRef.value
  if (!el) return
  const trackW  = el.clientWidth
  const thumbW  = parseFloat(thumbXStyle.value.width ?? '0')
  const ratio   = (e.clientX - dragStartClientX) / (trackW - thumbW)
  el.scrollLeft = dragStartScrollLeft + ratio * (el.scrollWidth - trackW)
}

const onThumbXMouseUp = () => {
  document.body.style.cursor     = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onThumbXMouseMove)
  document.removeEventListener('mouseup',   onThumbXMouseUp)
}

// ── Track click – X ─────────────────────────────────────────────────────────

const onTrackXClick = (e: MouseEvent) => {
  const el    = scrollRef.value
  const track = trackXRef.value
  if (!el || !track) return
  const rect    = track.getBoundingClientRect()
  const thumbW  = parseFloat(thumbXStyle.value.width ?? '0')
  const ratio   = (e.clientX - rect.left - thumbW / 2) / (track.clientWidth - thumbW)
  el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth)
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

let resizeObserver: ResizeObserver

onMounted(() => {
  nextTick(() => {
    updateVisibility()
    resizeObserver = new ResizeObserver(updateVisibility)
    if (scrollRef.value) resizeObserver.observe(scrollRef.value)
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('mousemove', onThumbYMouseMove)
  document.removeEventListener('mouseup',   onThumbYMouseUp)
  document.removeEventListener('mousemove', onThumbXMouseMove)
  document.removeEventListener('mouseup',   onThumbXMouseUp)
})

defineExpose({ scrollRef })
</script>

<style scoped>
.custom-scrollbar {
  position: relative;
  height: 100%;
}

.scroll-content {
  width: 100%;
  height: 100%;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-content::-webkit-scrollbar {
  display: none;
}

.scroll-y .scroll-content {
  overflow-y: auto;
  overflow-x: hidden;
}

.scroll-x .scroll-content {
  overflow-x: auto;
  overflow-y: hidden;
}

.scroll-both .scroll-content {
  overflow: auto;
}

/* Track */
.scrollbar-track {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4vw;
  z-index: 10;
}

.track-y {
  right: 0;
  top: 0;
  width: 8px;
  height: 100%;
}

.track-x {
  bottom: 0;
  left: 0;
  height: 8px;
  width: 100%;
}

.track-thin.track-y { width: 4px; }
.track-thin.track-x { height: 4px; }

/* Thumb */
.scrollbar-thumb {
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4vw;
  cursor: grab;
  transition: background 0.15s ease;
}

.track-thin .scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2vw;
}

.scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.45);
}

.scrollbar-thumb:active {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.55);
}

/* Vertical thumb fills track width */
.track-y .scrollbar-thumb {
  left: 0;
  right: 0;
  width: 100%;
}

/* Horizontal thumb fills track height */
.track-x .scrollbar-thumb {
  top: 0;
  bottom: 0;
  height: 100%;
}
</style>
