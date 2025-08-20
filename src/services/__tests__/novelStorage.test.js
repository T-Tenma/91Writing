// src/services/__tests__/novelStorage.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock storageService
vi.mock('../storageService', () => ({
  storageService: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}));

import { novelStorageService } from '../novelStorage';
import { storageService } from '../storageService';

describe('NovelStorageService - Novel Data CRUD Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清理定时器
    if (novelStorageService.autoSaveTimer) {
      clearTimeout(novelStorageService.autoSaveTimer);
      novelStorageService.autoSaveTimer = null;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (novelStorageService.autoSaveTimer) {
      clearTimeout(novelStorageService.autoSaveTimer);
      novelStorageService.autoSaveTimer = null;
    }
  });

  describe('Novel CRUD Operations', () => {
    describe('saveNovel - CREATE/UPDATE', () => {
      it('应该成功保存新小说', async () => {
        const novelId = 'novel_001';
        const novelData = {
          id: novelId,
          title: '测试小说',
          author: '测试作者',
          genre: '科幻',
          description: '这是一部测试小说',
          chapters: []
        };

        storageService.setItem.mockResolvedValue(undefined);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result = await novelStorageService.saveNovel(novelId, novelData);

        expect(result).toBe(true);
        expect(storageService.setItem).toHaveBeenCalledWith(
          `novel_${novelId}`,
          expect.objectContaining({
            ...novelData,
            lastModified: expect.any(String)
          })
        );
        expect(consoleSpy).toHaveBeenCalledWith(`小说 ${novelId} 保存成功`);

        consoleSpy.mockRestore();
      });

      it('应该在保存时添加lastModified时间戳', async () => {
        const novelId = 'novel_002';
        const novelData = { title: '时间戳测试小说' };

        storageService.setItem.mockResolvedValue(undefined);

        const beforeSave = new Date().toISOString();
        await novelStorageService.saveNovel(novelId, novelData);
        const afterSave = new Date().toISOString();

        const savedData = storageService.setItem.mock.calls[0][1];
        expect(savedData.lastModified).toBeDefined();
        expect(savedData.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(savedData.lastModified >= beforeSave).toBe(true);
        expect(savedData.lastModified <= afterSave).toBe(true);
      });

      it('应该处理保存失败的情况', async () => {
        const novelId = 'novel_003';
        const novelData = { title: '失败测试小说' };
        const error = new Error('Storage error');

        storageService.setItem.mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(novelStorageService.saveNovel(novelId, novelData))
          .rejects.toThrow('Storage error');

        expect(consoleSpy).toHaveBeenCalledWith('保存小说失败:', error);
        consoleSpy.mockRestore();
      });

      it('应该正确处理复杂的小说数据结构', async () => {
        const novelId = 'novel_004';
        const complexNovelData = {
          id: novelId,
          title: '复杂小说结构测试',
          author: '测试作者',
          metadata: {
            genre: '奇幻',
            tags: ['魔法', '冒险', '友情'],
            wordCount: 50000,
            status: 'ongoing',
            rating: 4.5
          },
          chapters: [
            {
              id: 'chapter_001',
              title: '第一章',
              content: '这是第一章的内容...',
              wordCount: 2000,
              status: 'published'
            }
          ],
          characters: [
            {
              id: 'char_001',
              name: '主角',
              description: '勇敢的冒险者',
              relationships: ['char_002']
            }
          ],
          settings: {
            autoSave: true,
            theme: 'dark',
            fontSize: 16
          }
        };

        storageService.setItem.mockResolvedValue(undefined);

        const result = await novelStorageService.saveNovel(novelId, complexNovelData);

        expect(result).toBe(true);
        expect(storageService.setItem).toHaveBeenCalledWith(
          `novel_${novelId}`,
          expect.objectContaining({
            ...complexNovelData,
            lastModified: expect.any(String)
          })
        );
      });
    });

    describe('getNovel - READ', () => {
      it('应该成功获取存在的小说', async () => {
        const novelId = 'novel_005';
        const expectedNovel = {
          id: novelId,
          title: '获取测试小说',
          author: '测试作者',
          lastModified: '2023-01-01T00:00:00.000Z'
        };

        storageService.getItem.mockResolvedValue(expectedNovel);

        const result = await novelStorageService.getNovel(novelId);

        expect(result).toEqual(expectedNovel);
        expect(storageService.getItem).toHaveBeenCalledWith(`novel_${novelId}`);
      });

      it('应该对不存在的小说返回null', async () => {
        const novelId = 'non_existent_novel';

        storageService.getItem.mockResolvedValue(null);

        const result = await novelStorageService.getNovel(novelId);

        expect(result).toBeNull();
        expect(storageService.getItem).toHaveBeenCalledWith(`novel_${novelId}`);
      });

      it('应该处理获取小说时的错误', async () => {
        const novelId = 'error_novel';
        const error = new Error('Get error');

        storageService.getItem.mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await novelStorageService.getNovel(novelId);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('获取小说失败:', error);
        consoleSpy.mockRestore();
      });
    });

    describe('getAllNovels - READ LIST', () => {
      it('应该成功获取所有小说列表', async () => {
        const expectedNovels = [
          { id: 'novel_001', title: '小说1' },
          { id: 'novel_002', title: '小说2' },
          { id: 'novel_003', title: '小说3' }
        ];

        storageService.getItem.mockResolvedValue(expectedNovels);

        const result = await novelStorageService.getAllNovels();

        expect(result).toEqual(expectedNovels);
        expect(storageService.getItem).toHaveBeenCalledWith('novels_list');
      });

      it('应该在没有小说列表时返回空数组', async () => {
        storageService.getItem.mockResolvedValue(null);

        const result = await novelStorageService.getAllNovels();

        expect(result).toEqual([]);
        expect(storageService.getItem).toHaveBeenCalledWith('novels_list');
      });

      it('应该处理获取小说列表时的错误', async () => {
        const error = new Error('Get list error');

        storageService.getItem.mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await novelStorageService.getAllNovels();

        expect(result).toEqual([]);
        expect(consoleSpy).toHaveBeenCalledWith('获取小说列表失败:', error);
        consoleSpy.mockRestore();
      });
    });

    describe('saveNovelsList - UPDATE LIST', () => {
      it('应该成功保存小说列表', async () => {
        const novelsList = [
          { id: 'novel_001', title: '小说1', lastModified: '2023-01-01T00:00:00.000Z' },
          { id: 'novel_002', title: '小说2', lastModified: '2023-01-02T00:00:00.000Z' }
        ];

        storageService.setItem.mockResolvedValue(undefined);

        const result = await novelStorageService.saveNovelsList(novelsList);

        expect(result).toBe(true);
        expect(storageService.setItem).toHaveBeenCalledWith('novels_list', novelsList);
      });

      it('应该处理保存小说列表失败的情况', async () => {
        const novelsList = [{ id: 'novel_001', title: '小说1' }];
        const error = new Error('Save list error');

        storageService.setItem.mockRejectedValue(error);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(novelStorageService.saveNovelsList(novelsList))
          .rejects.toThrow('Save list error');

        expect(consoleSpy).toHaveBeenCalledWith('保存小说列表失败:', error);
        consoleSpy.mockRestore();
      });

      it('应该处理空的小说列表', async () => {
        const emptyList = [];

        storageService.setItem.mockResolvedValue(undefined);

        const result = await novelStorageService.saveNovelsList(emptyList);

        expect(result).toBe(true);
        expect(storageService.setItem).toHaveBeenCalledWith('novels_list', emptyList);
      });
    });
  });

  describe('Chapter CRUD Operations', () => {
    describe('saveChapter - CREATE/UPDATE', () => {
      it('应该成功保存新章节到现有小说', async () => {
        const novelId = 'novel_006';
        const chapterId = 'chapter_001';
        const chapterData = {
          title: '第一章：开始',
          content: '这是第一章的内容...',
          wordCount: 1500,
          status: 'draft'
        };

        const existingNovel = {
          id: novelId,
          title: '测试小说',
          chapters: []
        };

        // Mock获取现有小说
        storageService.getItem.mockResolvedValue(existingNovel);
        storageService.setItem.mockResolvedValue(undefined);
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const result = await novelStorageService.saveChapter(novelId, chapterId, chapterData);

        expect(result).toBe(true);
        expect(storageService.getItem).toHaveBeenCalledWith(`novel_${novelId}`);
        expect(storageService.setItem).toHaveBeenCalledWith(
          `novel_${novelId}`,
          expect.objectContaining({
            ...existingNovel,
            chapters: expect.arrayContaining([
              expect.objectContaining({
                id: chapterId,
                ...chapterData,
                lastModified: expect.any(String)
              })
            ]),
            lastModified: expect.any(String)
          })
        );
        expect(consoleSpy).toHaveBeenCalledWith(`章节 ${chapterId} 保存成功`);

        consoleSpy.mockRestore();
      });

      it('应该成功更新现有章节', async () => {
        const novelId = 'novel_007';
        const chapterId = 'chapter_001';
        const updatedChapterData = {
          title: '第一章：新的开始',
          content: '这是更新后的第一章内容...',
          wordCount: 2000,
          status: 'published'
        };

        const existingNovel = {
          id: novelId,
          title: '测试小说',
          chapters: [
            {
              id: chapterId,
              title: '第一章：开始',
              content: '原始内容',
              wordCount: 1500,
              status: 'draft',
              lastModified: '2023-01-01T00:00:00.000Z'
            }
          ]
        };

        storageService.getItem.mockResolvedValue(existingNovel);
        storageService.setItem.mockResolvedValue(undefined);

        const result = await novelStorageService.saveChapter(novelId, chapterId, updatedChapterData);

        expect(result).toBe(true);
        
        const savedNovel = storageService.setItem.mock.calls[0][1];
        const updatedChapter = savedNovel.chapters.find(c => c.id === chapterId);
        
        expect(updatedChapter).toEqual(expect.objectContaining({
          id: chapterId,
          ...updatedChapterData,
          lastModified: expect.any(String)
        }));
        expect(updatedChapter.lastModified).not.toBe('2023-01-01T00:00:00.000Z');
      });

      it('应该在小说不存在时抛出错误', async () => {
        const novelId = 'non_existent_novel';
        const chapterId = 'chapter_001';
        const chapterData = { title: '测试章节' };

        storageService.getItem.mockResolvedValue(null);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(novelStorageService.saveChapter(novelId, chapterId, chapterData))
          .rejects.toThrow('小说不存在');

        expect(consoleSpy).toHaveBeenCalledWith('保存章节失败:', expect.any(Error));
        consoleSpy.mockRestore();
      });

      it('应该处理没有chapters数组的小说', async () => {
        const novelId = 'novel_008';
        const chapterId = 'chapter_001';
        const chapterData = { title: '第一章', content: '内容' };

        const novelWithoutChapters = {
          id: novelId,
          title: '没有章节的小说'
          // 注意：没有chapters属性
        };

        storageService.getItem.mockResolvedValue(novelWithoutChapters);
        storageService.setItem.mockResolvedValue(undefined);

        const result = await novelStorageService.saveChapter(novelId, chapterId, chapterData);

        expect(result).toBe(true);
        
        const savedNovel = storageService.setItem.mock.calls[0][1];
        expect(savedNovel.chapters).toBeDefined();
        expect(savedNovel.chapters).toHaveLength(1);
        expect(savedNovel.chapters[0]).toEqual(expect.objectContaining({
          id: chapterId,
          ...chapterData,
          lastModified: expect.any(String)
        }));
      });

      it('应该处理保存章节时的存储错误', async () => {
        const novelId = 'novel_009';
        const chapterId = 'chapter_001';
        const chapterData = { title: '测试章节' };

        const existingNovel = { id: novelId, title: '测试小说', chapters: [] };

        storageService.getItem.mockResolvedValue(existingNovel);
        storageService.setItem.mockRejectedValue(new Error('Storage error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(novelStorageService.saveChapter(novelId, chapterId, chapterData))
          .rejects.toThrow('Storage error');

        expect(consoleSpy).toHaveBeenCalledWith('保存章节失败:', expect.any(Error));
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Auto Save Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('应该在指定延迟后执行自动保存', async () => {
      const novelId = 'novel_010';
      const chapterId = 'chapter_001';
      const content = '自动保存的内容';
      const debounceTime = 2000;

      const existingNovel = {
        id: novelId,
        title: '自动保存测试小说',
        chapters: [{ id: chapterId, title: '测试章节', content: '原始内容' }]
      };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // 触发自动保存
      novelStorageService.autoSave(novelId, chapterId, content, debounceTime);

      // 验证定时器已设置但尚未执行
      expect(storageService.setItem).not.toHaveBeenCalled();

      // 快进时间
      vi.advanceTimersByTime(debounceTime);

      // 等待异步操作完成
      await vi.runAllTimersAsync();

      expect(storageService.setItem).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('自动保存成功');

      consoleSpy.mockRestore();
    });

    it('应该在新的自动保存请求时取消之前的定时器', async () => {
      const novelId = 'novel_011';
      const chapterId = 'chapter_001';
      const content1 = '第一次内容';
      const content2 = '第二次内容';
      const debounceTime = 2000;

      const existingNovel = {
        id: novelId,
        title: '防抖测试小说',
        chapters: [{ id: chapterId, title: '测试章节' }]
      };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      // 第一次自动保存请求
      novelStorageService.autoSave(novelId, chapterId, content1, debounceTime);

      // 在第一次完成前发起第二次请求
      vi.advanceTimersByTime(1000);
      novelStorageService.autoSave(novelId, chapterId, content2, debounceTime);

      // 快进到第一次应该完成的时间
      vi.advanceTimersByTime(1000);
      expect(storageService.setItem).not.toHaveBeenCalled();

      // 快进到第二次应该完成的时间
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      // 应该只调用一次，且是最后一次的内容
      expect(storageService.setItem).toHaveBeenCalledTimes(1);
      
      const savedNovel = storageService.setItem.mock.calls[0][1];
      const savedChapter = savedNovel.chapters.find(c => c.id === chapterId);
      expect(savedChapter.content).toBe(content2);
    });

    it('应该使用默认的防抖时间', async () => {
      const novelId = 'novel_012';
      const chapterId = 'chapter_001';
      const content = '默认防抖时间测试';

      const existingNovel = {
        id: novelId,
        title: '默认防抖测试',
        chapters: [{ id: chapterId, title: '测试章节' }]
      };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      // 不传递debounceTime参数，应该使用默认值2000ms
      novelStorageService.autoSave(novelId, chapterId, content);

      // 1999ms时不应该执行
      vi.advanceTimersByTime(1999);
      expect(storageService.setItem).not.toHaveBeenCalled();

      // 2000ms时应该执行
      vi.advanceTimersByTime(1);
      await vi.runAllTimersAsync();

      expect(storageService.setItem).toHaveBeenCalled();
    });

    it('应该处理自动保存过程中的错误', async () => {
      const novelId = 'novel_013';
      const chapterId = 'chapter_001';
      const content = '错误测试内容';

      storageService.getItem.mockRejectedValue(new Error('Auto save error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      novelStorageService.autoSave(novelId, chapterId, content, 1000);

      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith('自动保存失败:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('应该完成完整的小说创建和章节管理流程', async () => {
      const novelId = 'integration_novel';
      const novelData = {
        id: novelId,
        title: '集成测试小说',
        author: '测试作者',
        genre: '测试类型'
      };

      const chapters = [
        { id: 'ch1', title: '第一章', content: '第一章内容' },
        { id: 'ch2', title: '第二章', content: '第二章内容' },
        { id: 'ch3', title: '第三章', content: '第三章内容' }
      ];

      storageService.setItem.mockResolvedValue(undefined);
      storageService.getItem.mockImplementation(async (key) => {
        if (key === `novel_${novelId}`) {
          // 模拟小说数据的逐步构建
          const novel = { ...novelData, chapters: [] };
          // 添加已保存的章节
          for (const chapter of chapters) {
            if (storageService.setItem.mock.calls.some(call => 
              call[1].chapters && call[1].chapters.some(c => c.id === chapter.id)
            )) {
              novel.chapters.push({ ...chapter, lastModified: expect.any(String) });
            }
          }
          return novel;
        }
        return null;
      });

      // 1. 创建小说
      const createResult = await novelStorageService.saveNovel(novelId, novelData);
      expect(createResult).toBe(true);

      // 2. 添加章节
      for (const chapter of chapters) {
        // 更新mock以反映当前状态
        const currentNovel = await novelStorageService.getNovel(novelId);
        storageService.getItem.mockResolvedValue({
          ...currentNovel,
          chapters: [...(currentNovel?.chapters || []), chapter]
        });

        const chapterResult = await novelStorageService.saveChapter(
          novelId, 
          chapter.id, 
          chapter
        );
        expect(chapterResult).toBe(true);
      }

      // 3. 验证最终状态
      expect(storageService.setItem).toHaveBeenCalledTimes(4); // 1次小说 + 3次章节
    });

    it('应该处理并发的章节保存操作', async () => {
      const novelId = 'concurrent_novel';
      const existingNovel = {
        id: novelId,
        title: '并发测试小说',
        chapters: []
      };

      const chapters = Array.from({ length: 5 }, (_, i) => ({
        id: `chapter_${i + 1}`,
        title: `第${i + 1}章`,
        content: `第${i + 1}章的内容`
      }));

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      // 并发保存多个章节
      const savePromises = chapters.map(chapter =>
        novelStorageService.saveChapter(novelId, chapter.id, chapter)
      );

      const results = await Promise.all(savePromises);

      // 所有保存操作都应该成功
      results.forEach(result => expect(result).toBe(true));
      expect(storageService.setItem).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('应该处理无效的小说ID', async () => {
      const invalidIds = ['', null, undefined, 123, {}, []];

      for (const invalidId of invalidIds) {
        storageService.getItem.mockResolvedValue(null);
        
        const result = await novelStorageService.getNovel(invalidId);
        expect(result).toBeNull();
      }
    });

    it('应该处理无效的章节数据', async () => {
      const novelId = 'valid_novel';
      const existingNovel = { id: novelId, title: '测试小说', chapters: [] };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      const invalidChapterData = [
        null,
        undefined,
        '',
        123,
        []
      ];

      for (const invalidData of invalidChapterData) {
        const result = await novelStorageService.saveChapter(
          novelId, 
          'test_chapter', 
          invalidData
        );
        expect(result).toBe(true); // 应该仍然成功，因为会合并数据
      }
    });

    it('应该处理存储服务完全不可用的情况', async () => {
      const error = new Error('Storage service unavailable');
      
      storageService.getItem.mockRejectedValue(error);
      storageService.setItem.mockRejectedValue(error);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // 测试各种操作的错误处理
      await expect(novelStorageService.saveNovel('test', {})).rejects.toThrow();
      expect(await novelStorageService.getNovel('test')).toBeNull();
      expect(await novelStorageService.getAllNovels()).toEqual([]);
      await expect(novelStorageService.saveNovelsList([])).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledTimes(4);
      consoleSpy.mockRestore();
    });

    it('应该处理大量章节的小说', async () => {
      const novelId = 'large_novel';
      const largeChapterCount = 1000;
      
      const existingNovel = {
        id: novelId,
        title: '大型小说',
        chapters: Array.from({ length: largeChapterCount }, (_, i) => ({
          id: `chapter_${i + 1}`,
          title: `第${i + 1}章`,
          content: `第${i + 1}章的内容`.repeat(100),
          wordCount: 2000
        }))
      };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      const newChapterData = {
        title: `第${largeChapterCount + 1}章`,
        content: '新章节内容',
        wordCount: 1500
      };

      const startTime = Date.now();
      const result = await novelStorageService.saveChapter(
        novelId, 
        `chapter_${largeChapterCount + 1}`, 
        newChapterData
      );
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
      
      const savedNovel = storageService.setItem.mock.calls[0][1];
      expect(savedNovel.chapters).toHaveLength(largeChapterCount + 1);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('应该保持数据结构的一致性', async () => {
      const novelId = 'consistency_novel';
      const novelData = {
        id: novelId,
        title: '一致性测试小说',
        author: '测试作者'
      };

      storageService.setItem.mockResolvedValue(undefined);

      await novelStorageService.saveNovel(novelId, novelData);

      const savedData = storageService.setItem.mock.calls[0][1];
      
      // 验证必要字段存在
      expect(savedData).toHaveProperty('id', novelId);
      expect(savedData).toHaveProperty('title', novelData.title);
      expect(savedData).toHaveProperty('author', novelData.author);
      expect(savedData).toHaveProperty('lastModified');
      expect(typeof savedData.lastModified).toBe('string');
    });

    it('应该正确处理章节的时间戳', async () => {
      const novelId = 'timestamp_novel';
      const chapterId = 'timestamp_chapter';
      const existingNovel = {
        id: novelId,
        title: '时间戳测试',
        chapters: []
      };

      storageService.getItem.mockResolvedValue(existingNovel);
      storageService.setItem.mockResolvedValue(undefined);

      const beforeSave = new Date().toISOString();
      await novelStorageService.saveChapter(novelId, chapterId, { title: '测试章节' });
      const afterSave = new Date().toISOString();

      const savedNovel = storageService.setItem.mock.calls[0][1];
      const savedChapter = savedNovel.chapters[0];

      expect(savedChapter.lastModified).toBeDefined();
      expect(savedChapter.lastModified >= beforeSave).toBe(true);
      expect(savedChapter.lastModified <= afterSave).toBe(true);
      expect(savedNovel.lastModified >= beforeSave).toBe(true);
      expect(savedNovel.lastModified <= afterSave).toBe(true);
    });
  });
});
