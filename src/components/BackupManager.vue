<template>
  <div class="backup-manager">
    <div class="backup-header">
      <h3>💾 备份管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="createBackup">
          <el-icon><FolderAdd /></el-icon>
          创建备份
        </el-button>
        <el-button @click="importBackup">
          <el-icon><Upload /></el-icon>
          导入备份
        </el-button>
      </div>
    </div>

    <!-- 备份统计 -->
    <div class="backup-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Files /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ backups.length }}</div>
              <div class="stat-label">总备份数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ lastBackupDays }}</div>
              <div class="stat-label">距上次备份</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ totalBackupSize }}</div>
              <div class="stat-label">总大小</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ autoBackupEnabled ? '开启' : '关闭' }}</div>
              <div class="stat-label">自动备份</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 自动备份设置 -->
    <el-card class="auto-backup-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>⚙️ 自动备份设置</span>
          <el-switch 
            v-model="autoBackupEnabled" 
            @change="toggleAutoBackup"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
      </template>
      
      <div v-if="autoBackupEnabled" class="auto-backup-settings">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="setting-item">
              <label>备份频率</label>
              <el-select v-model="autoBackupFrequency" @change="saveAutoBackupSettings">
                <el-option label="每小时" value="hourly" />
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="setting-item">
              <label>保留数量</label>
              <el-input-number 
                v-model="maxBackupCount" 
                :min="1" 
                :max="50"
                @change="saveAutoBackupSettings"
              />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="setting-item">
              <label>下次备份</label>
              <div class="next-backup-time">{{ nextBackupTime }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 备份列表 -->
    <div class="backup-list">
      <div class="list-header">
        <h4>📋 备份列表</h4>
        <div class="list-actions">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索备份..."
            size="small"
            style="width: 200px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button size="small" @click="cleanupOldBackups">
            <el-icon><Delete /></el-icon>
            清理旧备份
          </el-button>
        </div>
      </div>

      <div v-if="filteredBackups.length === 0" class="empty-state">
        <el-empty description="暂无备份文件" />
      </div>
      
      <div v-else class="backups-table">
        <el-table :data="filteredBackups" stripe>
          <el-table-column prop="name" label="备份名称" min-width="200">
            <template #default="{ row }">
              <div class="backup-name">
                <el-icon><Document /></el-icon>
                <span>{{ row.name }}</span>
                <el-tag v-if="row.type === 'auto'" type="info" size="small">自动</el-tag>
                <el-tag v-else type="primary" size="small">手动</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="description" label="描述" min-width="150">
            <template #default="{ row }">
              <span>{{ row.description || '无描述' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="size" label="大小" width="100">
            <template #default="{ row }">
              <span>{{ formatFileSize(row.size) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              <span>{{ formatDateTime(row.createdAt) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="text" size="small" @click="restoreBackup(row)">
                  <el-icon><RefreshRight /></el-icon>
                  恢复
                </el-button>
                <el-button type="text" size="small" @click="downloadBackup(row)">
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <el-button type="text" size="small" @click="viewBackupDetails(row)">
                  <el-icon><View /></el-icon>
                  详情
                </el-button>
                <el-button type="text" size="small" @click="deleteBackup(row.id)" class="danger">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建备份对话框 -->
    <el-dialog v-model="showCreateBackupDialog" title="创建备份" width="500px">
      <el-form :model="backupForm" :rules="backupRules" ref="backupFormRef" label-width="80px">
        <el-form-item label="备份名称" prop="name">
          <el-input v-model="backupForm.name" placeholder="输入备份名称" />
        </el-form-item>
        
        <el-form-item label="备份描述">
          <el-input 
            v-model="backupForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="描述这次备份的内容或原因"
          />
        </el-form-item>
        
        <el-form-item label="备份内容">
          <el-checkbox-group v-model="backupForm.content">
            <el-checkbox label="novel">小说内容</el-checkbox>
            <el-checkbox label="chapters">章节管理</el-checkbox>
            <el-checkbox label="templates">模板数据</el-checkbox>
            <el-checkbox label="corpus">语料库</el-checkbox>
            <el-checkbox label="characters">角色设定</el-checkbox>
            <el-checkbox label="worldSettings">世界观设定</el-checkbox>
            <el-checkbox label="goals">写作目标</el-checkbox>
            <el-checkbox label="settings">应用设置</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateBackupDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateBackup" :loading="creating">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 备份详情对话框 -->
    <el-dialog v-model="showBackupDetailsDialog" title="备份详情" width="600px">
      <div v-if="selectedBackup" class="backup-details">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="备份名称">{{ selectedBackup.name }}</el-descriptions-item>
            <el-descriptions-item label="备份类型">
              <el-tag :type="selectedBackup.type === 'auto' ? 'info' : 'primary'">
                {{ selectedBackup.type === 'auto' ? '自动备份' : '手动备份' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(selectedBackup.size) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(selectedBackup.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ selectedBackup.description || '无描述' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section">
          <h4>备份内容</h4>
          <div class="content-list">
            <div v-for="item in selectedBackup.contentList" :key="item.key" class="content-item">
              <el-icon><Document /></el-icon>
              <span>{{ item.name }}</span>
              <span class="content-size">({{ formatFileSize(item.size) }})</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { saveAs } from 'file-saver'
import { storageService } from '../services/storageService'

// ... (other component setup code)

// --- Data Export ---
const exportData = async () => {
  try {
    const chapters = await storageService.getItem('novel_chapters') || []
    const goals = await storageService.getItem('writingGoals') || []
    
    const dataToExport = {
      chapters,
      goals,
      // Add other data sources if needed
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json;charset=utf-8' })
    saveAs(blob, `91writing_backup_${new Date().toISOString().slice(0, 10)}.json`)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败: ' + error.message)
  }
}

// --- Data Import ---
const importData = async (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result)
      
      await ElMessageBox.confirm('导入数据将覆盖现有内容，确定要继续吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      
      if (data.chapters) {
        await storageService.setItem('novel_chapters', data.chapters)
      }
      if (data.goals) {
        await storageService.setItem('writingGoals', data.goals)
      }
      
      ElMessage.success('数据导入成功，请刷新页面查看')
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('数据导入失败: ' + error.message)
      }
    }
  }
  reader.readAsText(file.raw)
}

// --- Auto Backup ---
const autoBackupSettings = reactive({
  enabled: false,
  interval: 24, // hours
})

const saveSettings = async () => {
  await storageService.setItem('auto_backup_settings', autoBackupSettings)
  ElMessage.success('自动备份设置已保存')
}

const loadSettings = async () => {
  const saved = await storageService.getItem('auto_backup_settings')
  if (saved) {
    Object.assign(autoBackupSettings, saved)
  }
}

// --- Backup Management ---
const backupList = ref([])

const saveBackupMeta = async (meta) => {
  await storageService.setItem('backup_list', meta)
}

const loadBackupMeta = async () => {
  const saved = await storageService.getItem('backup_list')
  if (saved) {
    backupList.value = saved
  }
}

onMounted(async () => {
  await loadSettings()
  await loadBackupMeta()
})
</script>

<style scoped>
.backup-manager {
  padding: 20px;
}

.backup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.backup-stats {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.auto-backup-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.auto-backup-settings {
  padding-top: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.next-backup-time {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.backup-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-actions .danger {
  color: #f56c6c;
}

.backup-details {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin-bottom: 12px;
  color: #303133;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.content-size {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}
</style>