import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { DocumentationSection } from './sections';

interface DocSidebarProps {
  sections: DocumentationSection[];
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

const DocSidebar: React.FC<DocSidebarProps> = ({
  sections,
  activeSection,
  onSectionClick,
}) => {
  return (
    <nav className="space-y-1">
      {sections.map((section, index) => (
        <button
          key={section.id}
          onClick={() => onSectionClick(section.id)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
            activeSection === section.id
              ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900 font-medium'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                }`}
              >
                {index + 1}
              </div>
              <span>{section.title}</span>
            </div>
            {section.subtitle && (
              <p className="text-xs mt-1 ml-9 text-slate-500">{section.subtitle}</p>
            )}
          </div>
          {activeSection === section.id && (
            <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
        </button>
      ))}
    </nav>
  );
};

export default DocSidebar;
