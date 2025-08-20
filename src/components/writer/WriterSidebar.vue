<template>
  <div class="left-panel">
    <!-- 章节列表面板 -->
    <WriterChapterPanel
      v-show="activeTab === 'editor'"
      :chapters="chapters"
      :current-chapter="currentChapter"
      @select-chapter="$emit('select-chapter', $event)"
      @chapter-action="$emit('chapter-action', $event)"
      @add-chapter="$emit('add-chapter')"
      @chapter-command="$emit('chapter-command', $event)"
    />

    <!-- 人物管理面板 -->
    <WriterCharacterPanel
      v-show="activeTab === 'characters'"
      :characters="characters"
      @add-character="$emit('add-character')"
      @batch-generate="$emit('batch-generate')"
      @edit-character="$emit('edit-character', $event)"
      @character-action="$emit('character-action', $event)"
    />

    <!-- 世界观管理面板 -->
    <WriterWorldviewPanel
      v-show="activeTab === 'worldview'"
      :world-settings="worldSettings"
      @add-worldview="$emit('add-worldview')"
      @generate-worldview="$emit('generate-worldview')"
      @edit-worldview="$emit('edit-worldview', $event)"
      @worldview-action="$emit('worldview-action', $event)"
    />

    <!-- 语料库面板 -->
    <WriterCorpusPanel
      v-show="activeTab === 'corpus'"
      :corpus-data="corpusData"
      @add-corpus="$emit('add-corpus')"
      @edit-corpus="$emit('edit-corpus', $event)"
      @delete-corpus="$emit('delete-corpus', $event)"
    />

    <!-- 事件线面板 -->
    <WriterEventPanel
      v-show="activeTab === 'events'"
      :events="events"
      @add-event="$emit('add-event')"
      @event-action="$emit('event-action', $event)"
    />
  </div>
</template>

<script setup>
import WriterChapterPanel from './WriterChapterPanel.vue'
import WriterCharacterPanel from './WriterCharacterPanel.vue'
import WriterWorldviewPanel from './WriterWorldviewPanel.vue'
import WriterCorpusPanel from './WriterCorpusPanel.vue'
import WriterEventPanel from './WriterEventPanel.vue'

defineProps({
  activeTab: String,
  chapters: Array,
  currentChapter: Object,
  characters: Array,
  worldSettings: Array,
  corpusData: Array,
  events: Array
})

defineEmits([
  'select-chapter',
  'chapter-action',
  'add-chapter',
  'chapter-command',
  'add-character',
  'batch-generate',
  'edit-character',
  'character-action',
  'add-worldview',
  'generate-worldview',
  'edit-worldview',
  'worldview-action',
  'add-corpus',
  'edit-corpus',
  'delete-corpus',
  'add-event',
  'event-action'
])
</script>

<style scoped>
.left-panel {
  width: 350px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}
</style>