import React from 'react';

export function Header({ activeTab, setActiveTab, installPrompt, triggerInstall }) {
  const tabs = [
    { id: 'read', label: 'Read' },
    { id: 'reports', label: 'Reports' },
    { id: 'exercises', label: 'Exercises' },
  ];

  return (
    <header className="bg-blue-900 text-white shadow-md w-full">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* App Title & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
            <svg
              className="w-6 h-6 text-blue-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight select-none">TremorLens</h1>
            <p className="text-xs text-blue-200 font-medium">Built for shaking hands</p>
          </div>
        </div>

        {/* Navigation Tabs and Install Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {installPrompt && (
            <button
              onClick={triggerInstall}
              className="px-3 py-2 bg-yellow-400 text-blue-950 text-sm font-bold rounded-lg shadow hover:bg-yellow-300 transition duration-150 flex items-center gap-1 min-h-[48px] touch-manipulation"
              aria-label="Install App to Device"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Install</span>
            </button>
          )}

          <nav className="flex bg-blue-950/50 rounded-xl p-1 gap-1" aria-label="Main navigation">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-base font-bold rounded-lg transition duration-200 min-h-[48px] min-w-[80px] flex items-center justify-center touch-manipulation ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-200 hover:text-white hover:bg-blue-800/30'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
