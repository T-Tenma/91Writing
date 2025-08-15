<template>
  <div class="writer-container">
    <!-- 顶部标题栏 -->
    <WriterTitleBar 
      :novel-title="currentNovel?.title"
      @go-back="goBack"
    />

    <!-- 标签栏 -->
    <WriterTabsBar 
      v-model:active-tab="activeTab"
      @tab-change="onTabChange"
    />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧边栏 -->
      <WriterSidebar
        :active-tab="activeTab"
        :chapters="chapters"
        :current-chapter="currentChapter"
        :characters="characters"
        :world-settings="worldSettings"
        :corpus-data="corpusData"
        :events="events"
        @select-chapter="selectChapter"
        @chapter-action="handleChapterAction"
        @add-chapter="addNewChapter"
        @chapter-command="handleChapterCommand"
        @add-character="addCharacter"
        @batch-generate="showBatchGenerateDialog"
        @edit-character="editCharacter"
        @character-action="handleCharacterAction"
        @add-worldview="addWorldSetting"
        @generate-worldview="openWorldGenerateDialog"
        @edit-worldview="editWorldSetting"
        @worldview-action="handleWorldSettingAction"
        @add-corpus="addCorpus"
        @edit-corpus="editCorpus"
        @delete-corpus="deleteCorpus"
        @add-event="addEvent"
        @event-action="handleEventAction"
      />

      <!-- 右侧主内容区域 -->
      <WriterMainContent
        :active-tab="activeTab"
        :current-chapter="currentChapter"
        v-model:content="content"
        :is-saving="isSaving"
        :toolbar-config="toolbarConfig"
        :editor-config="editorConfig"
        @update-status="updateChapterStatus"
        @generate-from-outline="generateFromOutline"
        @open-continue-dialog="openContinueDialog"
        @enhance-content="enhanceContent"
        @add-new-chapter="addNewChapter"
        @editor-created="handleCreated"
        @content-change="onContentChange"
      />
    </div>

    <!-- 对话框组件 -->
    <WriterDialogs
      v-model:show-batch-generate="showBatchGenerateDialog"
      v-model:show-continue-dialog="showContinueDialog"
      v-model:show-world-generate="showWorldGenerateDialog"
      :current-chapter="currentChapter"
      :current-novel="currentNovel"
      @batch-generate-confirm="$emit('batch-generate-confirm', $event)"
      @continue-writing="$emit('continue-writing', $event)"
      @world-generate-confirm="$emit('world-generate-confirm', $event)"
    />
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import WriterTitleBar from './WriterTitleBar.vue'
import WriterTabsBar from './WriterTabsBar.vue'
import WriterSidebar from './WriterSidebar.vue'
import WriterMainContent from './WriterMainContent.vue'
import WriterDialogs from './WriterDialogs.vue'

defineProps({
  activeTab: String,
  currentNovel: Object,
  currentChapter: Object,
  chapters: Array,
  characters: Array,
  worldSettings: Array,
  corpusData: Array,
  events: Array,
  content: String,
  isSaving: Boolean,
  toolbarConfig: Object,
  editorConfig: Object,
  showBatchGenerateDialog: Boolean,
  showContinueDialog: Boolean,
  showWorldGenerateDialog: Boolean
})

defineEmits([
  'go-back',
  'tab-change',
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
  'event-action',
  'update-status',
  'generate-from-outline',
  'open-continue-dialog',
  'enhance-content',
  'add-new-chapter',
  'editor-created',
  'content-change',
  'batch-generate-confirm',
  'continue-writing',
  'world-generate-confirm'
])
</script>

<style scoped>
.writer-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>