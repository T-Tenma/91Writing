// 改进的自动保存服务测试
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImprovedAutoSaveService } from '../improvedAutoSave';

// Mock ElMessage
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn()
  }
}));

// Mock storageService
const mockStorageService = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

vi.mock('../storageService', () => ({
  storageService: mockStorageService
}));

describe('ImprovedAutoSaveService', () => {
  let autoSaveService;
  let mockSaveFunction;

  beforeEach(() => {
    vi.useFakeTimers();
    autoSaveService = new ImprovedAutoSaveService();
    mockSaveFunction = vi.fn().mockResolvedValue(true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    autoSaveService.destroy();
  });

  describe('基本自动保存功能', () => {
    it('应该能够触发自动保存', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';
      const content = '测试内容';

      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        content,
        mockSaveFunction
      );

      // 验证定时器已设置
      expect(autoSaveService.timers.has(`${novelId}_${chapterId}`)).toBe(true);
      expect(autoSaveService.saveQueue.has(`${novelId}_${chapterId}`)).toBe(true);
    });

    it('应该在防抖时间后执行保存', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';
      const content = '测试内容';

      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        content,
        mockSaveFunction
      );

      // 快进时间
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // 验证保存函数被调用
      expect(mockSaveFunction).toHaveBeenCalledWith(chapterId, novelId, content);
    });

    it('应该能够取消之前的定时器', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';

      // 第一次触发
      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        '内容1',
        mockSaveFunction
      );

      // 第二次触发（应该取消第一次）
      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        '内容2',
        mockSaveFunction
      );

      // 快进时间
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // 应该只调用一次，使用最新内容
      expect(mockSaveFunction).toHaveBeenCalledTimes(1);
      expect(mockSaveFunction).toHaveBeenCalledWith(chapterId, novelId, '内容2');
    });
  });

  describe('错误处理', () => {
    it('应该能够重试失败的保存', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';
      const content = '测试内容';

      // 设置保存函数前两次失败，第三次成功
      mockSaveFunction
        .mockRejectedValueOnce(new Error('保存失败1'))
        .mockRejectedValueOnce(new Error('保存失败2'))
        .mockResolvedValueOnce(true);

      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        content,
        mockSaveFunction
      );

      // 快进初始定时器
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // 快进重试定时器
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();

      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // 验证重试次数
      expect(mockSaveFunction).toHaveBeenCalledTimes(3);
    });

    it('应该在达到最大重试次数后停止重试', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';
      const content = '测试内容';

      // 设置保存函数总是失败
      mockSaveFunction.mockRejectedValue(new Error('持续失败'));

      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        content,
        mockSaveFunction
      );

      // 快进所有可能的重试
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(5000);
        await vi.runAllTimersAsync();
      }

      // 验证不会超过最大重试次数
      expect(mockSaveFunction).toHaveBeenCalledTimes(3); // 1次初始 + 2次重试
    });
  });

  describe('强制保存', () => {
    it('应该能够强制保存所有挂起的内容', async () => {
      const chapterId1 = 'chapter_1';
      const chapterId2 = 'chapter_2';
      const novelId = 'novel_1';

      // 触发多个自动保存
      await autoSaveService.triggerAutoSave(
        chapterId1,
        novelId,
        '内容1',
        mockSaveFunction
      );

      await autoSaveService.triggerAutoSave(
        chapterId2,
        novelId,
        '内容2',
        mockSaveFunction
      );

      // 强制保存
      await autoSaveService.forceServeAll();

      // 验证所有内容都被保存
      expect(mockSaveFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('状态管理', () => {
    it('应该能够获取保存状态', () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';

      // 触发保存
      autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        '内容',
        mockSaveFunction
      );

      const status = autoSaveService.getSaveStatus(chapterId, novelId);
      expect(status.isPending).toBe(true);
      expect(status.isSaving).toBe(false);
    });

    it('应该能够启用/禁用自动保存', async () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';

      // 禁用自动保存
      autoSaveService.setEnabled(false);

      await autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        '内容',
        mockSaveFunction
      );

      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();

      // 验证保存函数未被调用
      expect(mockSaveFunction).not.toHaveBeenCalled();
    });
  });

  describe('资源清理', () => {
    it('应该能够正确清理所有资源', () => {
      const chapterId = 'chapter_1';
      const novelId = 'novel_1';

      // 触发一些保存
      autoSaveService.triggerAutoSave(
        chapterId,
        novelId,
        '内容',
        mockSaveFunction
      );

      // 销毁服务
      autoSaveService.destroy();

      // 验证所有资源被清理
      expect(autoSaveService.timers.size).toBe(0);
      expect(autoSaveService.saveQueue.size).toBe(0);
      expect(autoSaveService.savePromises.size).toBe(0);
    });
  });
});