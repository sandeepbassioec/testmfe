import { RequestHandler } from 'express';
import { getGlobalRegistry } from '@shared/mfe';
import type { RegistryListResponse, RegistryEntryResponse } from '@shared/api';

const registry = getGlobalRegistry();

/**
 * GET /api/mfe/registry
 * List all registered MFEs
 */
export const listRegistry: RequestHandler = (req, res) => {
  try {
    const entries = registry.getAll();

    const response: RegistryListResponse = {
      entries: entries.map(entry => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        version: entry.version,
        tags: entry.tags,
        icon: entry.icon,
      })),
      total: entries.length,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/mfe/registry/:id
 * Get specific MFE entry
 */
export const getRegistryEntry: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const entry = registry.get(id);

    if (!entry) {
      return res.status(404).json({
        error: `MFE ${id} not found in registry`,
      });
    }

    const response: RegistryEntryResponse = {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      version: entry.version,
      scope: entry.scope,
      module: entry.module,
      tags: entry.tags,
      icon: entry.icon,
      config: {
        id: entry.config.id,
        scope: entry.config.scope,
        module: entry.config.module,
        remoteEntry: entry.config.remoteEntry,
        exposes: entry.config.exposes,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/mfe/registry/search?q=...
 * Search MFEs
 */
export const searchRegistry: RequestHandler = (req, res) => {
  try {
    const { q, tag } = req.query;
    let results = registry.getAll();

    if (tag && typeof tag === 'string') {
      results = results.filter(e => e.tags.includes(tag));
    }

    if (q && typeof q === 'string') {
      results = registry.search(q);
    }

    const response: RegistryListResponse = {
      entries: results.map(entry => ({
        id: entry.id,
        name: entry.name,
        description: entry.description,
        version: entry.version,
        tags: entry.tags,
        icon: entry.icon,
      })),
      total: results.length,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/mfe/registry/tags
 * Get all unique tags
 */
export const getRegistryTags: RequestHandler = (req, res) => {
  try {
    const tags = registry.getTags();
    res.json({ tags });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
