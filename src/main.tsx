
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ToastProvider } from "@/components/ui/toast"

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <SidebarProvider>
          <App />
          <Toaster />
        </SidebarProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
);
