/**
 * Advanced Querying System for Master Data
 * Supports filtering, searching, aggregation, and sorting
 */

import type { MasterTableData } from './types';

// Query Types
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'between';
export type SortDirection = 'asc' | 'desc';
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct' | 'group';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  caseSensitive?: boolean;
}

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export interface AggregationOption {
  type: AggregationType;
  field: string;
  groupBy?: string;
}

export interface AdvancedQueryOptions {
  filters?: FilterCondition[];
  search?: {
    query: string;
    fields?: string[];
    caseSensitive?: boolean;
  };
  sort?: SortOption[];
  pagination?: {
    page: number;
    pageSize: number;
  };
  aggregation?: AggregationOption;
  includeStats?: boolean;
}

export interface QueryResult<T extends MasterTableData> {
  data: T[];
  totalCount: number;
  filteredCount: number;
  page?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  stats?: QueryStatistics;
  executionTime?: number;
}

export interface QueryStatistics {
  filterCount: number;
  sortCount: number;
  searchQuery?: string;
  aggregationResult?: any;
}

class AdvancedQuery {
  /**
   * Execute advanced query on data
   */
  static execute<T extends MasterTableData>(
    data: T[],
    options: AdvancedQueryOptions
  ): QueryResult<T> {
    const startTime = performance.now();
    let result = [...data];
    const totalCount = data.length;

    // Step 1: Apply filters
    if (options.filters && options.filters.length > 0) {
      result = this._applyFilters(result, options.filters);
    }

    // Step 2: Apply search
    if (options.search) {
      result = this._applySearch(result, options.search);
    }

    const filteredCount = result.length;

    // Step 3: Apply aggregation (if specified)
    let aggregationResult: any = null;
    if (options.aggregation) {
      aggregationResult = this._applyAggregation(result, options.aggregation);
    }

    // Step 4: Apply sorting
    if (options.sort && options.sort.length > 0) {
      result = this._applySort(result, options.sort);
    }

    // Step 5: Apply pagination
    let page = 1;
    let pageSize = result.length;
    let hasNextPage = false;

    if (options.pagination) {
      const { page: p, pageSize: ps } = options.pagination;
      page = Math.max(1, p);
      pageSize = ps > 0 ? ps : result.length;

      const startIdx = (page - 1) * pageSize;
      const endIdx = startIdx + pageSize;

      result = result.slice(startIdx, endIdx);
      hasNextPage = endIdx < filteredCount;
    }

    const executionTime = performance.now() - startTime;

    return {
      data: result,
      totalCount,
      filteredCount,
      page: options.pagination ? page : undefined,
      pageSize: options.pagination ? pageSize : undefined,
      hasNextPage: options.pagination ? hasNextPage : undefined,
      stats: options.includeStats ? {
        filterCount: options.filters?.length || 0,
        sortCount: options.sort?.length || 0,
        searchQuery: options.search?.query,
        aggregationResult,
      } : undefined,
      executionTime,
    };
  }

  /**
   * Apply filter conditions
   */
  private static _applyFilters<T extends MasterTableData>(
    data: T[],
    filters: FilterCondition[]
  ): T[] {
    return data.filter(item => {
      return filters.every(filter => this._matchesCondition(item, filter));
    });
  }

  /**
   * Check if item matches a single filter condition
   */
  private static _matchesCondition<T extends MasterTableData>(
    item: T,
    condition: FilterCondition
  ): boolean {
    const value = this._getNestedValue(item, condition.field);

    switch (condition.operator) {
      case 'eq':
        return value === condition.value;

      case 'ne':
        return value !== condition.value;

      case 'gt':
        return value > condition.value;

      case 'gte':
        return value >= condition.value;

      case 'lt':
        return value < condition.value;

      case 'lte':
        return value <= condition.value;

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);

      case 'nin':
        return !Array.isArray(condition.value) || !condition.value.includes(value);

      case 'contains': {
        const str = String(value).toLowerCase();
        const search = String(condition.value).toLowerCase();
        return str.includes(search);
      }

      case 'startsWith': {
        const str = String(value);
        const search = String(condition.value);
        const cs = condition.caseSensitive ?? false;
        return cs ? str.startsWith(search) : str.toLowerCase().startsWith(search.toLowerCase());
      }

      case 'endsWith': {
        const str = String(value);
        const search = String(condition.value);
        const cs = condition.caseSensitive ?? false;
        return cs ? str.endsWith(search) : str.toLowerCase().endsWith(search.toLowerCase());
      }

      case 'regex': {
        try {
          const regex = new RegExp(condition.value, condition.caseSensitive ? '' : 'i');
          return regex.test(String(value));
        } catch {
          return false;
        }
      }

      case 'between': {
        if (!Array.isArray(condition.value) || condition.value.length !== 2) {
          return false;
        }
        const [min, max] = condition.value;
        return value >= min && value <= max;
      }

      default:
        return true;
    }
  }

  /**
   * Apply search across multiple fields
   */
  private static _applySearch<T extends MasterTableData>(
    data: T[],
    search: { query: string; fields?: string[]; caseSensitive?: boolean }
  ): T[] {
    const query = search.caseSensitive
      ? search.query
      : search.query.toLowerCase();

    return data.filter(item => {
      const fieldsToSearch = search.fields || Object.keys(item);

      return fieldsToSearch.some(field => {
        const value = String(this._getNestedValue(item, field));
        const searchValue = search.caseSensitive ? value : value.toLowerCase();
        return searchValue.includes(query);
      });
    });
  }

  /**
   * Apply sorting
   */
  private static _applySort<T extends MasterTableData>(
    data: T[],
    sortOptions: SortOption[]
  ): T[] {
    const sorted = [...data];

    sorted.sort((a, b) => {
      for (const sort of sortOptions) {
        const aVal = this._getNestedValue(a, sort.field);
        const bVal = this._getNestedValue(b, sort.field);

        let comparison = 0;
        if (aVal < bVal) {
          comparison = -1;
        } else if (aVal > bVal) {
          comparison = 1;
        }

        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }

      return 0;
    });

    return sorted;
  }

  /**
   * Apply aggregation
   */
  private static _applyAggregation<T extends MasterTableData>(
    data: T[],
    aggregation: AggregationOption
  ): any {
    const field = aggregation.field;

    switch (aggregation.type) {
      case 'count':
        return data.length;

      case 'sum': {
        return data.reduce((sum, item) => {
          const val = this._getNestedValue(item, field);
          return sum + (typeof val === 'number' ? val : 0);
        }, 0);
      }

      case 'avg': {
        if (data.length === 0) return 0;
        const sum = data.reduce((s, item) => {
          const val = this._getNestedValue(item, field);
          return s + (typeof val === 'number' ? val : 0);
        }, 0);
        return sum / data.length;
      }

      case 'min': {
        return data.reduce((min, item) => {
          const val = this._getNestedValue(item, field);
          return val < min ? val : min;
        }, Infinity);
      }

      case 'max': {
        return data.reduce((max, item) => {
          const val = this._getNestedValue(item, field);
          return val > max ? val : max;
        }, -Infinity);
      }

      case 'distinct': {
        const values = new Set<any>();
        data.forEach(item => {
          values.add(this._getNestedValue(item, field));
        });
        return Array.from(values);
      }

      case 'group': {
        if (!aggregation.groupBy) return null;

        const groups: Record<string, T[]> = {};
        data.forEach(item => {
          const key = String(this._getNestedValue(item, aggregation.groupBy!));
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
        });

        return Object.entries(groups).map(([key, items]) => ({
          [aggregation.groupBy!]: key,
          count: items.length,
          items,
        }));
      }

      default:
        return null;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private static _getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Create filter from simple object
   */
  static createFilter(obj: Record<string, any>): FilterCondition[] {
    return Object.entries(obj).map(([field, value]) => ({
      field,
      operator: 'eq' as FilterOperator,
      value,
    }));
  }

  /**
   * Create sort from array
   */
  static createSort(sortArray: Array<[string, SortDirection]>): SortOption[] {
    return sortArray.map(([field, direction]) => ({
      field,
      direction,
    }));
  }

  /**
   * Validate query options
   */
  static validate(options: AdvancedQueryOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate filters
    if (options.filters) {
      options.filters.forEach((filter, idx) => {
        if (!filter.field) {
          errors.push(`Filter ${idx}: field is required`);
        }
        if (!filter.operator) {
          errors.push(`Filter ${idx}: operator is required`);
        }
      });
    }

    // Validate pagination
    if (options.pagination) {
      if (options.pagination.page < 1) {
        errors.push('Pagination: page must be >= 1');
      }
      if (options.pagination.pageSize < 1) {
        errors.push('Pagination: pageSize must be >= 1');
      }
    }

    // Validate aggregation
    if (options.aggregation) {
      if (!options.aggregation.field) {
        errors.push('Aggregation: field is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export { AdvancedQuery };
