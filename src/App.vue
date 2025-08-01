<template>
  <div id="app">
    <router-view />
    
    <!-- 数据迁移对话框 -->
    <DataMigrationDialog
      v-model:visible="showMigrationDialog"
      @completed="handleMigrationCompleted"
    />
    
    <!-- 公告对话框 -->
    <AnnouncementDialog
      v-model:visible="showAnnouncement"
      :announcement="currentAnnouncement"
      @close="handleAnnouncementClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AnnouncementDialog from './components/AnnouncementDialog.vue'
import DataMigrationDialog from './components/DataMigrationDialog.vue'
import { 
  hasNewAnnouncement, 
  getLatestAnnouncement, 
  markAnnouncementAsRead
} from './config/announcements.js'
import { storageService } from './services/storageService'

// --- Data Migration Logic ---
let migrationCheckInProgress = false

const checkDataMigration = async () => {
  // 防止并发检查
  if (migrationCheckInProgress) {
    console.log('数据迁移检查正在进行中，跳过重复检查')
    return false
  }
  
  migrationCheckInProgress = true
  
  try {
    const MIGRATION_KEY = 'migration_v1_dexie_completed'
    
    const migrationCompleted = await storageService.getItem(MIGRATION_KEY)
    if (migrationCompleted) {
      console.log('数据迁移已完成，跳过。')
      return false
    }

    // 检查是否有需要迁移的数据
    const keysToMigrate = [
      'officialApiConfig', 'customModels', 'customApiConfig', 'apiConfigType',
      'novel_chapters', 'writingGoals', 'auto_backup_settings', 'backup_list',
      'customTemplates', 'lastReadAnnouncementVersion', 'lastReadAnnouncementDate',
      'apiConfig', 'account_balance', 'billing_records', 'token_usage_stats',
      'aiApiConfigs', 'prompts', 'chapterSummaryPromptTemplate', 'novels',
      'novelGenres', 'shortStoryConfig', 'token-usage'
    ]

    let hasDataToMigrate = false
    for (const key of keysToMigrate) {
      try {
        if (localStorage.getItem(key) !== null) {
          hasDataToMigrate = true
          break
        }
      } catch (error) {
        console.warn(`检查迁移键 "${key}" 时出错:`, error)
        // 继续检查其他键
      }
    }

    return hasDataToMigrate
  } catch (error) {
    console.error('数据迁移检查失败:', error)
    return false
  } finally {
    migrationCheckInProgress = false
  }
}


// 迁移相关状态
const showMigrationDialog = ref(false)

// 公告相关状态
const showAnnouncement = ref(false)
const currentAnnouncement = ref({})

// 检查并显示公告
const checkAnnouncement = async () => {
  try {
    if (await hasNewAnnouncement()) {
      const latestAnnouncement = getLatestAnnouncement()
      currentAnnouncement.value = latestAnnouncement
      
      // 延迟显示，确保页面完全加载
      setTimeout(() => {
        showAnnouncement.value = true
      }, 1000)
    }
  } catch (error) {
    console.error('检查公告时出错:', error)
  }
}

// 处理迁移完成
const handleMigrationCompleted = async () => {
  showMigrationDialog.value = false
  
  // 迁移完成后检查公告
  await checkAnnouncement()
}

// 处理公告关闭
const handleAnnouncementClose = async () => {
  const version = currentAnnouncement.value.version
  
  // 标记为已读
  await markAnnouncementAsRead(version)
  
  showAnnouncement.value = false
}

onMounted(async () => {
  // 检查是否需要数据迁移
  const needsMigration = await checkDataMigration()
  
  if (needsMigration) {
    // 显示迁移对话框
    showMigrationDialog.value = true
  } else {
    // 如果不需要迁移，直接检查公告
    await checkAnnouncement()
  }
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}
</style>