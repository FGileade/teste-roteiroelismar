import React from 'react';

export function AppSignature() {
  return (
    <footer className="w-full flex justify-center items-center py-1.5 bg-transparent border-t border-slate-100">
      <p className="m-0 text-[11px] leading-tight tracking-wide text-slate-400 font-semibold text-center">
        Developed by{' '}
        <a
          href="https://gileadehub.com.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded"
        >
          Gileade HUB
        </a>
      </p>
    </footer>
  );
}
