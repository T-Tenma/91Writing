// 小说数据持久化服务
import { storageService } from './storageService'

export const novelStorageService = {
  // 保存小说数据
  async saveNovel(novelId, novelData) {
    try {
      const key = `novel_${novelId}`
      await storageService.setItem(key, {
        ...novelData,
        lastModified: new Date().toISOString()
      })
      console.log(`小说 ${novelId} 保存成功`)
      return true
    } catch (error) {
      console.error('保存小说失败:', error)
      throw error
    }
  },

  // 保存章节内容
  async saveChapter(novelId, chapterId, chapterData) {
    try {
      // 先获取小说数据
      const novel = await this.getNovel(novelId)
      if (!novel) {
        throw new Error('小说不存在')
      }

      // 更新章节数据
      if (!novel.chapters) {
        novel.chapters = []
      }

      const chapterIndex = novel.chapters.findIndex(c => c.id === chapterId)
      if (chapterIndex >= 0) {
        novel.chapters[chapterIndex] = {
          ...novel.chapters[chapterIndex],
          ...chapterData,
          lastModified: new Date().toISOString()
        }
      } else {
        novel.chapters.push({
          id: chapterId,
          ...chapterData,
          lastModified: new Date().toISOString()
        })
      }

      // 保存整个小说
      await this.saveNovel(novelId, novel)
      console.log(`章节 ${chapterId} 保存成功`)
      return true
    } catch (error) {
      console.error('保存章节失败:', error)
      throw error
    }
  },

  // 获取小说数据
  async getNovel(novelId) {
    try {
      const key = `novel_${novelId}`
      return await storageService.getItem(key)
    } catch (error) {
      console.error('获取小说失败:', error)
      return null
    }
  },

  // 获取所有小说列表
  async getAllNovels() {
    try {
      const novelsList = await storageService.getItem('novels_list') || []
      return novelsList
    } catch (error) {
      console.error('获取小说列表失败:', error)
      return []
    }
  },

  // 保存小说列表
  async saveNovelsList(novelsList) {
    try {
      await storageService.setItem('novels_list', novelsList)
      return true
    } catch (error) {
      console.error('保存小说列表失败:', error)
      throw error
    }
  },

  // 自动保存功能
  async autoSave(novelId, chapterId, content, debounceTime = 2000) {
    // 防抖保存
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    this.autoSaveTimer = setTimeout(async () => {
      try {
        await this.saveChapter(novelId, chapterId, { content })
        console.log('自动保存成功')
      } catch (error) {
        console.error('自动保存失败:', error)
      }
    }, debounceTime)
  }
}