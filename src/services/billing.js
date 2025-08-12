import { storageService } from './storageService';

class BillingService {
  constructor() {
    this.initializeStorage()
  }

  // 初始化本地存储
  async initializeStorage() {
    if (await storageService.getItem('account_balance') === null) {
      await storageService.setItem('account_balance', '0.00') // 初始余额为0
    }
    if (await storageService.getItem('billing_records') === null) {
      await storageService.setItem('billing_records', [])
    }
    if (await storageService.getItem('token_usage_stats') === null) {
      await storageService.setItem('token_usage_stats', {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        lastResetDate: new Date().toISOString()
      })
    }
  }

  // 模型价格配置（每1000个token的价格，单位：人民币）
  getModelPricing() {
    return {
      'gpt-4': {
        input: 0.21,   // $0.03 * 7 (汇率)
        output: 0.42   // $0.06 * 7
      },
      'gpt-4-turbo': {
        input: 0.07,   // $0.01 * 7
        output: 0.21   // $0.03 * 7
      },
      'gpt-3.5-turbo': {
        input: 0.0035, // $0.0005 * 7
        output: 0.0105 // $0.0015 * 7
      },
      'claude-3-opus': {
        input: 0.105,  // $0.015 * 7
        output: 0.525  // $0.075 * 7
      },
      'claude-3-sonnet': {
        input: 0.021,  // $0.003 * 7
        output: 0.105  // $0.015 * 7
      },
      'claude-3-haiku': {
        input: 0.0014, // $0.00025 * 7
        output: 0.007  // $0.00125 * 7
      },
      'default': {
        input: 0.007,  // 默认价格
        output: 0.014
      }
    }
  }

  // 计算token费用费用
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = this.getModelPricing()
    const modelPricing = pricing[model] || pricing['default']
    
    const inputCost = (inputTokens / 1000) * modelPricing.input
    const outputCost = (outputTokens / 1000) * modelPricing.output
    
    return inputCost + outputCost
  }

  // 估算prompt的token数量（粗略估算，1个中文字符约等于1.5个token）
  estimateTokens(text) {
    if (!text) return 0
    
    // 简单的token估算逻辑
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
    const otherChars = text.length - chineseChars - englishWords
    
    // 中文字符 * 1.5 + 英文单词 * 1.3 + 其他字符 * 0.5
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5)
  }

  // 获取账户余额
  async getAccountBalance() {
    const balance = await storageService.getItem('account_balance')
    return parseFloat(balance || '0')
  }

  // 检查余额是否足够
  async checkBalance(estimatedCost) {
    const balance = await this.getAccountBalance()
    return balance >= estimatedCost
  }

  // 扣除费用
  async deductBalance(amount) {
    const currentBalance = await this.getAccountBalance()
    const newBalance = Math.max(0, currentBalance - amount)
    await storageService.setItem('account_balance', newBalance.toString())
    return newBalance
  }

  // 充值余额
  async addBalance(amount) {
    const currentBalance = await this.getAccountBalance()
    const newBalance = currentBalance + amount
    await storageService.setItem('account_balance', newBalance.toString())
    return newBalance
  }

  // 记录API调用
  async recordAPICall(params) {
    try {
      const records = await this.getBillingRecords()
      const cost = this.calculateCost(params.model, params.inputTokens, params.outputTokens)
      
      const record = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: params.type || 'generation',
        model: params.model,
        content: params.content || '', // 保存完整的请求内容
        response: params.response || '', // 保存完整的响应内容
        inputTokens: params.inputTokens || 0,
        outputTokens: params.outputTokens || 0,
        totalTokens: (params.inputTokens || 0) + (params.outputTokens || 0),
        cost: cost,
        status: params.status || 'success'
      }
      
      records.unshift(record) // 最新记录放在前面
      
      // 只保留最近1000条记录
      if (records.length > 1000) {
        records.splice(1000)
      }
      
      await storageService.setItem('billing_records', records)
      
      // 扣除费用
      await this.deductBalance(cost)
      
      // 更新统计信息
      await this.updateUsageStats(params.inputTokens || 0, params.outputTokens || 0, cost)
      
      console.log(`API调用记录：模型=${params.model}, 输入=${params.inputTokens}tokens, 输出=${params.outputTokens}tokens, 费用=¥${cost.toFixed(4)}`)
      
      return record
    } catch (error) {
      console.error('记录API调用失败:', error)
      return null
    }
  }

  // 获取计费记录
  async getBillingRecords() {
    try {
      const records = await storageService.getItem('billing_records')
      return records || []
    } catch (error) {
      console.error('获取计费记录失败:', error)
      return []
    }
  }

  // 更新使用统计
  async updateUsageStats(inputTokens, outputTokens, cost) {
    try {
      const stats = await storageService.getItem('token_usage_stats') || {}
      
      stats.totalInputTokens = (stats.totalInputTokens || 0) + inputTokens
      stats.totalOutputTokens = (stats.totalOutputTokens || 0) + outputTokens
      stats.totalCost = (stats.totalCost || 0) + cost
      stats.lastUpdateDate = new Date().toISOString()
      
      await storageService.setItem('token_usage_stats', stats)
    } catch (error) {
      console.error('更新使用统计失败:', error)
    }
  }

  // 获取使用统计
  async getUsageStats() {
    try {
      const stats = await storageService.getItem('token_usage_stats')
      return stats || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        lastResetDate: new Date().toISOString()
      }
    } catch (error) {
      console.error('获取使用统计失败:', error)
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        lastResetDate: new Date().toISOString()
      }
    }
  }

  // 获取今日使用统计
  async getTodayStats() {
    const records = await this.getBillingRecords()
    const today = new Date().toDateString()
    
    const todayRecords = records.filter(record => 
      new Date(record.timestamp).toDateString() === today
    )
    
    return {
      tokenCount: todayRecords.reduce((sum, record) => sum + record.totalTokens, 0),
      cost: todayRecords.reduce((sum, record) => sum + record.cost, 0),
      requestCount: todayRecords.length
    }
  }

  // 获取最近N天的使用趋势
  async getUsageTrend(days = 7) {
    const records = await this.getBillingRecords()
    const trend = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toDateString()
      
      const dayRecords = records.filter(record => 
        new Date(record.timestamp).toDateString() === dateString
      )
      
      trend.push({
        date: dateString,
        tokenCount: dayRecords.reduce((sum, record) => sum + record.totalTokens, 0),
        cost: dayRecords.reduce((sum, record) => sum + record.cost, 0),
        requestCount: dayRecords.length
      })
    }
    
    return trend
  }

  // 清除过期记录（保留最近30天）
  async cleanOldRecords() {
    try {
      const records = await this.getBillingRecords()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const filteredRecords = records.filter(record => 
        new Date(record.timestamp) > thirtyDaysAgo
      )
      
      await storageService.setItem('billing_records', filteredRecords)
      
      console.log(`清理了 ${records.length - filteredRecords.length} 条过期记录`)
    } catch (error) {
      console.error('清理过期记录失败:', error)
    }
  }

  // 导出计费数据
  async exportBillingData(format = 'json') {
    const records = await this.getBillingRecords()
    const stats = await this.getUsageStats()
    
    const exportData = {
      exportTime: new Date().toISOString(),
      accountBalance: await this.getAccountBalance(),
      usageStats: stats,
      records: records
    }
    
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    } else if (format === 'csv') {
      // 简单的CSV格式
      let csv = 'timestamp,type,model,inputTokens,outputTokens,totalTokens,cost,status\n'
      records.forEach(record => {
        csv += `${record.timestamp},${record.type},${record.model},${record.inputTokens},${record.outputTokens},${record.totalTokens},${record.cost},${record.status}\n`
      })
      return csv
    }
    
    return exportData
  }
}

export default new BillingService() 