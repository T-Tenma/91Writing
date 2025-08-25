// 改进的自动保存服务
// src/services/improvedAutoSave.js

import { ElMessage } from 'element-plus'
import { storageService } from './storageService'

class ImprovedAutoSaveService {
  constructor() {
    // 自动保存配置
    this.config = {
      debounceTime: 2000,        // 防抖延迟时间
      maxRetries: 3,             // 最大重试次数
      retryDelay: 1000,          // 重试延迟
      forceInterval: 30000,      // 强制保存间隔（30秒）
      showUserNotifications: false // 是否显示用户通知
    }
    
    // 状态管理
    this.timers = new Map()           // 存储各个章节的定时器
    this.saveQueue = new Map()        // 保存队列
    this.lastSaveTime = new Map()     // 最后保存时间
    this.savePromises = new Map()     // 正在进行的保存Promise
    this.isEnabled = true             // 是否启用自动保存
    
    // 错误统计
    this.errorCount = 0
    this.lastError = null
    
    // 绑定方法
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)
    
    // 初始化
    this.init()
  }
  
  init() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // 监听页面卸载
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    
    // 定期强制保存检查
    this.forceCheckTimer = setInterval(() => {
      this.checkForceServe()
    }, this.config.forceInterval)
  }
  
  /**
   * 触发自动保存
   * @param {string} chapterId - 章节ID
   * @param {string} novelId - 小说ID
   * @param {string} content - 内容
   * @param {Function} saveFunction - 保存函数
   * @param {Object} options - 配置选项
   */
  async triggerAutoSave(chapterId, novelId, content, saveFunction, options = {}) {
    if (!this.isEnabled || !chapterId || !novelId || !saveFunction) {
      console.warn('自动保存被禁用或参数不完整')
      return
    }
    
    const key = `${novelId}_${chapterId}`
    
    // 清除之前的定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }
    
    // 更新保存队列
    this.saveQueue.set(key, {
      chapterId,
      novelId,
      content,
      saveFunction,
      timestamp: Date.now(),
      retryCount: 0
    })
    
    // 设置新的防抖定时器
    const timer = setTimeout(async () => {
      await this.executeSave(key)
    }, options.debounceTime || this.config.debounceTime)
    
    this.timers.set(key, timer)
  }
  
  /**
   * 执行保存操作
   * @param {string} key - 保存键
   */
  async executeSave(key) {
    const saveData = this.saveQueue.get(key)
    if (!saveData) {
      return
    }
    
    // 防止重复保存
    if (this.savePromises.has(key)) {
      console.warn(`保存操作已在进行中: ${key}`)
      return
    }
    
    try {
      // 创建保存Promise
      const savePromise = this.performSave(saveData)
      this.savePromises.set(key, savePromise)
      
      await savePromise
      
      // 保存成功
      this.lastSaveTime.set(key, Date.now())
      this.saveQueue.delete(key)
      this.timers.delete(key)
      
      if (this.config.showUserNotifications) {
        console.log(`章节自动保存成功: ${saveData.chapterId}`)
      }
      
      // 重置错误计数
      this.errorCount = 0
      this.lastError = null
      
    } catch (error) {
      console.error(`自动保存失败: ${key}`, error)
      this.handleSaveError(key, error)
    } finally {
      this.savePromises.delete(key)
    }
  }
  
  /**
   * 执行实际保存操作
   * @param {Object} saveData - 保存数据
   */
  async performSave(saveData) {
    const { chapterId, novelId, content, saveFunction } = saveData
    
    // 调用传入的保存函数
    if (typeof saveFunction === 'function') {
      await saveFunction(chapterId, novelId, content)
    } else {
      throw new Error('无效的保存函数')
    }
  }
  
  /**
   * 处理保存错误
   * @param {string} key - 保存键
   * @param {Error} error - 错误对象
   */
  async handleSaveError(key, error) {
    this.errorCount++
    this.lastError = error
    
    const saveData = this.saveQueue.get(key)
    if (!saveData) {
      return
    }
    
    saveData.retryCount++
    
    // 检查是否需要重试
    if (saveData.retryCount < this.config.maxRetries) {
      console.warn(`自动保存失败，准备重试 (${saveData.retryCount}/${this.config.maxRetries}): ${key}`)
      
      // 延迟重试
      setTimeout(async () => {
        await this.executeSave(key)
      }, this.config.retryDelay * saveData.retryCount)
      
    } else {
      // 达到最大重试次数
      console.error(`自动保存最终失败: ${key}`, error)
      this.saveQueue.delete(key)
      this.timers.delete(key)
      
      // 通知用户
      ElMessage.error('内容自动保存失败，请手动保存以防数据丢失')
    }
  }
  
  /**
   * 强制保存所有挂起的内容
   */
  async forceServeAll() {
    console.log('执行强制保存所有挂起内容')
    
    const promises = []
    
    // 清除所有定时器并立即保存
    for (const [key, timer] of this.timers) {
      clearTimeout(timer)
      promises.push(this.executeSave(key))
    }
    
    // 等待所有保存完成
    const results = await Promise.allSettled(promises)
    
    // 统计结果
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    console.log(`强制保存完成: 成功 ${successful}, 失败 ${failed}`)
    
    if (failed > 0) {
      ElMessage.warning(`强制保存完成，但有 ${failed} 个章节保存失败`)
    }
  }
  
  /**
   * 检查强制保存
   */
  checkForceServe() {
    const now = Date.now()
    const forceThreshold = this.config.forceInterval
    
    for (const [key, saveData] of this.saveQueue) {
      const timeSinceQueued = now - saveData.timestamp
      
      if (timeSinceQueued > forceThreshold) {
        console.warn(`检测到长时间未保存的内容，执行强制保存: ${key}`)
        this.executeSave(key)
      }
    }
  }
  
  /**
   * 处理页面可见性变化
   */
  async handleVisibilityChange() {
    if (document.hidden) {
      // 页面隐藏时强制保存
      console.log('页面隐藏，执行强制保存')
      await this.forceServeAll()
    }
  }
  
  /**
   * 处理页面卸载前事件
   */
  handleBeforeUnload(event) {
    if (this.saveQueue.size > 0) {
      // 有未保存的内容，尝试同步保存
      console.warn('页面即将关闭，但有未保存的内容')
      
      // 显示确认对话框
      const message = '有未保存的内容，确定要离开吗？'
      event.returnValue = message
      return message
    }
  }
  
  /**
   * 获取保存状态
   * @param {string} chapterId - 章节ID
   * @param {string} novelId - 小说ID
   * @returns {Object} 保存状态
   */
  getSaveStatus(chapterId, novelId) {
    const key = `${novelId}_${chapterId}`
    
    return {
      isPending: this.saveQueue.has(key),
      isSaving: this.savePromises.has(key),
      lastSaveTime: this.lastSaveTime.get(key),
      errorCount: this.errorCount,
      lastError: this.lastError
    }
  }
  
  /**
   * 启用/禁用自动保存
   * @param {boolean} enabled - 是否启用
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
    
    if (!enabled) {
      // 禁用时清除所有定时器
      for (const timer of this.timers.values()) {
        clearTimeout(timer)
      }
      this.timers.clear()
    }
  }
  
  /**
   * 更新配置
   * @param {Object} newConfig - 新配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }
  
  /**
   * 清理资源
   */
  destroy() {
    // 清除所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    
    // 清除强制检查定时器
    if (this.forceCheckTimer) {
      clearInterval(this.forceCheckTimer)
    }
    
    // 移除事件监听器
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
    
    // 清空所有Map
    this.saveQueue.clear()
    this.lastSaveTime.clear()
    this.savePromises.clear()
  }
}

// 创建单例实例
export const autoSaveService = new ImprovedAutoSaveService()

// 导出类以便测试
export { ImprovedAutoSaveService }