<template>
  <div class="main-content-area">
    <!-- 编辑器区域 -->
    <WriterEditor
      v-show="activeTab === 'editor'"
      :current-chapter="currentChapter"
      v-model:content="content"
      :is-saving="isSaving"
      :toolbar-config="toolbarConfig"
      :editor-config="editorConfig"
      @update-status="$emit('update-status', $event)"
      @generate-from-outline="$emit('generate-from-outline')"
      @open-continue-dialog="$emit('open-continue-dialog')"
      @enhance-content="$emit('enhance-content')"
      @add-new-chapter="$emit('add-new-chapter')"
      @editor-created="$emit('editor-created', $event)"
      @content-change="$emit('content-change', $event)"
    />

    <!-- 其他标签页的内容区域 -->
    <div v-show="activeTab !== 'editor'" class="tab-content">
      <div v-if="activeTab === 'characters'" class="characters-content">
        <!-- 角色管理的主要内容区域 -->
        <div class="empty-state">
          <p>选择左侧角色进行编辑</p>
        </div>
      </div>
      
      <div v-if="activeTab === 'worldview'" class="worldview-content">
        <!-- 世界观管理的主要内容区域 -->
        <div class="empty-state">
          <p>选择左侧世界观设定进行编辑</p>
        </div>
      </div>
      
      <div v-if="activeTab === 'corpus'" class="corpus-content">
        <!-- 语料库的主要内容区域 -->
        <div class="empty-state">
          <p>选择左侧语料进行查看</p>
        </div>
      </div>
      
      <div v-if="activeTab === 'events'" class="events-content">
        <!-- 事件线的主要内容区域 -->
        <div class="empty-state">
          <p>选择左侧事件进行编辑</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import WriterEditor from './WriterEditor.vue'

defineProps({
  activeTab: String,
  currentChapter: Object,
  content: String,
  isSaving: Boolean,
  toolbarConfig: Object,
  editorConfig: Object
})

defineEmits([
  'update:content',
  'update-status',
  'generate-from-outline',
  'open-continue-dialog',
  'enhance-content',
  'add-new-chapter',
  'editor-created',
  'content-change'
])
</script>

<style scoped>
.main-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  padding: 20px;
  background: white;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
}

.characters-content,
.worldview-content,
.corpus-content,
.events-content {
  height: 100%;
}
</style>