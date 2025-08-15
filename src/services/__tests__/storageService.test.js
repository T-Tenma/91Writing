// src/services/__tests__/storageService.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the db module
vi.mock('../db', () => {
  // 内存存储模拟IndexedDB
  const memoryStore = new Map();
  
  const mockTable = {
    get: vi.fn(async (key) => {
      const item = memoryStore.get(key);
      return item ? { key, value: item } : undefined;
    }),
    put: vi.fn(async (item) => {
      memoryStore.set(item.key, item.value);
      return item.key;
    }),
    delete: vi.fn(async (key) => {
      const existed = memoryStore.has(key);
      memoryStore.delete(key);
      return existed;
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
      return undefined;
    }),
    // 测试辅助方法
    _getMemoryStore: () => memoryStore,
    _clearMemoryStore: () => memoryStore.clear(),
  };

  return {
    db: {
      key_value_store: mockTable,
    },
  };
});

import { storageService } from '../storageService';
import { db } from '../db';

describe('StorageService - IndexedDB CRUD Operations', () => {
  beforeEach(() => {
    // 清理内存存储和mock调用历史
    db.key_value_store._clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CREATE Operations (setItem)', () => {
    it('应该成功创建新的键值对', async () => {
      const key = 'test_key';
      const value = { id: 1, name: 'Test Item' };

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      expect(db.key_value_store.put).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理字符串类型数据的创建', async () => {
      const key = 'string_key';
      const value = 'simple string value';

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toBe(value);
    });

    it('应该正确处理数组类型数据的创建', async () => {
      const key = 'array_key';
      const value = [1, 2, 3, { nested: 'object' }];

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(Array.isArray(retrieved)).toBe(true);
    });

    it('应该正确处理复杂嵌套对象的创建', async () => {
      const key = 'complex_key';
      const value = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true,
              preferences: ['email', 'sms']
            }
          }
        },
        metadata: {
          created: '2023-01-01T00:00:00.000Z',
          version: '1.0.0'
        }
      };

      await storageService.setItem(key, value);

      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(retrieved.user.profile.settings.preferences).toHaveLength(2);
    });

    it('应该正确处理特殊值的创建（null, undefined, 0, false, 空字符串）', async () => {
      // 测试null值
      await storageService.setItem('null_key', null);
      const nullResult = await storageService.getItem('null_key');
      expect(nullResult).toBeNull();

      // 测试undefined值 - 注意undefined在存储后可能变为null
      await storageService.setItem('undefined_key', undefined);
      const undefinedResult = await storageService.getItem('undefined_key');
      expect(undefinedResult).toBeUndefined();

      // 测试其他特殊值
      const otherTestCases = [
        { key: 'zero_key', value: 0 },
        { key: 'false_key', value: false },
        { key: 'empty_string_key', value: '' }
      ];

      for (const testCase of otherTestCases) {
        await storageService.setItem(testCase.key, testCase.value);
        const retrieved = await storageService.getItem(testCase.key);
        expect(retrieved).toBe(testCase.value);
      }
    });
// src/services/__tests__/storageService.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the db module
vi.mock('../db', () => {
  // 内存存储模拟IndexedDB
  const memoryStore = new Map();
  
  const mockTable = {
    get: vi.fn(async (key) => {
      const item = memoryStore.get(key);
      return item ? { key, value: item } : undefined;
    }),
    put: vi.fn(async (item) => {
      memoryStore.set(item.key, item.value);
      return item.key;
    }),
    delete: vi.fn(async (key) => {
      const existed = memoryStore.has(key);
      memoryStore.delete(key);
      return existed;
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
      return undefined;
    }),
    // 测试辅助方法
    _getMemoryStore: () => memoryStore,
    _clearMemoryStore: () => memoryStore.clear(),
  };

  return {
    db: {
      key_value_store: mockTable,
    },
  };
});

import { storageService } from '../storageService';
import { db } from '../db';

describe('StorageService - IndexedDB CRUD Operations', () => {
  beforeEach(() => {
    // 清理内存存储和mock调用历史
    db.key_value_store._clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CREATE Operations (setItem)', () => {
    it('应该成功创建新的键值对', async () => {
      const key = 'test_key';
      const value = { id: 1, name: 'Test Item' };

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      expect(db.key_value_store.put).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理字符串类型数据的创建', async () => {
      const key = 'string_key';
      const value = 'simple string value';

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toBe(value);
    });

    it('应该正确处理数组类型数据的创建', async () => {
      const key = 'array_key';
      const value = [1, 2, 3, { nested: 'object' }];

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(Array.isArray(retrieved)).toBe(true);
    });

    it('应该正确处理复杂嵌套对象的创建', async () => {
      const key = 'complex_key';
      const value = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true,
              preferences: ['email', 'sms']
            }
          }
        },
        metadata: {
          created: '2023-01-01T00:00:00.000Z',
          version: '1.0.0'
        }
      };

      await storageService.setItem(key, value);

      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(retrieved.user.profile.settings.preferences).toHaveLength(2);
    });

// src/services/__tests__/storageService.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the db module
vi.mock('../db', () => {
  // 内存存储模拟IndexedDB
  const memoryStore = new Map();
  
  const mockTable = {
    get: vi.fn(async (key) => {
      const item = memoryStore.get(key);
      return item ? { key, value: item } : undefined;
    }),
    put: vi.fn(async (item) => {
      memoryStore.set(item.key, item.value);
      return item.key;
    }),
    delete: vi.fn(async (key) => {
      const existed = memoryStore.has(key);
      memoryStore.delete(key);
      return existed;
    }),
    clear: vi.fn(async () => {
      memoryStore.clear();
      return undefined;
    }),
    // 测试辅助方法
    _getMemoryStore: () => memoryStore,
    _clearMemoryStore: () => memoryStore.clear(),
  };

  return {
    db: {
      key_value_store: mockTable,
    },
  };
});

import { storageService } from '../storageService';
import { db } from '../db';

describe('StorageService - IndexedDB CRUD Operations', () => {
  beforeEach(() => {
    // 清理内存存储和mock调用历史
    db.key_value_store._clearMemoryStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CREATE Operations (setItem)', () => {
    it('应该成功创建新的键值对', async () => {
      const key = 'test_key';
      const value = { id: 1, name: 'Test Item' };

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      expect(db.key_value_store.put).toHaveBeenCalledTimes(1);
    });

    it('应该正确处理字符串类型数据的创建', async () => {
      const key = 'string_key';
      const value = 'simple string value';

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toBe(value);
    });

    it('应该正确处理数组类型数据的创建', async () => {
      const key = 'array_key';
      const value = [1, 2, 3, { nested: 'object' }];

      await storageService.setItem(key, value);

      expect(db.key_value_store.put).toHaveBeenCalledWith({ key, value });
      
      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(Array.isArray(retrieved)).toBe(true);
    });

    it('应该正确处理复杂嵌套对象的创建', async () => {
      const key = 'complex_key';
      const value = {
        user: {
          id: 123,
          profile: {
            name: 'John Doe',
            settings: {
              theme: 'dark',
              notifications: true,
              preferences: ['email', 'sms']
            }
          }
        },
        metadata: {
          created: '2023-01-01T00:00:00.000Z',
          version: '1.0.0'
        }
      };

      await storageService.setItem(key, value);

      const retrieved = await storageService.getItem(key);
      expect(retrieved).toEqual(value);
      expect(retrieved.user.profile.settings.preferences).toHaveLength(2);
    });

    it('应该正确处理特殊值的创建（null, undefined, 0, false, 空字符串）', async () => {
      const testCases = [
        { key: 'null_key', value: null },
        { key: 'undefined_key', value: undefined },
        { key: 'zero_key', value: 0 },
        { key: 'false_key', value: false },
        { key: 'empty_string_key', value: '' }
      ];

      for (const testCase of testCases) {
        await storageService.setItem(testCase.key, testCase.value);
        const retrieved = await storageService.getItem(testCase.key);
        expect(retrieved).toBe(testCase.value);
      }
    });

    it('应该自动解析JSON字符串并存储为对象', async () => {
      const key = 'json_string_key';
      const jsonString = '{"name": "Test", "value": 123}';
      const expectedObject = { name: 'Test', value: 123 };

      // Mock console.warn to verify the warning is logged
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await storageService.setItem(key, jsonString);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auto-parsed JSON string for key')
      );
      expect(db.key_value_store.put).toHaveBeenCalledWith({ 
        key, 
        value: expectedObject 
      });

      consoleSpy.mockRestore();
    });
  });

  describe('READ Operations (getItem)', () => {
    it('应该成功读取存在的数据', async () => {
      const key = 'existing_key';
      const value = { data: 'test data' };

      await storageService.setItem(key, value);
      const retrieved = await storageService.getItem(key);

      expect(db.key_value_store.get).toHaveBeenCalledWith(key);
      expect(retrieved).toEqual(value);
    });

    it('应该对不存在的键返回null', async () => {
      const key = 'non_existent_key';

      const retrieved = await storageService.getItem(key);

      expect(db.key_value_store.get).toHaveBeenCalledWith(key);
      expect(retrieved).toBeNull();
    });

    it('应该正确处理存储的JSON字符串的向后兼容性', async () => {
      const key = 'legacy_json_key';
      const jsonString = '{"legacy": true, "version": "old"}';
      
      // 直接在内存存储中设置JSON字符串（模拟旧版本存储）
      const memoryStore = db.key_value_store._getMemoryStore();
      memoryStore.set(key, jsonString);

      // Mock console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const retrieved = await storageService.getItem(key);

      expect(retrieved).toEqual({ legacy: true, version: 'old' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse stored JSON')
      );

      consoleSpy.mockRestore();
    });

    it('应该处理无效JSON字符串而不崩溃', async () => {
      const key = 'invalid_json_key';
      const invalidJson = '{"invalid": json}';
      
      // 直接在内存存储中设置无效JSON字符串
      const memoryStore = db.key_value_store._getMemoryStore();
      memoryStore.set(key, invalidJson);

      // Mock console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const retrieved = await storageService.getItem(key);

      expect(retrieved).toBe(invalidJson); // 应该返回原始字符串
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('应该正确处理大量数据的读取', async () => {
      const key = 'large_data_key';
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        data: `Data for item ${i}`.repeat(10)
      }));

      await storageService.setItem(key, largeArray);
      const retrieved = await storageService.getItem(key);

      expect(retrieved).toEqual(largeArray);
      expect(retrieved).toHaveLength(1000);
    });
  });

  describe('UPDATE Operations (setItem - overwrite)', () => {
    it('应该成功更新现有数据', async () => {
      const key = 'update_key';
      const initialValue = { version: 1, data: 'initial' };
      const updatedValue = { version: 2, data: 'updated' };

      // 创建初始数据
      await storageService.setItem(key, initialValue);
      expect(await storageService.getItem(key)).toEqual(initialValue);

      // 更新数据
      await storageService.setItem(key, updatedValue);
      const retrieved = await storageService.getItem(key);

      expect(retrieved).toEqual(updatedValue);
      expect(retrieved.version).toBe(2);
      expect(db.key_value_store.put).toHaveBeenCalledTimes(2);
    });

    it('应该正确处理数据类型的变更', async () => {
      const key = 'type_change_key';

      // 初始为字符串
      await storageService.setItem(key, 'string value');
      expect(await storageService.getItem(key)).toBe('string value');

      // 更新为对象
      await storageService.setItem(key, { type: 'object' });
      expect(await storageService.getItem(key)).toEqual({ type: 'object' });

      // 更新为数组
      await storageService.setItem(key, [1, 2, 3]);
      expect(await storageService.getItem(key)).toEqual([1, 2, 3]);

      // 更新为数字
      await storageService.setItem(key, 42);
      expect(await storageService.getItem(key)).toBe(42);
    });

    it('应该处理并发更新操作', async () => {
      const key = 'concurrent_update_key';
      const updates = Array.from({ length: 10 }, (_, i) => ({ 
        id: i, 
        timestamp: Date.now() + i 
      }));

      // 并发执行多个更新操作
      const updatePromises = updates.map(update => 
        storageService.setItem(key, update)
      );

      await Promise.all(updatePromises);

      // 验证最终状态（应该是某个更新的结果）
      const finalValue = await storageService.getItem(key);
      expect(finalValue).toBeDefined();
      expect(typeof finalValue.id).toBe('number');
      expect(db.key_value_store.put).toHaveBeenCalledTimes(10);
    });
  });

  describe('DELETE Operations (removeItem)', () => {
    it('应该成功删除存在的数据', async () => {
      const key = 'delete_key';
      const value = { data: 'to be deleted' };

      // 创建数据
      await storageService.setItem(key, value);
      expect(await storageService.getItem(key)).toEqual(value);

      // 删除数据
      await storageService.removeItem(key);

      expect(db.key_value_store.delete).toHaveBeenCalledWith(key);
      expect(await storageService.getItem(key)).toBeNull();
    });

    it('应该优雅处理删除不存在的键', async () => {
      const key = 'non_existent_delete_key';

      await storageService.removeItem(key);

      expect(db.key_value_store.delete).toHaveBeenCalledWith(key);
      // 不应该抛出错误
    });

    it('应该处理批量删除操作', async () => {
      const keys = ['delete1', 'delete2', 'delete3', 'delete4', 'delete5'];
      
      // 创建多个数据项
      for (const key of keys) {
        await storageService.setItem(key, { key, data: `data for ${key}` });
      }

      // 验证数据已创建
      for (const key of keys) {
        expect(await storageService.getItem(key)).toBeDefined();
      }

      // 批量删除
      const deletePromises = keys.map(key => storageService.removeItem(key));
      await Promise.all(deletePromises);

      // 验证数据已删除
      for (const key of keys) {
        expect(await storageService.getItem(key)).toBeNull();
      }

      expect(db.key_value_store.delete).toHaveBeenCalledTimes(5);
    });
  });

  describe('CLEAR Operations (clear)', () => {
    it('应该成功清空所有数据', async () => {
      const testData = {
        'key1': 'value1',
        'key2': { object: 'value' },
        'key3': [1, 2, 3],
        'key4': 42,
        'key5': true
      };

      // 创建多个数据项
      for (const [key, value] of Object.entries(testData)) {
        await storageService.setItem(key, value);
      }

      // 验证数据已创建
      for (const [key, value] of Object.entries(testData)) {
        expect(await storageService.getItem(key)).toEqual(value);
      }

      // 清空所有数据
      await storageService.clear();

      expect(db.key_value_store.clear).toHaveBeenCalled();

      // 验证所有数据已清空
      for (const key of Object.keys(testData)) {
        expect(await storageService.getItem(key)).toBeNull();
      }
    });

    it('应该处理空存储的清空操作', async () => {
      await storageService.clear();

      expect(db.key_value_store.clear).toHaveBeenCalled();
      // 不应该抛出错误
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('应该处理数据库操作失败的情况', async () => {
      const key = 'error_key';
      const value = 'test value';

      // Mock数据库操作失败
      db.key_value_store.put.mockRejectedValueOnce(new Error('Database error'));

      await expect(storageService.setItem(key, value)).rejects.toThrow('Database error');
    });

    it('应该处理读取操作失败的情况', async () => {
      const key = 'error_read_key';

      // Mock读取操作失败
      db.key_value_store.get.mockRejectedValueOnce(new Error('Read error'));

      await expect(storageService.getItem(key)).rejects.toThrow('Read error');
    });

    it('应该处理删除操作失败的情况', async () => {
      const key = 'error_delete_key';

      // Mock删除操作失败
      db.key_value_store.delete.mockRejectedValueOnce(new Error('Delete error'));

      await expect(storageService.removeItem(key)).rejects.toThrow('Delete error');
    });

    it('应该处理清空操作失败的情况', async () => {
      // Mock清空操作失败
      db.key_value_store.clear.mockRejectedValueOnce(new Error('Clear error'));

      await expect(storageService.clear()).rejects.toThrow('Clear error');
    });

    it('应该处理特殊字符键名', async () => {
      const specialKeys = [
        'key-with-dashes',
        'key_with_underscores',
        'key.with.dots',
        'key with spaces',
        'key@with#special$chars%',
        '中文键名',
        'key/with/slashes',
        'key\\with\\backslashes'
      ];

      for (const key of specialKeys) {
        const value = `value for ${key}`;
        await storageService.setItem(key, value);
        const retrieved = await storageService.getItem(key);
        expect(retrieved).toBe(value);
      }
    });

    it('应该处理极长的键名', async () => {
      const longKey = 'a'.repeat(1000);
      const value = 'value for long key';

      await storageService.setItem(longKey, value);
      const retrieved = await storageService.getItem(longKey);

      expect(retrieved).toBe(value);
    });

    it('应该维护数据一致性', async () => {
      const key = 'consistency_key';
      const operations = [
        () => storageService.setItem(key, 'value1'),
        () => storageService.setItem(key, 'value2'),
        () => storageService.getItem(key),
        () => storageService.setItem(key, { object: 'value' }),
        () => storageService.getItem(key),
        () => storageService.removeItem(key),
        () => storageService.getItem(key)
      ];

      // 顺序执行操作
      const results = [];
      for (const operation of operations) {
        results.push(await operation());
      }

      // 验证最终状态
      expect(results[results.length - 1]).toBeNull(); // 最后应该是null（已删除）
    });
  });

  describe('Performance and Scalability', () => {
    it('应该处理大量并发操作', async () => {
      const concurrentOperations = 100;
      const promises = [];

      // 创建大量并发操作
      for (let i = 0; i < concurrentOperations; i++) {
        promises.push(
          storageService.setItem(`concurrent_${i}`, { id: i, data: `data_${i}` })
        );
      }

      // 等待所有操作完成
      await Promise.all(promises);

      // 验证所有数据都正确存储
      for (let i = 0; i < concurrentOperations; i++) {
        const retrieved = await storageService.getItem(`concurrent_${i}`);
        expect(retrieved).toEqual({ id: i, data: `data_${i}` });
      }

      expect(db.key_value_store.put).toHaveBeenCalledTimes(concurrentOperations);
    });

    it('应该处理大型数据对象', async () => {
      const key = 'large_object_key';
      const largeObject = {
        metadata: {
          id: 'large_object_test',
          created: new Date().toISOString(),
          version: '1.0.0'
        },
        data: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a description for item ${i}`.repeat(5),
          tags: [`tag${i}`, `category${i % 10}`, `type${i % 3}`],
          metadata: {
            created: new Date(Date.now() - i * 1000).toISOString(),
            updated: new Date().toISOString(),
            version: Math.floor(i / 100) + 1
          }
        }))
      };

      const startTime = Date.now();
      await storageService.setItem(key, largeObject);
      const setTime = Date.now() - startTime;

      const getStartTime = Date.now();
      const retrieved = await storageService.getItem(key);
      const getTime = Date.now() - getStartTime;

      expect(retrieved).toEqual(largeObject);
      expect(retrieved.data).toHaveLength(5000);
      
      // 性能断言（这些值可能需要根据实际环境调整）
      expect(setTime).toBeLessThan(1000); // 设置操作应在1秒内完成
      expect(getTime).toBeLessThan(500);  // 获取操作应在0.5秒内完成
    });
  });
});