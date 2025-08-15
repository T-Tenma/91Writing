// 自动保存服务
import { ElMessage } from 'element-plus'

/**
 * 创建自动保存函数
 * @param {Object} novelStore - 小说存储对象
 * @param {Object} options - 配置选项
 * @returns {Function} 自动保存函数
 */
export const createAutoSaveFunction = (novelStore, options = {}) => {
  const {
    debounceTime = 2000,
    showMessage = false
  } = options
  
  let autoSaveTimer = null
  
  /**
   * 自动保存函数
   * @param {Object} chapter - 当前章节
   * @param {String} novelId - 小说ID
   * @param {Function} setIsSaving - 设置保存状态的函数
   */
  const autoSave = async (chapter, novelId, setIsSaving) => {
    if (!chapter || !novelId) {
      console.warn('自动保存失败: 缺少章节或小说ID')
      return
    }
    
    // 清除之前的定时器
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    
    // 设置新的定时器
    autoSaveTimer = setTimeout(async () => {
      if (setIsSaving) setIsSaving(true)
      
      try {
        // 使用 store 的保存方法
        await novelStore.saveChapter(
          chapter.id, 
          {
            content: chapter.content,
            title: chapter.title,
            status: chapter.status || 'draft'
          }
        )
        
        if (showMessage) {
          console.log('章节内容已自动保存')
        }
      } catch (error) {
        console.error('自动保存失败:', error)
        ElMessage.error('保存失败，请手动保存')
      } finally {
        // 1秒后隐藏保存状态
        if (setIsSaving) {
          setTimeout(() => {
            setIsSaving(false)
          }, 1000)
        }
      }
    }, debounceTime)
  }
  
  // 返回自动保存函数
  return autoSave
}

/**
 * 清除自动保存定时器
 * @param {Number} timer - 定时器ID
 */
export const clearAutoSaveTimer = (timer) => {
  if (timer) {
    clearTimeout(timer)
  }
}