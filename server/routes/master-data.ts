import { RequestHandler } from 'express';

// Sample master data - Countries
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

// Sample master data - Regions
const REGIONS = [
  { id: 1, code: 'NA', name: 'North America', continent: 'America' },
  { id: 2, code: 'SA', name: 'South America', continent: 'America' },
  { id: 3, code: 'EU', name: 'Europe', continent: 'Europe' },
  { id: 4, code: 'AS', name: 'Asia', continent: 'Asia' },
  { id: 5, code: 'AF', name: 'Africa', continent: 'Africa' },
  { id: 6, code: 'OC', name: 'Oceania', continent: 'Oceania' },
];

// Sample master data - Departments
const DEPARTMENTS = [
  { id: 1, code: 'ENG', name: 'Engineering', budget: 500000, status: 'active' },
  { id: 2, code: 'SAL', name: 'Sales', budget: 300000, status: 'active' },
  { id: 3, code: 'MKT', name: 'Marketing', budget: 200000, status: 'active' },
  { id: 4, code: 'HR', name: 'Human Resources', budget: 150000, status: 'active' },
  { id: 5, code: 'FIN', name: 'Finance', budget: 250000, status: 'active' },
  { id: 6, code: 'OPS', name: 'Operations', budget: 350000, status: 'active' },
];

// Sample master data - Employees
const EMPLOYEES = [
  { id: 1, name: 'John Smith', email: 'john.smith@company.com', department: 'ENG', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'SAL', status: 'active' },
  { id: 3, name: 'Mike Brown', email: 'mike.brown@company.com', department: 'MKT', status: 'active' },
  { id: 4, name: 'Emily Davis', email: 'emily.davis@company.com', department: 'HR', status: 'active' },
  { id: 5, name: 'Robert Wilson', email: 'robert.wilson@company.com', department: 'FIN', status: 'active' },
  { id: 6, name: 'Jessica Martinez', email: 'jessica.martinez@company.com', department: 'ENG', status: 'active' },
  { id: 7, name: 'David Lee', email: 'david.lee@company.com', department: 'OPS', status: 'active' },
  { id: 8, name: 'Lisa Anderson', email: 'lisa.anderson@company.com', department: 'SAL', status: 'inactive' },
];

// Version tracking
let dataVersions: Record<string, string> = {
  countries: 'v1.0.0.20240115',
  regions: 'v1.0.0.20240115',
  departments: 'v1.0.0.20240115',
  employees: 'v1.0.0.20240115',
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

    // Return the array directly - the HttpApi client will handle the response
    res.json(COUNTRIES);
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
    // Return the array directly
    res.json(results);
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
        regions: {
          recordCount: REGIONS.length,
          version: dataVersions.regions,
          lastUpdated: new Date().toISOString(),
          status: 'synced',
        },
        departments: {
          recordCount: DEPARTMENTS.length,
          version: dataVersions.departments,
          lastUpdated: new Date().toISOString(),
          status: 'synced',
        },
        employees: {
          recordCount: EMPLOYEES.length,
          version: dataVersions.employees,
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

/**
 * GET /api/master/regions
 * Get all regions master data
 */
export const getRegions: RequestHandler = (req, res) => {
  try {
    const version = dataVersions.regions;
    res.setHeader('X-Master-Data-Version', version);
    res.setHeader('Cache-Control', 'max-age=3600');
    res.json(REGIONS);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/regions/:id
 * Get region by ID
 */
export const getRegionById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const region = REGIONS.find(r => r.id === parseInt(id));

    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    res.setHeader('X-Master-Data-Version', dataVersions.regions);
    res.json(region);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/departments
 * Get all departments master data
 */
export const getDepartments: RequestHandler = (req, res) => {
  try {
    const version = dataVersions.departments;
    res.setHeader('X-Master-Data-Version', version);
    res.setHeader('Cache-Control', 'max-age=3600');
    res.json(DEPARTMENTS);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/departments/:id
 * Get department by ID
 */
export const getDepartmentById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const dept = DEPARTMENTS.find(d => d.id === parseInt(id));

    if (!dept) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.setHeader('X-Master-Data-Version', dataVersions.departments);
    res.json(dept);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/employees
 * Get all employees master data
 */
export const getEmployees: RequestHandler = (req, res) => {
  try {
    const version = dataVersions.employees;
    res.setHeader('X-Master-Data-Version', version);
    res.setHeader('Cache-Control', 'max-age=3600');
    res.json(EMPLOYEES);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/employees/:id
 * Get employee by ID
 */
export const getEmployeeById: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const emp = EMPLOYEES.find(e => e.id === parseInt(id));

    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.setHeader('X-Master-Data-Version', dataVersions.employees);
    res.json(emp);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * GET /api/master/employees/search?department=...
 * Search employees by department
 */
export const searchEmployees: RequestHandler = (req, res) => {
  try {
    const { department, status } = req.query;

    let results = EMPLOYEES;
    if (department && typeof department === 'string') {
      results = results.filter(e => e.department === department.toUpperCase());
    }
    if (status && typeof status === 'string') {
      results = results.filter(e => e.status === status);
    }

    res.setHeader('X-Master-Data-Version', dataVersions.employees);
    res.json(results);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};
