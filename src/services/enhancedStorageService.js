// 增强的存储服务
// src/services/enhancedStorageService.js

import { storageService } from './storageService'
import { ElMessage } from 'element-plus'

class EnhancedStorageService {
  constructor() {
    this.retryCount = 3
    this.retryDelay = 1000
    this.transactionQueue = new Map()
    this.isProcessingTransaction = false
  }

  /**
   * 安全获取数据，带重试机制
   * @param {string} key - 存储键
   * @param {any} defaultValue - 默认值
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<any>} 数据
   */
  async safeGetItem(key, defaultValue = null, maxRetries = this.retryCount) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await storageService.getItem(key)
        return result !== null ? result : defaultValue
      } catch (error) {
        console.warn(`获取数据失败 (尝试 ${attempt}/${maxRetries}):`, key, error)
        
        if (attempt === maxRetries) {
          console.error(`最终获取数据失败:`, key, error)
          return defaultValue
        }
        
        // 等待后重试
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  /**
   * 安全保存数据，带重试机制和数据验证
   * @param {string} key - 存储键
   * @param {any} value - 要保存的值
   * @param {Object} options - 配置选项
   * @returns {Promise<boolean>} 是否保存成功
   */
  async safeSetItem(key, value, options = {}) {
    const {
      maxRetries = this.retryCount,
      validateData = true,
      backup = true,
      showErrorMessage = false
    } = options

    // 数据验证
    if (validateData && !this.validateData(key, value)) {
      const error = new Error(`数据验证失败: ${key}`)
      console.error(error)
      if (showErrorMessage) {
        ElMessage.error('数据格式错误，保存失败')
      }
      throw error
    }

    // 创建备份
    let backupValue = null
    if (backup) {
      try {
        backupValue = await this.safeGetItem(key)
      } catch (error) {
        console.warn('创建备份失败:', error)
      }
    }

    // 尝试保存
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await storageService.setItem(key, value)
        
        // 验证保存结果
        if (validateData) {
          const savedValue = await storageService.getItem(key)
          if (!this.compareData(value, savedValue)) {
            throw new Error('保存后数据验证失败')
          }
        }
        
        return true
      } catch (error) {
        console.warn(`保存数据失败 (尝试 ${attempt}/${maxRetries}):`, key, error)
        
        if (attempt === maxRetries) {
          console.error(`最终保存数据失败:`, key, error)
          
          // 尝试恢复备份
          if (backup && backupValue !== null) {
            try {
              await storageService.setItem(key, backupValue)
              console.log('已恢复备份数据')
            } catch (restoreError) {
              console.error('恢复备份失败:', restoreError)
            }
          }
          
          if (showErrorMessage) {
            ElMessage.error('保存失败，请稍后重试')
          }
          
          throw error
        }
        
        // 等待后重试
        await this.delay(this.retryDelay * attempt)
      }
    }
  }

  /**
   * 事务性保存多个数据
   * @param {Array<Object>} operations - 操作数组 [{key, value, operation}]
   * @param {Object} options - 配置选项
   * @returns {Promise<boolean>} 是否全部保存成功
   */
  async saveTransaction(operations, options = {}) {
    const {
      rollbackOnError = true,
      showErrorMessage = true
    } = options

    const transactionId = Date.now() + Math.random()
    const backups = new Map()
    const completedOperations = []

    try {
      this.isProcessingTransaction = true

      // 第一阶段：创建备份
      if (rollbackOnError) {
        for (const op of operations) {
          try {
            const backup = await this.safeGetItem(op.key)
            backups.set(op.key, backup)
          } catch (error) {
            console.warn(`创建备份失败: ${op.key}`, error)
          }
        }
      }

      // 第二阶段：执行操作
      for (const op of operations) {
        try {
          switch (op.operation || 'set') {
            case 'set':
              await this.safeSetItem(op.key, op.value, { 
                ...options, 
                backup: false, 
                showErrorMessage: false 
              })
              break
            case 'remove':
              await storageService.removeItem(op.key)
              break
            default:
              throw new Error(`不支持的操作: ${op.operation}`)
          }
          completedOperations.push(op)
        } catch (error) {
          console.error(`事务操作失败: ${op.key}`, error)
          throw error
        }
      }

      console.log(`事务 ${transactionId} 执行成功，完成 ${completedOperations.length} 个操作`)
      return true

    } catch (error) {
      console.error(`事务 ${transactionId} 执行失败:`, error)

      // 回滚操作
      if (rollbackOnError && backups.size > 0) {
        console.log('开始回滚事务...')
        
        for (const [key, backupValue] of backups) {
          try {
            if (backupValue !== null) {
              await storageService.setItem(key, backupValue)
            } else {
              await storageService.removeItem(key)
            }
          } catch (rollbackError) {
            console.error(`回滚失败: ${key}`, rollbackError)
          }
        }
        
        console.log('事务回滚完成')
      }

      if (showErrorMessage) {
        ElMessage.error('数据保存失败，已回滚更改')
      }

      throw error
    } finally {
      this.isProcessingTransaction = false
    }
  }

  /**
   * 保存小说数据（事务性）
   * @param {string} novelId - 小说ID
   * @param {Object} novelData - 小说数据
   * @param {Array} chapterList - 章节列表
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveNovelTransaction(novelId, novelData, chapterList = []) {
    const operations = []

    // 保存小说基本信息
    operations.push({
      key: `novel_${novelId}`,
      value: {
        ...novelData,
        lastModified: new Date().toISOString()
      },
      operation: 'set'
    })

    // 更新小说列表
    try {
      const novelsList = await this.safeGetItem('novels', [])
      const updatedList = Array.isArray(novelsList) ? [...novelsList] : []
      
      const existingIndex = updatedList.findIndex(n => n.id === novelId)
      if (existingIndex >= 0) {
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          ...novelData,
          lastModified: new Date().toISOString()
        }
      } else {
        updatedList.push({
          id: novelId,
          ...novelData,
          lastModified: new Date().toISOString()
        })
      }

      operations.push({
        key: 'novels',
        value: updatedList,
        operation: 'set'
      })
    } catch (error) {
      console.warn('更新小说列表失败:', error)
    }

    return await this.saveTransaction(operations, {
      rollbackOnError: true,
      showErrorMessage: true
    })
  }

  /**
   * 保存章节数据
   * @param {string} novelId - 小说ID
   * @param {string} chapterId - 章节ID
   * @param {Object} chapterData - 章节数据
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveChapterData(novelId, chapterId, chapterData) {
    try {
      // 获取小说数据
      const novel = await this.safeGetItem(`novel_${novelId}`)
      if (!novel) {
        throw new Error('小说不存在')
      }

      // 更新章节数据
      const chapters = novel.chapters || []
      const chapterIndex = chapters.findIndex(c => c.id === chapterId)
      
      const updatedChapter = {
        id: chapterId,
        ...chapterData,
        lastModified: new Date().toISOString()
      }

      if (chapterIndex >= 0) {
        chapters[chapterIndex] = updatedChapter
      } else {
        chapters.push(updatedChapter)
      }

      // 更新小说数据
      const updatedNovel = {
        ...novel,
        chapters,
        lastModified: new Date().toISOString()
      }

      // 使用事务保存
      return await this.saveNovelTransaction(novelId, updatedNovel)
    } catch (error) {
      console.error('保存章节数据失败:', error)
      throw error
    }
  }

  /**
   * 数据验证
   * @param {string} key - 存储键
   * @param {any} value - 数据值
   * @returns {boolean} 是否有效
   */
  validateData(key, value) {
    // 基本验证
    if (value === undefined) {
      return false
    }

    // 针对特定键的验证
    if (key === 'novels' && !Array.isArray(value)) {
      return false
    }

    if (key.startsWith('novel_') && typeof value !== 'object') {
      return false
    }

    // 检查数据大小（避免过大的数据）
    try {
      const serialized = JSON.stringify(value)
      if (serialized.length > 50 * 1024 * 1024) { // 50MB 限制
        console.warn('数据过大:', key, serialized.length)
        return false
      }
    } catch (error) {
      console.error('数据序列化失败:', error)
      return false
    }

    return true
  }

  /**
   * 比较两个数据是否相同
   * @param {any} data1 - 数据1
   * @param {any} data2 - 数据2
   * @returns {boolean} 是否相同
   */
  compareData(data1, data2) {
    try {
      return JSON.stringify(data1) === JSON.stringify(data2)
    } catch (error) {
      console.error('数据比较失败:', error)
      return false
    }
  }

  /**
   * 延迟执行
   * @param {number} ms - 毫秒数
   * @returns {Promise} Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 获取存储统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStorageStats() {
    try {
      // 这里可以添加更详细的统计逻辑
      return {
        isHealthy: true,
        lastError: null,
        transactionInProgress: this.isProcessingTransaction
      }
    } catch (error) {
      return {
        isHealthy: false,
        lastError: error.message,
        transactionInProgress: this.isProcessingTransaction
      }
    }
  }

  /**
   * 清理过期数据
   * @param {number} maxAge - 最大年龄（毫秒）
   * @returns {Promise<number>} 清理的数据项数量
   */
  async cleanupExpiredData(maxAge = 30 * 24 * 60 * 60 * 1000) { // 默认30天
    // 这里可以实现数据清理逻辑
    // 由于当前存储服务不支持遍历所有键，这个功能需要在实际实现时扩展
    console.log('清理过期数据功能待实现')
    return 0
  }
}

// 创建增强存储服务实例
export const enhancedStorageService = new EnhancedStorageService()

// 导出类以便测试
export { EnhancedStorageService }