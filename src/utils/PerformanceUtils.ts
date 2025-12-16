/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceProfile {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceBenchmark {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryUsage: number;
}

export class PerformanceUtils {
  private static profiles: Map<string, PerformanceProfile> = new Map();
  private static benchmarks: PerformanceBenchmark[] = [];

  /**
   * Start performance profiling for an operation
   */
  static startProfile(name: string, metadata?: Record<string, any>): void {
    const profile: PerformanceProfile = {
      name,
      startTime: performance.now(),
      memoryBefore: this.getMemoryUsage(),
      metadata
    };
    
    this.profiles.set(name, profile);
  }

  /**
   * End performance profiling for an operation
   */
  static endProfile(name: string): PerformanceProfile | null {
    const profile = this.profiles.get(name);
    if (!profile) {
      console.warn(`No profile found for: ${name}`);
      return null;
    }

    profile.endTime = performance.now();
    profile.duration = profile.endTime - profile.startTime;
    profile.memoryAfter = this.getMemoryUsage();

    this.profiles.delete(name);
    return profile;
  }

  /**
   * Measure execution time of a function
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; profile: PerformanceProfile }> {
    this.startProfile(name, metadata);
    
    try {
      const result = await fn();
      const profile = this.endProfile(name)!;
      return { result, profile };
    } catch (error) {
      this.endProfile(name);
      throw error;
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  static measure<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; profile: PerformanceProfile } {
    this.startProfile(name, metadata);
    
    try {
      const result = fn();
      const profile = this.endProfile(name)!;
      return { result, profile };
    } catch (error) {
      this.endProfile(name);
      throw error;
    }
  }

  /**
   * Benchmark a function by running it multiple times
   */
  static async benchmarkAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    iterations: number = 100
  ): Promise<PerformanceBenchmark> {
    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = this.getMemoryUsage();
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    
    const benchmark: PerformanceBenchmark = {
      operation,
      iterations,
      totalTime,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      memoryUsage: memoryAfter - memoryBefore
    };

    this.benchmarks.push(benchmark);
    return benchmark;
  }

  /**
   * Benchmark a synchronous function
   */
  static benchmark<T>(
    operation: string,
    fn: () => T,
    iterations: number = 100
  ): PerformanceBenchmark {
    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = this.getMemoryUsage();
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    
    const benchmark: PerformanceBenchmark = {
      operation,
      iterations,
      totalTime,
      averageTime: totalTime / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      memoryUsage: memoryAfter - memoryBefore
    };

    this.benchmarks.push(benchmark);
    return benchmark;
  }

  /**
   * Get current memory usage (simplified for React Native)
   */
  static getMemoryUsage(): number {
    // In React Native, we don't have direct access to process.memoryUsage()
    // This is a simplified implementation
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    // Fallback for React Native environment
    return 0;
  }

  /**
   * Get all performance benchmarks
   */
  static getBenchmarks(): PerformanceBenchmark[] {
    return [...this.benchmarks];
  }

  /**
   * Clear all benchmarks
   */
  static clearBenchmarks(): void {
    this.benchmarks = [];
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    totalBenchmarks: number;
    averageExecutionTime: number;
    slowestOperation: string | null;
    fastestOperation: string | null;
  } {
    if (this.benchmarks.length === 0) {
      return {
        totalBenchmarks: 0,
        averageExecutionTime: 0,
        slowestOperation: null,
        fastestOperation: null
      };
    }

    const totalTime = this.benchmarks.reduce((sum, b) => sum + b.averageTime, 0);
    const averageExecutionTime = totalTime / this.benchmarks.length;

    const slowest = this.benchmarks.reduce((prev, current) => 
      prev.averageTime > current.averageTime ? prev : current
    );

    const fastest = this.benchmarks.reduce((prev, current) => 
      prev.averageTime < current.averageTime ? prev : current
    );

    return {
      totalBenchmarks: this.benchmarks.length,
      averageExecutionTime,
      slowestOperation: slowest.operation,
      fastestOperation: fastest.operation
    };
  }

  /**
   * Throttle function execution
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;

    return (...args: Parameters<T>) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Debounce function execution
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  /**
   * Memoize function results for performance
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();

    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Create a performance-optimized batch processor
   */
  static createBatchProcessor<T, R>(
    processor: (items: T[]) => Promise<R[]>,
    batchSize: number = 50,
    delay: number = 100
  ): {
    add: (item: T) => Promise<R>;
    flush: () => Promise<void>;
    clear: () => void;
  } {
    let batch: T[] = [];
    let resolvers: Array<(result: R) => void> = [];
    let rejecters: Array<(error: any) => void> = [];
    let timeoutId: NodeJS.Timeout | null = null;

    const processBatch = async () => {
      if (batch.length === 0) return;

      const currentBatch = [...batch];
      const currentResolvers = [...resolvers];
      const currentRejecters = [...rejecters];

      batch = [];
      resolvers = [];
      rejecters = [];

      try {
        const results = await processor(currentBatch);
        results.forEach((result, index) => {
          currentResolvers[index](result);
        });
      } catch (error) {
        currentRejecters.forEach(reject => reject(error));
      }
    };

    const scheduleProcessing = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(processBatch, delay);
    };

    return {
      add: (item: T): Promise<R> => {
        return new Promise<R>((resolve, reject) => {
          batch.push(item);
          resolvers.push(resolve);
          rejecters.push(reject);

          if (batch.length >= batchSize) {
            processBatch();
          } else {
            scheduleProcessing();
          }
        });
      },

      flush: async (): Promise<void> => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        await processBatch();
      },

      clear: (): void => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        batch = [];
        resolvers = [];
        rejecters = [];
      }
    };
  }
}