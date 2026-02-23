import React from 'react';
import { AlertCircle, CheckCircle, Lightbulb, Zap } from 'lucide-react';
import DocCodeBlock from './DocCodeBlock';
import type { DocumentationSection, DocElement } from './sections';

interface DocContentProps {
  section: DocumentationSection;
}

const DocContent: React.FC<DocContentProps> = ({ section }) => {
  const renderElement = (element: DocElement, index: number) => {
    switch (element.type) {
      case 'heading':
        return (
          <h2 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4">
            {element.content}
          </h2>
        );

      case 'subheading':
        return (
          <h3 key={index} className="text-xl font-semibold text-slate-800 mt-6 mb-3">
            {element.content}
          </h3>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-slate-700 leading-relaxed mb-4">
            {element.content}
          </p>
        );

      case 'list':
        return (
          <ul key={index} className="space-y-2 mb-4 ml-4">
            {Array.isArray(element.content) &&
              (element.content as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
          </ul>
        );

      case 'code':
        return (
          <div key={index} className="my-4">
            <DocCodeBlock
              code={typeof element.content === 'string' ? element.content : ''}
              language={element.language}
              title={element.title}
            />
          </div>
        );

      case 'info':
        return (
          <div key={index} className="flex gap-4 p-4 rounded-lg bg-blue-50 border border-blue-200 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">💡 Tip</h4>
              <p className="text-blue-800 text-sm">{element.content}</p>
            </div>
          </div>
        );

      case 'warning':
        return (
          <div key={index} className="flex gap-4 p-4 rounded-lg bg-amber-50 border border-amber-200 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">⚠️ Warning</h4>
              <p className="text-amber-800 text-sm">{element.content}</p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div key={index} className="flex gap-4 p-4 rounded-lg bg-green-50 border border-green-200 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">✅ Success</h4>
              <p className="text-green-800 text-sm">{element.content}</p>
            </div>
          </div>
        );

      case 'important':
        return (
          <div key={index} className="flex gap-4 p-4 rounded-lg bg-red-50 border border-red-200 mb-4">
            <Zap className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">🔴 Important</h4>
              <p className="text-red-800 text-sm">{element.content}</p>
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={index} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {Array.isArray(element.content) &&
                  (element.content as string[][]).map((row, i) => (
                    <tr
                      key={i}
                      className={i === 0 ? 'bg-blue-600 text-white' : 'border-b border-slate-200'}
                    >
                      {Array.isArray(row) &&
                        row.map((cell, j) => (
                          <td
                            key={j}
                            className={`px-4 py-3 text-sm ${
                              i === 0
                                ? 'font-semibold'
                                : 'text-slate-700'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );

      case 'steps':
        return (
          <div key={index} className="space-y-4 my-4">
            {Array.isArray(element.content) &&
              (element.content as string[]).map((step, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-800 font-medium">{step}</p>
                  </div>
                </div>
              ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
      {/* Section Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">{section.title}</h1>
        <p className="text-lg text-slate-600">{section.description}</p>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        {section.elements.map((element, index) => renderElement(element, index))}
      </div>

      {/* Related Links */}
      {section.relatedSections && section.relatedSections.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Related Topics</h4>
          <div className="grid grid-cols-2 gap-4">
            {section.relatedSections.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-sm font-medium text-blue-900"
              >
                → See more
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocContent;
