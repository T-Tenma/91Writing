// src/services/storageService.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the db module
vi.mock('./db', () => {
  // This is an in-memory simulation of our Dexie table
  const memoryStore = new Map();

  const mockTable = {
    get: vi.fn(key => Promise.resolve(memoryStore.get(key))),
    put: vi.fn(item => {
      memoryStore.set(item.key, item);
      return Promise.resolve();
    }),
    delete: vi.fn(key => {
      memoryStore.delete(key);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      memoryStore.clear();
      return Promise.resolve();
    }),
  };

  return {
    db: {
      key_value_store: mockTable,
      // A helper to clear the store for our tests
      _clearMemoryStore: () => memoryStore.clear(),
    },
  };
});

// Now we can import the service and the mocked db
import { storageService } from './storageService';
import { db } from './db';

describe('StorageService (Dexie implementation)', () => {

  // Before each test, clear the in-memory store
  beforeEach(() => {
    // We call the helper we defined in the mock
    db._clearMemoryStore();
    // Also clear mocks call history
    vi.clearAllMocks();
  });

  it('should set and get an object', async () => {
    const testKey = 'user_profile';
    const testData = { name: 'Alex', level: 99 };

    await storageService.setItem(testKey, testData);
    const retrievedData = await storageService.getItem(testKey);

    // Check if the correct Dexie method was called
    expect(db.key_value_store.put).toHaveBeenCalledWith({ key: testKey, value: testData });
    expect(retrievedData).toEqual(testData);
  });

  it('should set and get a string', async () => {
    const testKey = 'session_token';
    const testData = 'abc-123-xyz';

    await storageService.setItem(testKey, testData);
    const retrievedData = await storageService.getItem(testKey);

    expect(db.key_value_store.put).toHaveBeenCalledWith({ key: testKey, value: testData });
    expect(retrievedData).toBe(testData);
  });

  it('should return null for a non-existent key', async () => {
    const retrievedData = await storageService.getItem('non_existent_key');
    expect(db.key_value_store.get).toHaveBeenCalledWith('non_existent_key');
    expect(retrievedData).toBeNull();
  });

  it('should remove an item', async () => {
    const testKey = 'item_to_remove';
    const testData = { temporary: true };

    await storageService.setItem(testKey, testData);
    await storageService.removeItem(testKey);
    const retrievedData = await storageService.getItem(testKey);

    expect(db.key_value_store.delete).toHaveBeenCalledWith(testKey);
    expect(retrievedData).toBeNull();
  });

  it('should clear all items', async () => {
    await storageService.setItem('key1', 'value1');
    await storageService.setItem('key2', { id: 2 });

    await storageService.clear();

    expect(db.key_value_store.clear).toHaveBeenCalled();

    const data1 = await storageService.getItem('key1');
    const data2 = await storageService.getItem('key2');

    expect(data1).toBeNull();
    expect(data2).toBeNull();
  });

  // 新增的错误处理和边界情况测试
  it('should handle null and undefined values', async () => {
    const testKey = 'null_test';

    // 测试存储null值
    await storageService.setItem(testKey, null);
    const nullResult = await storageService.getItem(testKey);
    expect(nullResult).toBeNull();

    // 测试存储undefined值
    await storageService.setItem(testKey, undefined);
    const undefinedResult = await storageService.getItem(testKey);
    expect(undefinedResult).toBeUndefined();
  });

  it('should handle complex nested objects', async () => {
    const testKey = 'complex_object';
    const complexData = {
      user: {
        id: 123,
        profile: {
          name: 'Test User',
          settings: {
            theme: 'dark',
            notifications: true,
            preferences: ['option1', 'option2']
          }
        }
      },
      metadata: {
        created: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    await storageService.setItem(testKey, complexData);
    const retrievedData = await storageService.getItem(testKey);

    expect(retrievedData).toEqual(complexData);
    expect(retrievedData.user.profile.settings.preferences).toHaveLength(2);
  });

  it('should handle array data', async () => {
    const testKey = 'array_test';
    const arrayData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    await storageService.setItem(testKey, arrayData);
    const retrievedData = await storageService.getItem(testKey);

    expect(retrievedData).toEqual(arrayData);
    expect(Array.isArray(retrievedData)).toBe(true);
    expect(retrievedData).toHaveLength(3);
  });

  it('should handle empty string and zero values', async () => {
    // 测试空字符串
    await storageService.setItem('empty_string', '');
    const emptyString = await storageService.getItem('empty_string');
    expect(emptyString).toBe('');

    // 测试数字0
    await storageService.setItem('zero_value', 0);
    const zeroValue = await storageService.getItem('zero_value');
    expect(zeroValue).toBe(0);

    // 测试布尔值false
    await storageService.setItem('false_value', false);
    const falseValue = await storageService.getItem('false_value');
    expect(falseValue).toBe(false);
  });

  it('should handle special characters in keys', async () => {
    const specialKeys = [
      'key-with-dashes',
      'key_with_underscores',
      'key.with.dots',
      'key with spaces',
      'key@with#special$chars'
    ];

    for (const key of specialKeys) {
      const testValue = `value for ${key}`;
      await storageService.setItem(key, testValue);
      const retrievedValue = await storageService.getItem(key);
      expect(retrievedValue).toBe(testValue);
    }
  });

  it('should handle concurrent operations', async () => {
    const promises = [];
    const testData = {};

    // 创建多个并发操作
    for (let i = 0; i < 10; i++) {
      const key = `concurrent_key_${i}`;
      const value = `concurrent_value_${i}`;
      testData[key] = value;
      promises.push(storageService.setItem(key, value));
    }

    // 等待所有操作完成
    await Promise.all(promises);

    // 验证所有数据都正确存储
    for (const [key, expectedValue] of Object.entries(testData)) {
      const retrievedValue = await storageService.getItem(key);
      expect(retrievedValue).toBe(expectedValue);
    }
  });

  it('should maintain data consistency after multiple operations', async () => {
    const testKey = 'consistency_test';

    // 初始设置
    await storageService.setItem(testKey, 'initial');
    expect(await storageService.getItem(testKey)).toBe('initial');

    // 更新值
    await storageService.setItem(testKey, 'updated');
    expect(await storageService.getItem(testKey)).toBe('updated');

    // 再次更新
    await storageService.setItem(testKey, { complex: 'object' });
    const finalValue = await storageService.getItem(testKey);
    expect(finalValue).toEqual({ complex: 'object' });

    // 删除
    await storageService.removeItem(testKey);
    expect(await storageService.getItem(testKey)).toBeNull();
  });
});
