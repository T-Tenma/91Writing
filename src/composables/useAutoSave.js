// Vue 自动保存组合式函数
// src/composables/useAutoSave.js

import { ref, onUnmounted, watch, nextTick } from 'vue'
import { autoSaveService } from '@/services/improvedAutoSave'
import { enhancedStorageService } from '@/services/enhancedStorageService'
import { ElMessage } from 'element-plus'

/**
 * 自动保存组合式函数
 * @param {Object} options - 配置选项
 * @returns {Object} 自动保存相关方法和状态
 */
export function useAutoSave(options = {}) {
  const {
    debounceTime = 2000,
    showUserNotifications = false,
    enableForceServe = true,
    validateBeforeSave = true
  } = options

  // 状态
  const isSaving = ref(false)
  const lastSaveTime = ref(null)
  const saveError = ref(null)
  const hasUnsavedChanges = ref(false)

  /**
   * 触发自动保存
   * @param {string} chapterId - 章节ID
   * @param {string} novelId - 小说ID
   * @param {string} content - 内容
   * @param {Object} additionalData - 额外数据
   */
  const triggerAutoSave = async (chapterId, novelId, content, additionalData = {}) => {
    if (!chapterId || !novelId) {
      console.warn('自动保存参数不完整:', { chapterId, novelId })
      return
    }

    hasUnsavedChanges.value = true
    saveError.value = null

    // 创建保存函数
    const saveFunction = async (chapterId, novelId, content) => {
      try {
        isSaving.value = true

        // 准备章节数据
        const chapterData = {
          content,
          wordCount: content ? content.replace(/<[^>]*>/g, '').length : 0,
          updatedAt: new Date(),
          ...additionalData
        }

        // 数据验证
        if (validateBeforeSave && !validateChapterData(chapterData)) {
          throw new Error('章节数据验证失败')
        }

        // 使用增强存储服务保存
        const success = await enhancedStorageService.saveChapterData(
          novelId, 
          chapterId, 
          chapterData
        )

        if (success) {
          lastSaveTime.value = new Date()
          hasUnsavedChanges.value = false
          
          if (showUserNotifications) {
            console.log('章节自动保存成功')
          }
        } else {
          throw new Error('保存操作返回失败')
        }

      } catch (error) {
        console.error('自动保存执行失败:', error)
        saveError.value = error
        throw error
      } finally {
        isSaving.value = false
      }
    }

    // 使用自动保存服务
    await autoSaveService.triggerAutoSave(
      chapterId,
      novelId,
      content,
      saveFunction,
      { debounceTime }
    )
  }

  /**
   * 手动保存
   * @param {string} chapterId - 章节ID
   * @param {string} novelId - 小说ID
   * @param {string} content - 内容
   * @param {Object} additionalData - 额外数据
   */
  const manualSave = async (chapterId, novelId, content, additionalData = {}) => {
    try {
      isSaving.value = true
      saveError.value = null

      const chapterData = {
        content,
        wordCount: content ? content.replace(/<[^>]*>/g, '').length : 0,
        updatedAt: new Date(),
        ...additionalData
      }

      if (validateBeforeSave && !validateChapterData(chapterData)) {
        throw new Error('章节数据验证失败')
      }

      const success = await enhancedStorageService.saveChapterData(
        novelId,
        chapterId,
        chapterData
      )

      if (success) {
        lastSaveTime.value = new Date()
        hasUnsavedChanges.value = false
        ElMessage.success('保存成功')
      } else {
        throw new Error('手动保存失败')
      }

    } catch (error) {
      console.error('手动保存失败:', error)
      saveError.value = error
      ElMessage.error('保存失败: ' + error.message)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 强制保存所有挂起的内容
   */
  const forceServeAll = async () => {
    try {
      await autoSaveService.forceServeAll()
      ElMessage.success('强制保存完成')
    } catch (error) {
      console.error('强制保存失败:', error)
      ElMessage.error('强制保存失败')
    }
  }

  /**
   * 获取保存状态
   * @param {string} chapterId - 章节ID
   * @param {string} novelId - 小说ID
   * @returns {Object} 保存状态
   */
  const getSaveStatus = (chapterId, novelId) => {
    if (!chapterId || !novelId) {
      return {
        isPending: false,
        isSaving: false,
        lastSaveTime: null
      }
    }

    const status = autoSaveService.getSaveStatus(chapterId, novelId)
    return {
      ...status,
      isSaving: isSaving.value,
      hasUnsavedChanges: hasUnsavedChanges.value,
      lastError: saveError.value
    }
  }

  /**
   * 验证章节数据
   * @param {Object} chapterData - 章节数据
   * @returns {boolean} 是否有效
   */
  const validateChapterData = (chapterData) => {
    if (!chapterData || typeof chapterData !== 'object') {
      return false
    }

    // 检查必要字段
    if (chapterData.content === undefined) {
      return false
    }

    // 检查内容长度
    if (typeof chapterData.content === 'string' && chapterData.content.length > 1000000) {
      console.warn('章节内容过长')
      return false
    }

    return true
  }

  /**
   * 设置未保存更改状态
   * @param {boolean} hasChanges - 是否有未保存更改
   */
  const setUnsavedChanges = (hasChanges) => {
    hasUnsavedChanges.value = hasChanges
  }

  /**
   * 清除保存错误
   */
  const clearSaveError = () => {
    saveError.value = null
  }

  /**
   * 启用/禁用自动保存
   * @param {boolean} enabled - 是否启用
   */
  const setAutoSaveEnabled = (enabled) => {
    autoSaveService.setEnabled(enabled)
  }

  /**
   * 更新自动保存配置
   * @param {Object} newConfig - 新配置
   */
  const updateAutoSaveConfig = (newConfig) => {
    autoSaveService.updateConfig(newConfig)
  }

  // 页面可见性变化处理
  const handleVisibilityChange = () => {
    if (document.hidden && hasUnsavedChanges.value) {
      console.log('页面隐藏，触发自动保存')
      // 这里可以触发强制保存
    }
  }

  // 页面卸载前处理
  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges.value) {
      const message = '有未保存的更改，确定要离开吗？'
      event.returnValue = message
      return message
    }
  }

  // 设置事件监听器
  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  // 组件卸载时清理
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }

    // 如果有未保存的更改，尝试最后一次保存
    if (hasUnsavedChanges.value && enableForceServe) {
      console.log('组件卸载，尝试最后保存')
      // 注意：这里是同步操作，可能无法完成
    }
  })

  // 监听路由变化（如果在路由环境中）
  if (typeof window !== 'undefined' && window.addEventListener) {
    const handlePopState = () => {
      if (hasUnsavedChanges.value) {
        console.warn('路由变化但有未保存更改')
      }
    }

    window.addEventListener('popstate', handlePopState)

    onUnmounted(() => {
      window.removeEventListener('popstate', handlePopState)
    })
  }

  return {
    // 状态
    isSaving,
    lastSaveTime,
    saveError,
    hasUnsavedChanges,

    // 方法
    triggerAutoSave,
    manualSave,
    forceServeAll,
    getSaveStatus,
    setUnsavedChanges,
    clearSaveError,
    setAutoSaveEnabled,
    updateAutoSaveConfig,

    // 验证
    validateChapterData
  }
}