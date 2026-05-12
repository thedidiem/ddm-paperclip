import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { BreadcrumbProvider } from "./context/BreadcrumbContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ContentFlywheel } from "./pages/ContentFlywheel";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <BreadcrumbProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground">
              <ContentFlywheel />
            </div>
          </TooltipProvider>
        </BreadcrumbProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
