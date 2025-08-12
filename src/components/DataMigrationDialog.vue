<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="数据迁移"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    center
  >
    <div class="migration-content">
      <div class="migration-icon">
        <el-icon size="48" color="#409EFF">
          <Loading v-if="migrating" />
          <Check v-else-if="completed" color="#67C23A" />
          <DataAnalysis v-else />
        </el-icon>
      </div>
      
      <div class="migration-info">
        <h3>{{ statusText }}</h3>
        <p class="migration-desc">{{ descriptionText }}</p>
        
        <div class="progress-section" v-if="migrating || completed">
          <el-progress 
            :percentage="progressPercentage" 
            :status="completed ? 'success' : undefined"
            :stroke-width="8"
          />
          <div class="progress-details">
            <span>已迁移: {{ migratedCount }} / {{ totalCount }} 项</span>
            <span v-if="currentItem">正在处理: {{ currentItem }}</span>
          </div>
        </div>
        
        <div class="migration-details" v-if="migrationDetails.length > 0">
          <el-collapse v-model="activeCollapse">
            <el-collapse-item title="查看详细信息" name="details">
              <div class="detail-list">
                <div 
                  v-for="detail in migrationDetails" 
                  :key="detail.key"
                  class="detail-item"
                  :class="{ 'success': detail.success, 'error': !detail.success }"
                >
                  <el-icon>
                    <Check v-if="detail.success" />
                    <Close v-else />
                  </el-icon>
                  <span>{{ detail.key }}</span>
                  <span class="detail-size" v-if="detail.size">{{ detail.size }}</span>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button 
          v-if="completed" 
          type="primary" 
          @click="handleClose"
        >
          完成
        </el-button>
        <el-button 
          v-else-if="!migrating" 
          type="primary" 
          @click="startMigration"
        >
          开始迁移
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Check, DataAnalysis, Close } from '@element-plus/icons-vue'
import { storageService } from '@/services/storageService'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'completed'])

// 响应式数据
const migrating = ref(false)
const completed = ref(false)
const migratedCount = ref(0)
const totalCount = ref(0)
const currentItem = ref('')
const migrationDetails = ref([])
const activeCollapse = ref([])

// 计算属性
const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((migratedCount.value / totalCount.value) * 100)
})

const statusText = computed(() => {
  if (completed.value) return '迁移完成'
  if (migrating.value) return '正在迁移数据...'
  return '准备迁移数据'
})

const descriptionText = computed(() => {
  if (completed.value) return `成功迁移了 ${migratedCount.value} 项数据到 IndexedDB`
  if (migrating.value) return '正在将您的数据从 localStorage 迁移到 IndexedDB，请稍候...'
  return '检测到需要迁移的数据，将从 localStorage 迁移到 IndexedDB 以获得更好的性能'
})

// 格式化文件大小
const formatSize = (str) => {
  if (!str) return ''
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

// 开始迁移
const startMigration = async () => {
  migrating.value = true
  migratedCount.value = 0
  migrationDetails.value = []
  
  const MIGRATION_KEY = 'migration_v1_dexie_completed'
  
  // 检查是否已经迁移过
  const migrationCompleted = await storageService.getItem(MIGRATION_KEY)
  if (migrationCompleted) {
    completed.value = true
    migrating.value = false
    ElMessage.success('数据已经迁移过了')
    return
  }

  // 需要迁移的键列表
  const keysToMigrate = [
    'officialApiConfig', 'customModels', 'customApiConfig', 'apiConfigType',
    'novel_chapters', 'writingGoals', 'auto_backup_settings', 'backup_list',
    'customTemplates', 'lastReadAnnouncementVersion', 'lastReadAnnouncementDate',
    'apiConfig', 'account_balance', 'billing_records', 'token_usage_stats',
    'aiApiConfigs', 'prompts', 'chapterSummaryPromptTemplate', 'novels',
    'novelGenres', 'shortStoryConfig', 'token-usage'
  ]

  // 先统计需要迁移的项目数量
  const itemsToMigrate = []
  for (const key of keysToMigrate) {
    const value = localStorage.getItem(key)
    if (value !== null) {
      itemsToMigrate.push({ key, value })
    }
  }
  
  totalCount.value = itemsToMigrate.length
  
  if (totalCount.value === 0) {
    completed.value = true
    migrating.value = false
    await storageService.setItem(MIGRATION_KEY, true)
    ElMessage.info('没有需要迁移的数据')
    return
  }

  // 开始迁移
  let successCount = 0
  let failureCount = 0
  
  for (const { key, value } of itemsToMigrate) {
    currentItem.value = key
    
    try {
      // 数据验证和清理
      if (value === null || value === undefined) {
        console.warn(`跳过空值键: ${key}`)
        continue
      }
      
      // 尝试解析为JSON
      let parsedValue
      try {
        parsedValue = JSON.parse(value)
        
        // 验证解析后的数据
        if (parsedValue === null) {
          parsedValue = value // 如果解析结果为null，使用原始字符串
        }
      } catch (parseError) {
        // 如果不是JSON，直接存储字符串
        parsedValue = value
      }
      
      // 数据大小检查（限制单个项目最大5MB）
      const dataSize = new Blob([JSON.stringify(parsedValue)]).size
      if (dataSize > 5 * 1024 * 1024) {
        throw new Error(`数据过大 (${formatSize(JSON.stringify(parsedValue))})`)
      }
      
      await storageService.setItem(key, parsedValue)
      
      migrationDetails.value.push({
        key,
        success: true,
        size: formatSize(value)
      })
      
      successCount++
      migratedCount.value++
      
      // 添加小延迟以显示进度，但不要太长
      await new Promise(resolve => setTimeout(resolve, 50))
      
    } catch (error) {
      console.error(`迁移键 "${key}" 失败:`, error)
      failureCount++
      
      migrationDetails.value.push({
        key,
        success: false,
        error: error.message,
        size: formatSize(value)
      })
      
      // 继续迁移其他项目，不中断整个过程
    }
  }
  
  // 标记迁移完成
  await storageService.setItem(MIGRATION_KEY, true)
  
  currentItem.value = ''
  migrating.value = false
  completed.value = true
  
  // 显示迁移结果
  if (failureCount > 0) {
    ElMessage.warning(`数据迁移完成！成功 ${successCount} 项，失败 ${failureCount} 项`)
  } else {
    ElMessage.success(`数据迁移完成！成功迁移了 ${successCount} 项数据`)
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
  emit('completed')
}

// 监听visible变化，自动检查是否需要迁移
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    // 重置状态
    migrating.value = false
    completed.value = false
    migratedCount.value = 0
    totalCount.value = 0
    currentItem.value = ''
    migrationDetails.value = []
    
    // 检查是否已经迁移过
    const MIGRATION_KEY = 'migration_v1_dexie_completed'
    const migrationCompleted = await storageService.getItem(MIGRATION_KEY)
    
    if (migrationCompleted) {
      completed.value = true
      ElMessage.info('数据已经迁移完成')
    }
  }
})
</script>

<style scoped>
.migration-content {
  text-align: center;
  padding: 20px 0;
}

.migration-icon {
  margin-bottom: 20px;
}

.migration-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
}

.migration-desc {
  margin: 0 0 20px 0;
  color: #606266;
  line-height: 1.5;
}

.progress-section {
  margin: 20px 0;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.migration-details {
  margin-top: 20px;
  text-align: left;
}

.detail-list {
  max-height: 200px;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 12px;
}

.detail-item.success {
  color: #67C23A;
}

.detail-item.error {
  color: #F56C6C;
}

.detail-item .el-icon {
  margin-right: 8px;
  font-size: 14px;
}

.detail-size {
  margin-left: auto;
  color: #909399;
}

.dialog-footer {
  text-align: center;
}
</style>