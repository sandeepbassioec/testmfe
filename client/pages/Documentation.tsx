import React, { useState, useMemo } from 'react';
import { Search, Menu, X, ChevronRight, Copy, Check } from 'lucide-react';
import DocSidebar from '@/components/documentation/DocSidebar';
import DocContent from '@/components/documentation/DocContent';
import { DOCUMENTATION_SECTIONS } from '@/components/documentation/sections';

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState(DOCUMENTATION_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCUMENTATION_SECTIONS;

    const query = searchQuery.toLowerCase();
    return DOCUMENTATION_SECTIONS.filter(section => {
      const matchesTitle = section.title.toLowerCase().includes(query);
      const matchesDesc = section.description.toLowerCase().includes(query);
      const matchesContent = section.elements
        .map(el => (typeof el.content === 'string' ? el.content : ''))
        .join(' ')
        .toLowerCase()
        .includes(query);

      return matchesTitle || matchesDesc || matchesContent;
    });
  }, [searchQuery]);

  const activeDoc = DOCUMENTATION_SECTIONS.find(s => s.id === activeSection);
  const currentIndex = DOCUMENTATION_SECTIONS.findIndex(s => s.id === activeSection);
  const totalSections = DOCUMENTATION_SECTIONS.length;
  const progress = ((currentIndex + 1) / totalSections) * 100;

  const handleNext = () => {
    if (currentIndex < totalSections - 1) {
      setActiveSection(DOCUMENTATION_SECTIONS[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setActiveSection(DOCUMENTATION_SECTIONS[currentIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">MFE Framework</h1>
                <p className="text-sm text-slate-600">Developer Documentation</p>
              </div>
            </div>

            {/* Search */}
            <div className="hidden sm:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          {sidebarOpen && (
            <div className="mt-4 sm:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-slate-200 rounded-full h-1 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Step {currentIndex + 1} of {totalSections}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div
            className={`${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block lg:col-span-1 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto`}
          >
            <DocSidebar
              sections={filteredSections}
              activeSection={activeSection}
              onSectionClick={(sectionId) => {
                setActiveSection(sectionId);
                setSidebarOpen(false);
              }}
            />
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-8">
            {activeDoc ? (
              <>
                <DocContent section={activeDoc} />

                {/* Navigation */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-8 mt-12">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="text-center text-sm text-slate-600">
                    {currentIndex + 1} / {totalSections}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === totalSections - 1}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-600 text-lg">
                  No results found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
