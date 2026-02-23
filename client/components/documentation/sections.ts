export type DocElementType =
  | 'heading'
  | 'subheading'
  | 'paragraph'
  | 'list'
  | 'code'
  | 'info'
  | 'warning'
  | 'success'
  | 'important'
  | 'table'
  | 'steps';

export interface DocElement {
  type: DocElementType;
  content: string | string[] | string[][];
  language?: string;
  title?: string;
}

export interface DocumentationSection {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  elements: DocElement[];
  relatedSections?: string[];
}

export const DOCUMENTATION_SECTIONS: DocumentationSection[] = [
  {
    id: 'intro',
    title: 'Welcome to MFE Framework',
    subtitle: 'Getting Started',
    description: 'An enterprise-grade Micro Frontend Framework for building scalable applications',
    elements: [
      {
        type: 'heading',
        content: 'What is a Micro Frontend?',
      },
      {
        type: 'paragraph',
        content:
          'A Micro Frontend is a modular application component that can be independently developed, tested, and deployed. This framework allows you to build multiple independent MFEs that can be dynamically loaded into a host application.',
      },
      {
        type: 'paragraph',
        content:
          'Think of it like building with LEGO blocks - each piece is independent, but they all connect together to form something larger.',
      },
      {
        type: 'subheading',
        content: 'Key Benefits',
      },
      {
        type: 'list',
        content: [
          'Independent Development: Multiple teams can work on different MFEs simultaneously',
          'Scalable Architecture: Add new features without touching existing code',
          'Technology Flexibility: Use different tech stacks if needed',
          'Easy Testing: Test each MFE independently',
          'Fast Deployment: Deploy individual MFEs without full application rebuild',
        ],
      },
      {
        type: 'success',
        content: 'This framework provides everything you need: Module Loader, Event Bus, Registry, HTTP API Framework, and a complete Runtime Manager.',
      },
      {
        type: 'subheading',
        content: 'What You Will Learn',
      },
      {
        type: 'list',
        content: [
          'How to set up the development environment',
          'How to create your first MFE',
          'How to communicate between MFEs using Event Bus',
          'How to use the Registry for discovery',
          'How to make API calls with the HTTP Framework',
          'How to deploy your MFEs to production',
        ],
      },
    ],
    relatedSections: ['prerequisites', 'setup'],
  },

  {
    id: 'prerequisites',
    title: 'Prerequisites & Installation',
    subtitle: 'Getting Ready',
    description: 'Everything you need before starting MFE development',
    elements: [
      {
        type: 'heading',
        content: 'System Requirements',
      },
      {
        type: 'table',
        content: [
          ['Requirement', 'Version', 'Why?'],
          ['Node.js', 'v18+', 'Runtime for development and build'],
          ['pnpm', 'v10+', 'Fast package manager'],
          ['Git', 'Latest', 'Version control'],
          ['TypeScript', 'v5+', 'Type safety'],
          ['React', 'v18+', 'UI framework'],
        ],
      },
      {
        type: 'subheading',
        content: 'Verify Your Installation',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Check versions',
        content: `# Check Node.js version (should be v18+)
node --version

# Check pnpm version (should be v10+)
pnpm --version

# Check Git version
git --version

# All should output versions without errors`,
      },
      {
        type: 'info',
        content: 'If any command is not found, please install that tool first.',
      },
      {
        type: 'subheading',
        content: 'Basic Knowledge Required',
      },
      {
        type: 'list',
        content: [
          'React fundamentals (hooks, components, JSX)',
          'TypeScript basics (types, interfaces, generics)',
          'JavaScript async/await and Promises',
          'Terminal/Command line basics',
          'Git basic commands (clone, commit, push)',
        ],
      },
      {
        type: 'success',
        content: 'Once you have these prerequisites, you\'re ready to start building!',
      },
    ],
    relatedSections: ['setup'],
  },

  {
    id: 'setup',
    title: 'Project Setup & Installation',
    subtitle: 'Step 1: Setup',
    description: 'Clone the repository and install dependencies',
    elements: [
      {
        type: 'steps',
        content: [
          'Clone or download the MFE Framework repository',
          'Navigate to the project directory',
          'Install all dependencies using pnpm',
          'Verify the installation by running tests',
          'Start the development server',
        ],
      },
      {
        type: 'subheading',
        content: 'Step-by-Step Guide',
      },
      {
        type: 'subheading',
        content: 'Step 1: Clone the Repository',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Clone repository',
        content: `# Clone from GitHub
git clone https://github.com/your-org/mfe-framework.git

# Navigate to project
cd mfe-framework

# Or if you downloaded the ZIP file:
unzip mfe-framework.zip
cd mfe-framework`,
      },
      {
        type: 'subheading',
        content: 'Step 2: Install Dependencies',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Install dependencies',
        content: `# Install all dependencies
pnpm install

# This installs:
# - React, TypeScript, Vite
# - Express.js for backend
# - Recharts for visualizations
# - Lucide React icons
# - TailwindCSS for styling
# - And many more...`,
      },
      {
        type: 'info',
        content: 'The first installation may take a few minutes as it downloads all packages.',
      },
      {
        type: 'subheading',
        content: 'Step 3: Verify Installation',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Verify everything works',
        content: `# Run TypeScript type checking
pnpm typecheck

# Should output: No errors found

# Run tests
pnpm test

# Should output: All tests passing

# Or run in watch mode to see the app
pnpm dev`,
      },
      {
        type: 'subheading',
        content: 'Step 4: Start Development Server',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Start dev server',
        content: `# Start the development server
pnpm dev

# Output:
# VITE v7.1.2  ready in 500ms
# ➜  local:   http://localhost:8080/
# ➜  press h + enter to show help

# Open your browser and visit:
# http://localhost:8080`,
      },
      {
        type: 'success',
        content: 'Congratulations! You have successfully set up the MFE Framework. You should see the beautiful homepage with "View Demo" button.',
      },
    ],
    relatedSections: ['first-mfe', 'structure'],
  },

  {
    id: 'first-mfe',
    title: 'Create Your First MFE',
    subtitle: 'Step 2: Your First MFE',
    description: 'Build your first Micro Frontend application from scratch',
    elements: [
      {
        type: 'heading',
        content: 'Creating Your First MFE',
      },
      {
        type: 'paragraph',
        content:
          'In this section, we will create a complete MFE called "Hello MFE" that demonstrates all the core concepts.',
      },
      {
        type: 'steps',
        content: [
          'Create MFE directory structure',
          'Create the MFE React component',
          'Register component in MFEHost',
          'Add to Registry',
          'Test by loading it',
        ],
      },
      {
        type: 'subheading',
        content: 'Step 1: Create Directory Structure',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Create directories',
        content: `# Create the MFE directory
mkdir -p client/components/mfe-samples/HelloMFE

# Navigate to project
cd mfe-framework`,
      },
      {
        type: 'subheading',
        content: 'Step 2: Create the MFE Component',
      },
      {
        type: 'paragraph',
        content: 'Create a new file: client/components/mfe-samples/HelloMFE.tsx',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'HelloMFE.tsx - Complete MFE Component',
        content: `import React, { useEffect } from 'react';
import { getGlobalEventBus } from '@shared/mfe';

interface HelloMFEProps {
  title?: string;
}

const HelloMFE: React.FC<HelloMFEProps> = ({ title = 'Hello MFE' }) => {
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    // Emit event when MFE loads
    eventBus.emit('mfe:hello:loaded', {
      timestamp: new Date().toISOString(),
      message: 'Hello MFE has loaded successfully!',
    });

    // Cleanup on unmount
    return () => {
      eventBus.emit('mfe:hello:unloaded', {
        timestamp: new Date().toISOString(),
      });
    };
  }, [eventBus]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        <p className="text-green-100">
          This is your first Micro Frontend application!
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="font-bold text-gray-900 mb-2">Modular</h3>
          <p className="text-gray-600 text-sm">
            Independently developed and deployed
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-bold text-gray-900 mb-2">Fast</h3>
          <p className="text-gray-600 text-sm">
            Lazy loaded and cached for performance
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-2">🔗</div>
          <h3 className="font-bold text-gray-900 mb-2">Connected</h3>
          <p className="text-gray-600 text-sm">
            Communicate via Event Bus without coupling
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-bold text-green-900 mb-3">✅ MFE Features</h3>
        <ul className="space-y-2 text-green-800">
          <li>✓ Event Bus integration</li>
          <li>✓ Runtime lifecycle management</li>
          <li>✓ Registry discovery</li>
          <li>✓ React component architecture</li>
          <li>✓ TypeScript support</li>
        </ul>
      </div>
    </div>
  );
};

export default HelloMFE;`,
      },
      {
        type: 'subheading',
        content: 'Step 3: Register in MFEHost',
      },
      {
        type: 'paragraph',
        content:
          'Open client/components/MFEHost.tsx and add your component to the componentMap',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Update MFEHost.tsx - Add HelloMFE import',
        content: `// At the top of the file, add this import
import HelloMFE from './mfe-samples/HelloMFE';

// Then find the componentMap and add this line:
const componentMap: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  analytics: Analytics,
  settings: Settings,
  hellomfe: HelloMFE,  // <- Add this line
};`,
      },
      {
        type: 'subheading',
        content: 'Step 4: Register in Registry',
      },
      {
        type: 'paragraph',
        content:
          'Open shared/mfe/registry.ts and add your MFE to SAMPLE_REGISTRY_ENTRIES',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Update registry.ts',
        content: `export const SAMPLE_REGISTRY_ENTRIES: RegistryEntry[] = [
  // ... existing entries ...

  {
    id: 'hellomfe',
    name: 'Hello MFE',
    description: 'My first Micro Frontend application',
    version: '1.0.0',
    scope: 'hellomfe',
    module: './HelloMFE',
    tags: ['hello', 'first', 'tutorial'],
    icon: '👋',
    config: {
      id: 'hellomfe',
      scope: 'hellomfe',
      module: 'hellomfe',
      exposes: {
        './HelloMFE': './src/HelloMFE',
      },
    },
  },
];`,
      },
      {
        type: 'subheading',
        content: 'Step 5: Test Your MFE',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Start dev server',
        content: `# Make sure you're in the project root
cd mfe-framework

# Start development server
pnpm dev

# Open http://localhost:8080 in your browser`,
      },
      {
        type: 'success',
        content: 'Now visit http://localhost:8080, click "View Demo", and you should see your "Hello MFE" in the registry! Click "Load" to load it.',
      },
    ],
    relatedSections: ['structure', 'api-integration'],
  },

  {
    id: 'structure',
    title: 'MFE Project Structure',
    subtitle: 'Step 3: Organization',
    description: 'Best practices for organizing your MFE code',
    elements: [
      {
        type: 'heading',
        content: 'Recommended Directory Layout',
      },
      {
        type: 'code',
        language: 'text',
        title: 'MFE Directory Structure',
        content: `client/components/mfe-samples/
├── YourMFE.tsx              # Main component
├── hooks/
│   ├── useYourData.ts       # Custom hooks
│   └── useYourState.ts
├── utils/
│   ├── helpers.ts           # Utility functions
│   ├── constants.ts         # Constants
│   └── validators.ts        # Data validators
├── types/
│   └── index.ts             # TypeScript types
├── services/
│   └── api.ts               # API calls
├── styles/
│   └── YourMFE.css          # Component styles (optional)
└── __tests__/
    └── YourMFE.test.ts      # Tests`,
      },
      {
        type: 'subheading',
        content: 'Naming Conventions',
      },
      {
        type: 'table',
        content: [
          ['Type', 'Good Examples', 'Avoid'],
          [
            'Components',
            'MyMFE.tsx, UserProfile.tsx',
            'my-mfe.tsx, mymfe.ts',
          ],
          ['Hooks', 'useUserData.ts, useForm.ts', 'user_data.ts, use-form.ts'],
          ['Utils', 'helpers.ts, validators.ts', 'HELPERS.ts, helper.ts'],
          ['Types', 'types.ts, index.ts', 'Types.ts, types.tsx'],
          [
            'Constants',
            'constants.ts, config.ts',
            'CONSTANTS.ts, CONSTS.ts',
          ],
        ],
      },
      {
        type: 'info',
        content: 'Follow PascalCase for files and directories, camelCase for exports.',
      },
      {
        type: 'subheading',
        content: 'File Organization Example',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'hooks/useUserData.ts',
        content: `import { useState, useEffect } from 'react';
import { getGlobalHttpApi } from '@shared/mfe';

interface User {
  id: string;
  name: string;
  email: string;
}

export const useUserData = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = getGlobalHttpApi('/api');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get<User>(\`/users/\${userId}\`);
        if (response.ok) {
          setUser(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};`,
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'utils/helpers.ts',
        content: `/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
};`,
      },
    ],
    relatedSections: ['first-mfe', 'advanced-patterns'],
  },

  {
    id: 'event-bus',
    title: 'Event Bus Communication',
    subtitle: 'Step 4: MFE Communication',
    description: 'How to communicate between MFEs using the Event Bus',
    elements: [
      {
        type: 'heading',
        content: 'Event Bus System',
      },
      {
        type: 'paragraph',
        content:
          'The Event Bus is a pub/sub system that allows MFEs to communicate without direct dependencies. One MFE publishes events, and other MFEs listen for them.',
      },
      {
        type: 'subheading',
        content: 'Basic Concepts',
      },
      {
        type: 'list',
        content: [
          'Publisher: MFE that emits an event',
          'Subscriber: MFE that listens for an event',
          'Event: A message with type and data',
          'Decoupled: No direct connection between MFEs',
        ],
      },
      {
        type: 'subheading',
        content: 'Publishing Events',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Emit events from your MFE',
        content: `import { getGlobalEventBus } from '@shared/mfe';

const MyMFE = () => {
  const eventBus = getGlobalEventBus();

  const handleUserLogin = (email: string) => {
    // Emit event that other MFEs can listen to
    eventBus.emit('user:login', {
      email,
      loginTime: new Date().toISOString(),
    });
  };

  return (
    <button onClick={() => handleUserLogin('john@example.com')}>
      Login
    </button>
  );
};`,
      },
      {
        type: 'subheading',
        content: 'Subscribing to Events',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Listen to events in another MFE',
        content: `import { useEffect, useState } from 'react';
import { getGlobalEventBus } from '@shared/mfe';

const NotificationMFE = () => {
  const [notification, setNotification] = useState<string | null>(null);
  const eventBus = getGlobalEventBus();

  useEffect(() => {
    // Subscribe to login events
    const unsubscribe = eventBus.on('user:login', (payload) => {
      setNotification(\`User \${payload.data.email} logged in!\`);

      // Auto-remove notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    });

    // Cleanup subscription
    return () => unsubscribe.unsubscribe();
  }, [eventBus]);

  return notification ? (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded">
      ✓ {notification}
    </div>
  ) : null;
};`,
      },
      {
        type: 'subheading',
        content: 'Event Patterns',
      },
      {
        type: 'paragraph',
        content: 'Use regex patterns to listen to multiple related events:',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Pattern matching with regex',
        content: `const eventBus = getGlobalEventBus();

// Listen to all user events (user:login, user:logout, user:signup, etc)
eventBus.onPattern(/^user:/, (payload) => {
  console.log('User event:', payload.type);
  console.log('Data:', payload.data);
});

// Listen to all API events
eventBus.onPattern(/^api:/, (payload) => {
  console.log('API event:', payload.type);
});`,
      },
      {
        type: 'subheading',
        content: 'Subscribe Once',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Listen to an event only once',
        content: `const eventBus = getGlobalEventBus();

// Listen for logout event, then automatically unsubscribe
eventBus.once('user:logout', (payload) => {
  console.log('User logged out');
  // This callback will only be called once
});`,
      },
      {
        type: 'subheading',
        content: 'Common Event Patterns',
      },
      {
        type: 'table',
        content: [
          ['Event Type', 'Example Usage', 'Data Payload'],
          [
            'User Events',
            'user:login, user:logout',
            '{ email, timestamp }',
          ],
          [
            'Data Events',
            'data:updated, data:deleted',
            '{ id, changes }',
          ],
          [
            'Navigation',
            'route:changed, page:opened',
            '{ from, to }',
          ],
          [
            'Notifications',
            'notification:show, notification:dismiss',
            '{ title, message }',
          ],
          [
            'Errors',
            'error:occurred, error:cleared',
            '{ code, message }',
          ],
        ],
      },
      {
        type: 'info',
        content:
          'Use namespaced event names (e.g., user:login) to keep events organized and avoid conflicts.',
      },
      {
        type: 'success',
        content: 'Event Bus enables loosely coupled communication between MFEs!',
      },
    ],
    relatedSections: ['api-integration', 'advanced-patterns'],
  },

  {
    id: 'api-integration',
    title: 'API Integration & HTTP Calls',
    subtitle: 'Step 5: API Calls',
    description: 'Make type-safe API calls using the HTTP API Framework',
    elements: [
      {
        type: 'heading',
        content: 'HTTP API Framework',
      },
      {
        type: 'paragraph',
        content:
          'The HTTP API Framework provides a type-safe, reusable client for making API calls with automatic retry, timeout, and error handling.',
      },
      {
        type: 'subheading',
        content: 'Basic Usage',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Simple GET request',
        content: `import { getGlobalHttpApi } from '@shared/mfe';

const MyMFE = () => {
  const api = getGlobalHttpApi('/api');

  const fetchUsers = async () => {
    try {
      // Make a GET request
      const response = await api.get('/users');

      if (response.ok) {
        console.log('Users:', response.data);
      } else {
        console.error('Error:', response.statusText);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  return (
    <button onClick={fetchUsers}>
      Fetch Users
    </button>
  );
};`,
      },
      {
        type: 'subheading',
        content: 'Type-Safe Responses',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Define types for responses',
        content: `import { getGlobalHttpApi, type ApiResponse } from '@shared/mfe';

// Define your response type
interface User {
  id: string;
  name: string;
  email: string;
}

const MyMFE = () => {
  const api = getGlobalHttpApi('/api');

  const getUser = async (userId: string) => {
    try {
      // Type-safe: response.data is User[]
      const response: ApiResponse<User[]> = await api.get('/users');

      if (response.ok) {
        // Now TypeScript knows response.data is User[]
        response.data.forEach(user => {
          console.log(user.name, user.email);
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return <button onClick={() => getUser('123')}>Get User</button>;
};`,
      },
      {
        type: 'subheading',
        content: 'POST/PUT/PATCH/DELETE Requests',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'All HTTP methods',
        content: `import { getGlobalHttpApi } from '@shared/mfe';

const api = getGlobalHttpApi('/api');

// POST - Create
const createUser = async () => {
  const response = await api.post('/users', {
    name: 'John Doe',
    email: 'john@example.com',
  });
};

// PUT - Replace
const updateUser = async () => {
  const response = await api.put('/users/123', {
    name: 'Jane Doe',
    email: 'jane@example.com',
  });
};

// PATCH - Partial update
const patchUser = async () => {
  const response = await api.patch('/users/123', {
    status: 'active',
  });
};

// DELETE - Remove
const deleteUser = async () => {
  const response = await api.delete('/users/123');
};`,
      },
      {
        type: 'subheading',
        content: 'Custom Headers & Options',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Advanced request options',
        content: `import { getGlobalHttpApi } from '@shared/mfe';

const api = getGlobalHttpApi('/api');

// Set base URL
api.setBaseUrl('https://api.example.com');

// Add authentication header
api.addHeader('Authorization', 'Bearer YOUR_TOKEN');

// Make request with custom options
const response = await api.get('/users', {
  timeout: 60000,    // 60 seconds
  retry: 5,          // Retry 5 times
  headers: {
    'X-Custom-Header': 'value',
  },
});

// Remove a header
api.removeHeader('Authorization');`,
      },
      {
        type: 'subheading',
        content: 'Error Handling',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Comprehensive error handling',
        content: `import { getGlobalHttpApi, type ApiError } from '@shared/mfe';

const api = getGlobalHttpApi('/api');

try {
  const response = await api.get('/users');

  // Check if request was successful
  if (!response.ok) {
    console.error(\`HTTP Error \${response.status}: \${response.statusText}\`);
    return;
  }

  console.log('Success:', response.data);
} catch (error) {
  // Handle different error types
  if (error instanceof Error) {
    console.error('Error message:', error.message);
  }

  // Check if it's an API error with status
  if ('status' in error) {
    const apiError = error as ApiError;
    console.error('Status:', apiError.status);
    console.error('Response:', apiError.response);
  }
}`,
      },
      {
        type: 'subheading',
        content: 'Real-World Example: User Management',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Complete user management example',
        content: `import React, { useState, useEffect } from 'react';
import { getGlobalHttpApi, getGlobalEventBus } from '@shared/mfe';

interface User {
  id: string;
  name: string;
  email: string;
}

const UserManagementMFE = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const api = getGlobalHttpApi('/api');
  const eventBus = getGlobalEventBus();

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<User[]>('/users');
      if (response.ok) {
        setUsers(response.data);
        eventBus.emit('users:loaded', { count: response.data.length });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const createUser = async (name: string, email: string) => {
    try {
      const response = await api.post<User>('/users', { name, email });
      if (response.ok) {
        setUsers([...users, response.data]);
        eventBus.emit('user:created', { user: response.data });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    try {
      await api.delete(\`/users/\${userId}\`);
      setUsers(users.filter(u => u.id !== userId));
      eventBus.emit('user:deleted', { userId });
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users ({users.length})</h2>

      {loading && <p>Loading...</p>}

      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="flex justify-between items-center p-4 bg-gray-100 rounded">
            <div>
              <p className="font-bold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={() => deleteUser(user.id)}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagementMFE;`,
      },
      {
        type: 'success',
        content: 'The HTTP API Framework handles retries, timeouts, and type safety automatically!',
      },
    ],
    relatedSections: ['event-bus', 'testing'],
  },

  {
    id: 'registry',
    title: 'MFE Registry & Discovery',
    subtitle: 'Step 6: Discovery',
    description: 'How to use the Registry to discover and load MFEs',
    elements: [
      {
        type: 'heading',
        content: 'MFE Registry System',
      },
      {
        type: 'paragraph',
        content:
          'The Registry is a central system for discovering, registering, and managing all MFEs in your application.',
      },
      {
        type: 'subheading',
        content: 'Getting the Registry',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Access the global registry',
        content: `import { getGlobalRegistry } from '@shared/mfe';

const registry = getGlobalRegistry();`,
      },
      {
        type: 'subheading',
        content: 'Common Operations',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Registry operations',
        content: `import { getGlobalRegistry } from '@shared/mfe';

const registry = getGlobalRegistry();

// Get all registered MFEs
const allMFEs = registry.getAll();
console.log(\`Total MFEs: \${allMFEs.length}\`);

// Get a specific MFE
const dashboard = registry.get('dashboard');
console.log('Dashboard:', dashboard);

// Find by tag
const analyticsMFEs = registry.findByTag('analytics');
console.log('Analytics MFEs:', analyticsMFEs);

// Find by name (partial match)
const searchResults = registry.findByName('user');
console.log('Search results:', searchResults);

// Full-text search
const results = registry.search('management');
console.log('Search results:', results);

// Get all unique tags
const tags = registry.getTags();
console.log('Available tags:', tags);`,
      },
      {
        type: 'subheading',
        content: 'Register a New MFE',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Register MFE programmatically',
        content: `import { getGlobalRegistry, type RegistryEntry } from '@shared/mfe';

const registry = getGlobalRegistry();

const newMFE: RegistryEntry = {
  id: 'my-custom-mfe',
  name: 'My Custom MFE',
  description: 'A custom MFE I created',
  version: '1.0.0',
  scope: 'myCustomMFE',
  module: './MyCustomMFE',
  tags: ['custom', 'feature', 'new'],
  icon: '🎨',
  config: {
    id: 'my-custom-mfe',
    scope: 'myCustomMFE',
    module: 'myCustomMFE',
    exposes: {
      './MyCustomMFE': './src/MyCustomMFE',
    },
  },
};

// Register it
registry.register(newMFE);`,
      },
      {
        type: 'subheading',
        content: 'Use Registry in Components',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Build a MFE discovery component',
        content: `import React, { useState } from 'react';
import { getGlobalRegistry } from '@shared/mfe';

const MFEDiscovery = () => {
  const [selectedTag, setSelectedTag] = useState('');
  const registry = getGlobalRegistry();

  // Get all MFEs and tags
  const allMFEs = selectedTag
    ? registry.findByTag(selectedTag)
    : registry.getAll();
  const tags = registry.getTags();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        Available MFEs ({allMFEs.length})
      </h2>

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag('')}
          className={\`px-3 py-1 rounded \${
            !selectedTag ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }\`}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={\`px-3 py-1 rounded \${
              selectedTag === tag
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200'
            }\`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* MFE List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allMFEs.map(mfe => (
          <div key={mfe.id} className="p-4 border rounded-lg hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg">
                  {mfe.icon} {mfe.name}
                </h3>
                <p className="text-sm text-gray-600">{mfe.description}</p>
              </div>
              <span className="text-xs text-gray-500">{mfe.version}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {mfe.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MFEDiscovery;`,
      },
      {
        type: 'warning',
        content: 'Always validate MFE configurations before loading them from untrusted sources.',
      },
    ],
    relatedSections: ['first-mfe', 'advanced-patterns'],
  },

  {
    id: 'advanced-patterns',
    title: 'Advanced Patterns & Best Practices',
    subtitle: 'Step 7: Advanced Topics',
    description: 'Advanced patterns and best practices for MFE development',
    elements: [
      {
        type: 'heading',
        content: 'Advanced MFE Patterns',
      },
      {
        type: 'subheading',
        content: 'Pattern 1: Shared State Between MFEs',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'shared/state.ts - Shared State Manager',
        content: `import { getGlobalEventBus } from '@shared/mfe';

class SharedState {
  private data: Record<string, any> = {};
  private eventBus = getGlobalEventBus();

  set(key: string, value: any) {
    this.data[key] = value;
    // Notify all listeners
    this.eventBus.emit(\`state:\${key}:changed\`, { value });
  }

  get(key: string) {
    return this.data[key];
  }

  subscribe(key: string, callback: (value: any) => void) {
    // Subscribe to state changes
    return this.eventBus.on(\`state:\${key}:changed\`, (payload) => {
      callback(payload.data.value);
    });
  }
}

export const sharedState = new SharedState();`,
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Usage in MFE',
        content: `import { sharedState } from '@shared/state';
import { useEffect, useState } from 'react';

// MFE 1: Update shared state
const MFE1 = () => {
  const handleThemeChange = (theme: 'light' | 'dark') => {
    sharedState.set('theme', theme);
  };

  return (
    <button onClick={() => handleThemeChange('dark')}>
      Set Dark Theme
    </button>
  );
};

// MFE 2: Listen to shared state changes
const MFE2 = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const subscription = sharedState.subscribe('theme', setTheme);
    return () => subscription.unsubscribe();
  }, []);

  return <div>Current theme: {theme}</div>;
};`,
      },
      {
        type: 'subheading',
        content: 'Pattern 2: Error Boundaries',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'MFEErrorBoundary.tsx',
        content: `import React from 'react';
import { getGlobalEventBus } from '@shared/mfe';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mfeId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class MFEErrorBoundary extends React.Component<Props, State> {
  private eventBus = getGlobalEventBus();

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Emit error event
    this.eventBus.emit('mfe:error', {
      mfeId: this.props.mfeId,
      error: error.message,
    });

    console.error('MFE Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="border border-red-300 bg-red-50 p-4 rounded">
            <h3 className="text-red-700 font-bold">Something went wrong</h3>
            <p className="text-red-600">{this.state.error?.message}</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default MFEErrorBoundary;`,
      },
      {
        type: 'subheading',
        content: 'Pattern 3: Loading States',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Loading state management',
        content: `import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAsync = <T,>(
  asyncFunction: () => Promise<T>
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      setState({ data: null, loading: false, error: errorMsg });
      throw error;
    }
  }, [asyncFunction]);

  return { ...state, execute };
};`,
      },
      {
        type: 'subheading',
        content: 'Best Practice 1: Environment Variables',
      },
      {
        type: 'code',
        language: 'bash',
        title: '.env.development - Development config',
        content: `VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEBUG=true
VITE_ENVIRONMENT=development`,
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Using environment variables',
        content: `const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isDebug = import.meta.env.VITE_DEBUG === 'true';
const environment = import.meta.env.VITE_ENVIRONMENT;

// In your MFE:
const api = getGlobalHttpApi(apiBaseUrl);

if (isDebug) {
  console.log('Debug mode enabled');
}`,
      },
      {
        type: 'subheading',
        content: 'Best Practice 2: Performance Optimization',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Lazy loading components',
        content: `import React, { lazy, Suspense } from 'react';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

const MyMFE = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
};`,
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Memoization to prevent re-renders',
        content: `import { memo, useCallback } from 'react';

// Prevent re-render if props don't change
const UserCard = memo(({ user, onDelete }) => {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  );
});

const UserList = ({ users }) => {
  // Use useCallback to prevent function recreation
  const handleDelete = useCallback((userId: string) => {
    // Delete user
  }, []);

  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};`,
      },
    ],
    relatedSections: ['testing', 'deployment'],
  },

  {
    id: 'testing',
    title: 'Testing Your MFEs',
    subtitle: 'Step 8: Quality Assurance',
    description: 'How to test your MFE applications',
    elements: [
      {
        type: 'heading',
        content: 'MFE Testing Guide',
      },
      {
        type: 'subheading',
        content: 'Setting Up Tests',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Run tests',
        content: `# Run tests once
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage`,
      },
      {
        type: 'subheading',
        content: 'Unit Testing',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Test Event Bus',
        content: `import { describe, it, expect, beforeEach } from 'vitest';
import { getGlobalEventBus, resetEventBus } from '@shared/mfe';

describe('Event Bus', () => {
  beforeEach(() => {
    resetEventBus();
  });

  it('should emit and receive events', (done) => {
    const eventBus = getGlobalEventBus();

    const unsubscribe = eventBus.once('test:event', (payload) => {
      expect(payload.data.message).toBe('hello');
      unsubscribe.unsubscribe();
      done();
    });

    eventBus.emit('test:event', { message: 'hello' });
  });

  it('should support pattern matching', (done) => {
    const eventBus = getGlobalEventBus();

    const unsubscribe = eventBus.onPattern(/^user:/, (payload) => {
      expect(payload.type).toMatch(/^user:/);
      unsubscribe.unsubscribe();
      done();
    });

    eventBus.emit('user:login', { email: 'test@example.com' });
  });
});`,
      },
      {
        type: 'subheading',
        content: 'Integration Testing',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Test MFE loading',
        content: `import { describe, it, expect, beforeEach } from 'vitest';
import { getGlobalRuntime, getGlobalRegistry } from '@shared/mfe';

describe('MFE Loading', () => {
  it('should load and register MFEs', async () => {
    const runtime = getGlobalRuntime();
    const registry = getGlobalRegistry();

    const mfe = registry.get('dashboard');
    expect(mfe).toBeDefined();

    if (mfe) {
      const container = await runtime.loadModule('dashboard', mfe.config);
      expect(container.loaded).toBe(true);
      expect(runtime.isLoaded('dashboard')).toBe(true);

      await runtime.unloadModule('dashboard');
      expect(runtime.isLoaded('dashboard')).toBe(false);
    }
  });

  it('should search registry', () => {
    const registry = getGlobalRegistry();

    const results = registry.search('dashboard');
    expect(results.length).toBeGreaterThan(0);

    const byTag = registry.findByTag('analytics');
    expect(byTag).toBeInstanceOf(Array);
  });
});`,
      },
      {
        type: 'important',
        content: 'Always clean up tests by resetting the event bus and runtime to avoid test interference.',
      },
    ],
    relatedSections: ['deployment'],
  },

  {
    id: 'deployment',
    title: 'Deployment & Production',
    subtitle: 'Step 9: Going Live',
    description: 'Deploy your MFE Framework to production',
    elements: [
      {
        type: 'heading',
        content: 'Production Deployment',
      },
      {
        type: 'subheading',
        content: 'Build for Production',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Build the application',
        content: `# Build both client and server
pnpm build

# Output:
# ✓ dist/spa/index.html
# ✓ dist/spa/assets/index-*.css
# ✓ dist/spa/assets/index-*.js
# ✓ dist/server/node-build.mjs`,
      },
      {
        type: 'subheading',
        content: 'Deploy to Netlify',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Netlify deployment',
        content: `# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
netlify deploy --prod

# Or connect GitHub for automatic deployments`,
      },
      {
        type: 'subheading',
        content: 'Deploy to Vercel',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Vercel deployment',
        content: `# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Or push to GitHub and connect Vercel for auto-deploy`,
      },
      {
        type: 'subheading',
        content: 'Docker Deployment',
      },
      {
        type: 'code',
        language: 'dockerfile',
        title: 'Dockerfile',
        content: `FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Start server
EXPOSE 3000
CMD ["pnpm", "start"]`,
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Build and run Docker',
        content: `# Build Docker image
docker build -t mfe-framework:latest .

# Run container
docker run -p 3000:3000 mfe-framework:latest

# Push to Docker Hub
docker tag mfe-framework:latest username/mfe-framework:latest
docker push username/mfe-framework:latest`,
      },
      {
        type: 'subheading',
        content: 'Environment Configuration',
      },
      {
        type: 'code',
        language: 'bash',
        title: '.env.production',
        content: `VITE_API_BASE_URL=https://api.example.com
VITE_DEBUG=false
VITE_ENVIRONMENT=production
NODE_ENV=production`,
      },
      {
        type: 'success',
        content: 'Your MFE Framework is now live in production!',
      },
    ],
    relatedSections: ['advanced-patterns'],
  },

  {
    id: 'troubleshooting',
    title: 'Troubleshooting Guide',
    subtitle: 'Debugging',
    description: 'Common issues and how to solve them',
    elements: [
      {
        type: 'heading',
        content: 'Common Issues & Solutions',
      },
      {
        type: 'subheading',
        content: 'Issue 1: Module Not Found Error',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Error: Cannot find module @shared/mfe',
        content: `# Solution 1: Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Solution 2: Clear Vite cache
rm -rf .vite
pnpm dev`,
      },
      {
        type: 'subheading',
        content: 'Issue 2: MFE Not Loading',
      },
      {
        type: 'list',
        content: [
          'Check browser console for errors (F12 → Console)',
          'Verify component is exported as default: export default MyMFE',
          'Verify component is added to componentMap in MFEHost.tsx',
          'Verify component is registered in registry.ts',
          'Restart dev server: pnpm dev',
        ],
      },
      {
        type: 'subheading',
        content: 'Issue 3: TypeScript Errors',
      },
      {
        type: 'code',
        language: 'bash',
        title: 'Fix TypeScript errors',
        content: `# Check for errors
pnpm typecheck

# Fix automatically
pnpm format.fix

# Or manually fix using @ts-ignore (not recommended)
// @ts-ignore
const value = something;`,
      },
      {
        type: 'subheading',
        content: 'Issue 4: Event Bus Not Working',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Correct way to use Event Bus',
        content: `// ❌ WRONG - Creates new instance
import { EventBus } from '@shared/mfe';
const eventBus = new EventBus();

// ✅ CORRECT - Use global instance
import { getGlobalEventBus } from '@shared/mfe';
const eventBus = getGlobalEventBus();`,
      },
      {
        type: 'subheading',
        content: 'Issue 5: API Calls Failing',
      },
      {
        type: 'list',
        content: [
          'Check network tab in browser (F12 → Network)',
          'Verify API base URL is correct',
          'Check CORS settings on server',
          'Verify API endpoint exists: GET /api/endpoint',
          'Check response status and headers',
        ],
      },
      {
        type: 'subheading',
        content: 'Debugging Tips',
      },
      {
        type: 'code',
        language: 'typescript',
        title: 'Add debug logging',
        content: `import { getGlobalEventBus, getGlobalRegistry } from '@shared/mfe';

const eventBus = getGlobalEventBus();
const registry = getGlobalRegistry();

// Log all events
eventBus.onPattern(/./, (payload) => {
  console.log('[Event]', payload.type, payload.data);
});

// Log registry
console.log('All MFEs:', registry.getAll());
console.log('All tags:', registry.getTags());`,
      },
      {
        type: 'info',
        content: 'Open browser DevTools (F12) and check the Console tab for error messages.',
      },
    ],
    relatedSections: ['api-integration', 'advanced-patterns'],
  },

  {
    id: 'next-steps',
    title: 'Next Steps & Resources',
    subtitle: 'Final Steps',
    description: 'What to do next and where to find help',
    elements: [
      {
        type: 'heading',
        content: 'Congratulations!',
      },
      {
        type: 'paragraph',
        content:
          'You now have the knowledge to build production-ready Micro Frontends using this framework. Let\'s review what you\'ve learned.',
      },
      {
        type: 'subheading',
        content: 'What You Learned',
      },
      {
        type: 'list',
        content: [
          '✅ How to set up the MFE Framework',
          '✅ How to create your first MFE',
          '✅ How to organize MFE code properly',
          '✅ How to communicate between MFEs using Event Bus',
          '✅ How to make API calls with the HTTP Framework',
          '✅ How to use the Registry for discovery',
          '✅ Advanced patterns and best practices',
          '✅ How to test MFEs',
          '✅ How to deploy to production',
        ],
      },
      {
        type: 'subheading',
        content: 'Next Challenges',
      },
      {
        type: 'list',
        content: [
          'Build a User Management MFE with CRUD operations',
          'Create an Analytics Dashboard with real data',
          'Implement authentication and authorization',
          'Build a real-time notification system',
          'Optimize bundle size with code splitting',
          'Add comprehensive error tracking',
          'Set up CI/CD pipeline for automatic deployment',
          'Monitor production performance and errors',
        ],
      },
      {
        type: 'subheading',
        content: 'Resources',
      },
      {
        type: 'list',
        content: [
          'React Documentation: https://react.dev',
          'TypeScript Handbook: https://www.typescriptlang.org/docs/',
          'Vite Guide: https://vitejs.dev',
          'Express.js: https://expressjs.com',
          'MFE Framework Code: Check the GitHub repository',
          'Community Support: Ask questions in discussions',
        ],
      },
      {
        type: 'success',
        content: 'You\'re ready to build amazing Micro Frontend applications. Start with simple MFEs and gradually add complexity. Happy coding! 🚀',
      },
    ],
    relatedSections: ['intro', 'first-mfe'],
  },
];
