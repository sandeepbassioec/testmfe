import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Package,
  Globe,
  Layers,
  ArrowRight,
  CheckCircle,
  Code,
  Gauge,
  Shield,
  Smartphone,
} from 'lucide-react';
import MFEHost from '@/components/MFEHost';
import InAppChat from '@/components/InAppChat';
import { getGlobalRegistry } from '@shared/mfe';

const Index: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [registrySize, setRegistrySize] = useState(0);
  const registry = getGlobalRegistry();

  useEffect(() => {
    window.scrollTo(0, 0);

    // Log registry size
    try {
      const size = registry?.size?.() || 0;
      setRegistrySize(size);
      console.log('[Index] Registry size:', size);
    } catch (err) {
      console.error('[Index] Error getting registry size:', err);
    }
  }, [registry]);

  const features = [
    {
      icon: Zap,
      title: 'Module Loader',
      description:
        'Dynamically load modules at runtime with automatic retry logic and caching',
    },
    {
      icon: Globe,
      title: 'Event Bus',
      description:
        'Cross-MFE communication without direct dependencies using a robust pub/sub system',
    },
    {
      icon: Package,
      title: 'Registry System',
      description: 'Central discovery and management of all Micro Frontend applications',
    },
    {
      icon: Code,
      title: 'HTTP API Framework',
      description:
        'Reusable, type-safe HTTP client with automatic retry, timeout, and error handling',
    },
    {
      icon: Layers,
      title: 'MFE Runtime',
      description:
        'Complete lifecycle management for modules including loading, mounting, and cleanup',
    },
    {
      icon: Gauge,
      title: 'Performance Optimized',
      description: 'Built for production with caching, lazy loading, and minimal bundle size',
    },
  ];

  const capabilities = [
    'Dynamic module loading and unloading',
    'Automatic dependency management',
    'Event-driven communication',
    'Type-safe API framework',
    'Centralized module registry',
    'Production-ready error handling',
    'Built-in retry mechanisms',
    'Module lifecycle management',
  ];

  const stats = [
    { label: 'Registered MFEs', value: registrySize },
    { label: 'Framework Modules', value: 5 },
    { label: 'Sample Apps', value: 3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Debug Banner */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-2 text-xs z-50 font-mono">
          🚀 App Loaded | Registry MFEs: {registrySize} | React: ✓
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 z-40" style={{ marginTop: process.env.NODE_ENV === 'development' ? '32px' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">MFE Framework</span>
          </div>
          <button
            onClick={() => setShowDemo(!showDemo)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
          >
            {showDemo ? 'Hide Demo' : 'View Demo'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-6 inline-block">
            <span className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-300">
              Production-Ready Micro Frontend Framework
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Enterprise-Grade
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Micro Frontend Framework
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            A complete, production-ready MFE solution with Module Loader, Runtime, Event Bus,
            HTTP API Framework, Registry System, and comprehensive sample applications. Built with
            React, TypeScript, and Node.js with zero tolerance for errors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setShowDemo(true)}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 group"
            >
              Explore Demo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="/documentation"
              className="px-8 py-3 rounded-lg border border-slate-500 hover:border-slate-400 transition-colors font-semibold text-center"
            >
              View Documentation
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-slate-400">Everything you need for enterprise micro frontend architecture</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-blue-500/30 hover:bg-slate-800/60 transition-all group"
                >
                  <Icon className="w-8 h-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Complete Capabilities</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {capabilities.map((capability, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <span className="text-lg text-slate-200">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Architecture Highlights</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <Code className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">React + TypeScript</h3>
              <p className="text-slate-300">
                Built with modern React and full TypeScript support for type safety across your entire MFE
                ecosystem
              </p>
            </div>

            <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
              <Smartphone className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Node.js Backend</h3>
              <p className="text-slate-300">
                Express-based REST API with complete MFE registry and discovery endpoints for seamless integration
              </p>
            </div>

            <div className="p-8 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20">
              <Shield className="w-12 h-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Production Ready</h3>
              <p className="text-slate-300">
                Enterprise-grade error handling, automatic retries, caching, and comprehensive module lifecycle
                management
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      {showDemo && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold mb-12 text-center">Interactive Demo</h2>

            <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6 overflow-auto max-h-[800px]">
              <MFEHost className="text-slate-900" />
            </div>

            <div className="mt-8 p-6 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h3 className="text-lg font-semibold mb-3">About This Demo</h3>
              <p className="text-slate-300 mb-4">
                This interactive demo shows the complete MFE framework in action:
              </p>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <span className="text-blue-400">•</span> View all registered MFEs in the registry
                </li>
                <li>
                  <span className="text-blue-400">•</span> Load and unload modules dynamically
                </li>
                <li>
                  <span className="text-blue-400">•</span> Monitor loading status and error handling
                </li>
                <li>
                  <span className="text-blue-400">•</span> See real-time statistics and metrics
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tech Stack */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">Built With Modern Tech</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'React 18', emoji: '⚛️' },
              { name: 'TypeScript', emoji: '📘' },
              { name: 'Node.js', emoji: '🟢' },
              { name: 'Express', emoji: '🚀' },
              { name: 'Vite', emoji: '⚡' },
              { name: 'TailwindCSS', emoji: '🎨' },
              { name: 'Recharts', emoji: '📊' },
              { name: 'Lucide Icons', emoji: '🎯' },
            ].map((tech, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="text-2xl mb-2">{tech.emoji}</div>
                <div className="font-medium text-sm">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Explore the framework, load the sample MFEs, and experience the power of enterprise micro frontends.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDemo(true)}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all font-semibold text-lg inline-flex items-center justify-center gap-2 group"
            >
              Explore the Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="/documentation"
              className="px-8 py-4 rounded-lg border border-slate-400 hover:border-slate-300 transition-colors font-semibold text-lg inline-flex items-center justify-center gap-2 group"
            >
              Read the Guide
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-semibold">MFE Framework</span>
            </div>

            <div className="text-slate-400 text-sm">
              Production-ready Micro Frontend Framework • Built with React + TypeScript + Node.js
            </div>

            <div className="flex gap-6 text-sm">
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors">
                Documentation
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors">
                GitHub
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-200 transition-colors">
                Support
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700/50 text-center text-slate-500 text-sm">
            © 2024 MFE Framework. All rights reserved.
          </div>
        </div>
      </footer>

      {/* In-App Chat Widget */}
      <InAppChat
        userId={`user-${Math.random().toString(36).substr(2, 9)}`}
        position="bottom-right"
      />
    </div>
  );
};

export default Index;
