// src/services/__tests__/setup.js
import { vi } from 'vitest';

// 全局测试设置
beforeEach(() => {
  // 清理所有mock
  vi.clearAllMocks();
  
  // 重置所有定时器
  vi.clearAllTimers();
  
  // 清理console spy
  if (console.log.mockRestore) {
    console.log.mockRestore();
  }
  if (console.error.mockRestore) {
    console.error.mockRestore();
  }
  if (console.warn.mockRestore) {
    console.warn.mockRestore();
  }
});

afterEach(() => {
  // 清理所有mock
  vi.clearAllMocks();
  
  // 恢复所有定时器
  vi.useRealTimers();
});

// 全局mock IndexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn()
};

// Mock IDBKeyRange
global.IDBKeyRange = {
  bound: vi.fn(),
  only: vi.fn(),
  lowerBound: vi.fn(),
  upperBound: vi.fn()
};

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
};

// 设置测试环境变量
process.env.NODE_ENV = 'test';