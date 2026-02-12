import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { AssistantChatbot } from './AssistantChatbot';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content Area */}
      <div className="md:pl-[240px] transition-all duration-200">
        <Header />
        <main className="min-h-[calc(100vh-64px)] p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Global Chatbot */}
      <AssistantChatbot />
    </div>
  );
}
