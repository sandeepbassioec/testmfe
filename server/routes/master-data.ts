import { RequestHandler } from 'express';

// Sample master data
const COUNTRIES = [
  { id: 1, code: 'US', name: 'United States', region: 'North America' },
  { id: 2, code: 'CA', name: 'Canada', region: 'North America' },
  { id: 3, code: 'UK', name: 'United Kingdom', region: 'Europe' },
  { id: 4, code: 'FR', name: 'France', region: 'Europe' },
  { id: 5, code: 'DE', name: 'Germany', region: 'Europe' },
  { id: 6, code: 'JP', name: 'Japan', region: 'Asia' },
  { id: 7, code: 'CN', name: 'China', region: 'Asia' },
  { id: 8, code: 'IN', name: 'India', region: 'Asia' },
  { id: 9, code: 'BR', name: 'Brazil', region: 'South America' },
  { id: 10, code: 'AU', name: 'Australia', region: 'Oceania' },
  { id: 11, code: 'MX', name: 'Mexico', region: 'North America' },
  { id: 12, code: 'ZA', name: 'South Africa', region: 'Africa' },
];

// Version tracking
let dataVersions: Record<string, string> = {
  countries: 'v1.0.0.20240115',
};

/**
 * GET /api/master/countries
 * Get all countries master data with version header
 */
export const getCountries: RequestHandler = (req, res) => {
  try {
    const version = dataVersions.countries;

    // Set version header for client-side sync
    res.setHeader('X-Master-Data-Version', version);
    res.setHeader('Cache-Control', 'max-age=3600'); // 1 hour cache

    res.json({
      data: COUNTRIES,
      version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/countries/:id
 * Get country by ID
 */
export const getCountryById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const country = COUNTRIES.find(c => c.id === parseInt(id));

    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }

    res.setHeader('X-Master-Data-Version', dataVersions.countries);
    res.json(country);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/countries/search?region=...
 * Search countries by region
 */
export const searchCountries: RequestHandler = (req, res) => {
  try {
    const { region } = req.query;

    let results = COUNTRIES;
    if (region && typeof region === 'string') {
      results = COUNTRIES.filter(
        c => c.region.toLowerCase() === region.toLowerCase()
      );
    }

    res.setHeader('X-Master-Data-Version', dataVersions.countries);
    res.json({
      data: results,
      count: results.length,
      version: dataVersions.countries,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/health
 * Get master data health status
 */
export const getMasterDataHealth: RequestHandler = (req, res) => {
  try {
    res.json({
      status: 'healthy',
      tables: {
        countries: {
          recordCount: COUNTRIES.length,
          version: dataVersions.countries,
          lastUpdated: new Date().toISOString(),
          status: 'synced',
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * POST /api/master/sync
 * Trigger manual sync
 */
export const triggerSync: RequestHandler = (req, res) => {
  try {
    const { tables } = req.body;

    // In a real system, this would trigger background sync
    res.json({
      message: 'Sync triggered successfully',
      syncedTables: tables || Object.keys(dataVersions),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
