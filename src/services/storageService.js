// src/services/storageService.js
import { db } from './db';

/**
 * A service that abstracts the storage mechanism of the application.
 * This implementation uses Dexie.js (IndexedDB).
 */
export const storageService = {
  /**
   * Retrieves an item from the storage.
   * @param {string} key The key of the item to retrieve.
   * @returns {Promise<any>} A promise that resolves with the value, or null if not found.
   */
  async getItem(key) {
    const item = await db.key_value_store.get(key);
    // Dexie returns undefined for non-existent keys. We'll return null to keep API consistent.
    if (item === undefined) {
      return null;
    }
    
    let value = item.value;
    
    // 向后兼容性处理：如果存储的是字符串但看起来像JSON，尝试解析
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        value = JSON.parse(value);
      } catch (error) {
        // 如果解析失败，返回原始字符串
        console.warn(`Failed to parse stored JSON for key "${key}":`, error);
      }
    }
    
    return value;
  },

  /**
   * Saves an item to the storage.
   * @param {string} key The key of the item to save.
   * @param {any} value The value to save.
   * @returns {Promise<void>} A promise that resolves when the item is saved.
   */
  async setItem(key, value) {
    // 如果传入的是JSON字符串，尝试解析为对象存储
    let processedValue = value;
    if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      try {
        processedValue = JSON.parse(value);
        console.warn(`Auto-parsed JSON string for key "${key}". Consider passing objects directly.`);
      } catch (error) {
        // 如果解析失败，存储原始字符串
        processedValue = value;
      }
    }
    
    // The 'put' method will add or replace an item based on the primary key.
    await db.key_value_store.put({ key, value: processedValue });
    
    // 触发自定义事件通知其他组件数据已更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('indexedDBUpdate', {
        detail: { key, value: processedValue }
      }));
    }
  },

  /**
   * Removes an item from the storage.
   * @param {string} key The key of the item to remove.
   * @returns {Promise<void>} A promise that resolves when the item is removed.
   */
  async removeItem(key) {
    await db.key_value_store.delete(key);
    
    // 触发自定义事件通知其他组件数据已删除
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('indexedDBUpdate', {
        detail: { key, action: 'remove' }
      }));
    }
  },

  /**
   * Clears all items from the storage.
   * @returns {Promise<void>} A promise that resolves when the storage is cleared.
   */
  async clear() {
    await db.key_value_store.clear();
    
    // 触发自定义事件通知其他组件数据已清空
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('indexedDBUpdate', {
        detail: { action: 'clear' }
      }));
    }
  }
};
