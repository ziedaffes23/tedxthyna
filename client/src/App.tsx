import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SectionPage from "./pages/SectionPage";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/mission"}>{() => <SectionPage section="mission" />}</Route>
      <Route path={"/board"}>{() => <SectionPage section="board" />}</Route>
      <Route path={"/minds"}>{() => <SectionPage section="minds" />}</Route>
      <Route path={"/organization"}>{() => <SectionPage section="organization" />}</Route>
      <Route path={"/scene"}>{() => <SectionPage section="scene" />}</Route>
      <Route path={"/agenda"}>{() => <SectionPage section="agenda" />}</Route>
      <Route path={"/register"}>{() => <SectionPage section="register" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
