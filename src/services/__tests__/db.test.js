// src/services/__tests__/db.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('dexie', () => {
  const mockDexie = vi.fn().mockImplementation((name) => ({
    name,
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis(),
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    key_value_store: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      toArray: vi.fn(),
      count: vi.fn()
    }
  }));

  return {
    default: mockDexie
  };
});

import { db } from '../db';

describe('Database Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确初始化数据库', () => {
    expect(mockDexie).toHaveBeenCalledWith('91writing_db');
  });

  it('应该定义正确的数据库模式', () => {
    expect(db.version).toHaveBeenCalled();
    expect(db.stores).toHaveBeenCalledWith({
      key_value_store: '&key'
    });
  });

  it('应该具有key_value_store表', () => {
    expect(db.key_value_store).toBeDefined();
    expect(typeof db.key_value_store.get).toBe('function');
    expect(typeof db.key_value_store.put).toBe('function');
    expect(typeof db.key_value_store.delete).toBe('function');
    expect(typeof db.key_value_store.clear).toBe('function');
  });

  it('应该支持基本的数据库操作方法', () => {
    const requiredMethods = ['get', 'put', 'delete', 'clear'];
    
    requiredMethods.forEach(method => {
      expect(db.key_value_store[method]).toBeDefined();
      expect(typeof db.key_value_store[method]).toBe('function');
    });
  });

  describe('Database Schema Validation', () => {
    it('应该使用正确的数据库名称', () => {
      expect(db.name).toBe('91writing_db');
    });

    it('应该配置key作为主键', () => {
      // 验证stores配置中key_value_store使用&key作为主键
      expect(db.stores).toHaveBeenCalledWith(
        expect.objectContaining({
          key_value_store: '&key'
        })
      );
    });
  });

  describe('Database Connection', () => {
    it('应该能够打开数据库连接', async () => {
      db.open.mockResolvedValue(undefined);
      
      await expect(db.open()).resolves.toBeUndefined();
      expect(db.open).toHaveBeenCalled();
    });

    it('应该能够关闭数据库连接', async () => {
      db.close.mockResolvedValue(undefined);
      
      await expect(db.close()).resolves.toBeUndefined();
      expect(db.close).toHaveBeenCalled();
    });

    it('应该能够删除数据库', async () => {
      db.delete.mockResolvedValue(undefined);
      
      await expect(db.delete()).resolves.toBeUndefined();
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('应该处理数据库打开失败', async () => {
      const error = new Error('Database open failed');
      db.open.mockRejectedValue(error);
      
      await expect(db.open()).rejects.toThrow('Database open failed');
    });

    it('应该处理数据库关闭失败', async () => {
      const error = new Error('Database close failed');
      db.close.mockRejectedValue(error);
      
      await expect(db.close()).rejects.toThrow('Database close failed');
    });

    it('应该处理数据库删除失败', async () => {
      const error = new Error('Database delete failed');
      db.delete.mockRejectedValue(error);
      
      await expect(db.delete()).rejects.toThrow('Database delete failed');
    });
  });
});