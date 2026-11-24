import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main className={cn(
        'flex-1 min-h-screen transition-all duration-300',
        collapsed ? 'ml-16' : 'ml-64'
      )}>
        <div className="max-w-screen-2xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
