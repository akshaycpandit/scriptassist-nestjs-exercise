import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { formatError } from 'src/utils/error.util';
// Inefficient in-memory cache implementation with multiple problems:
// 1. No distributed cache support (fails in multi-instance deployments)
// 2. No memory limits or LRU eviction policy
// 3. No automatic key expiration cleanup (memory leak)
// 4. No serialization/deserialization handling for complex objects
// 5. No namespacing to prevent key collisions

@Injectable()
export class CacheService {
  // Using a simple object as cache storage
  // Problem: Unbounded memory growth with no eviction
  // private cache: Record<string, { value: any; expiresAt: number }> = {};
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}
  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    this.validateKey(key);
     
    try {
      await this.cacheManager.set(key, value, ttlSeconds);
      this.logger.debug(`Cache set: ${key} (expires in ${ttlSeconds}s)`);
    } catch (err) {
      this.logger.error(`Failed to set cache for key: ${key}: ${formatError(err)}`);
      throw err;
    }
    // Inefficient set operation with no validation
    // Problem: No key validation or sanitization
    // Problem: Directly stores references without cloning (potential memory issues)
    // Problem: No error handling for invalid values
    // Problem: No namespacing for keys
    // this.cache[key] = {
    //   value,
    //   expiresAt,
    // };
    // Problem: No logging or monitoring of cache usage
  }

  // Inefficient get operation that doesn't handle errors properly
  async get<T>(key: string): Promise<T | null> {
    this.validateKey(key);

    try {
      const value = await this.cacheManager.get<T>(key);
      if (value === null) {
        this.logger.debug(`Cache miss: ${key}`);
      }
      return value ?? null;
    } catch (err) {
      this.logger.error(`Failed to get cache for key: ${key}: ${formatError(err)}`);
      throw err;
    }
    // Problem: No key validation
    // const item = this.cache[key];
    // if (!item) {
      //   return null;
      // }
      // Problem: Checking expiration on every get (performance issue)
    // Rather than having a background job to clean up expired items
    // if (item.expiresAt < Date.now()) {
      // Problem: Inefficient immediate deletion during read operations
      // delete this.cache[key];
      // return null;
    // }
    
    // Problem: Returns direct object reference rather than cloning
    // This can lead to unintended cache modifications when the returned
    // object is modified by the caller
    // return item.value as T;
  }

  // Inefficient delete operation
  async delete(key: string): Promise<boolean> {
    this.validateKey(key);

    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to delete cache for key: ${key}: ${formatError(err)}`);
      throw err;
    }
    // Problem: No validation or error handling
    // const exists = key in this.cache;
    
    // Problem: No logging of cache misses for monitoring
    // if (exists) {
    //   delete this.cache[key];
    //   return true;
    // }
    
    // return false;
  }

  // Inefficient cache clearing
  async clear(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.warn(`Cache cleared`);
    } catch (err) {
      this.logger.error(`Failed to clear cache: ${formatError(err)}`);
      throw err;
    }
    // Problem: Blocking operation that can cause performance issues
    // on large caches
    // this.cache = {};
    
    // Problem: No notification or events when cache is cleared
  }

  // Inefficient method to check if a key exists
  // Problem: Duplicates logic from the get method
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
    // const item = this.cache[key];
    
    // if (!item) {
    //   return false;
    // }
    
    // Problem: Repeating expiration logic instead of having a shared helper
    // if (item.expiresAt < Date.now()) {
    //   delete this.cache[key];
    //   return false;
    // }
    
    // return true;
  }

  private validateKey(key: string): void {
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error('Invalid cache key');
    }
  }
  
  // Problem: Missing methods for bulk operations and cache statistics
  // Problem: No monitoring or instrumentation
} 