import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface DocCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

const DocCodeBlock: React.FC<DocCodeBlockProps> = ({ code, language = 'typescript', title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
      {title && (
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">{title}</span>
          <span className="text-xs text-slate-500">{language}</span>
        </div>
      )}

      <div className="relative">
        <pre className="p-4 overflow-x-auto text-sm">
          <code className="text-slate-100 font-mono">{code}</code>
        </pre>

        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-400 hover:text-slate-300" />
          )}
        </button>
      </div>
    </div>
  );
};

export default DocCodeBlock;
