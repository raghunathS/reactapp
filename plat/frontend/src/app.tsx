import {
  HashRouter,
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { USE_BROWSER_ROUTER } from "./common/constants";
import GlobalHeader from "./components/global-header";
import DashboardPage from "./pages/dashboard/dashboard-page";
import ViewItemPage from "./pages/aws/view-item/view-item-page";
import AddItemPage from "./pages/aws/add-item/add-item-page";
import AllReportsPage from "./pages/SecOps/AllReports";
import AppCodeTrendsPage from "./pages/SecOps/AppCodeTrends";
import AgentPage from './pages/agents/AgentPage';
import ConfluencePage from './pages/whitepapers/confluence-page';
import HeartbeatPage from './pages/Heartbeat';
import FinOpsPage from './pages/FinOps';
import AtcPage from './pages/atc/atc-page';
import NotFound from "./pages/not-found";
import "./styles/app.scss";

export default function App() {
  const Router = USE_BROWSER_ROUTER ? BrowserRouter : HashRouter;

  return (
    <div style={{ height: "100%" }}>
      <Router>
        <GlobalHeader />
        <div style={{ height: "56px", backgroundColor: "#000716" }}>&nbsp;</div>
        <div>
          <Routes>
            <Route index path="/" element={<DashboardPage />} />
            <Route path="/aws" element={<Outlet />}>
              <Route path="add" element={<AddItemPage />} />
              <Route path="secops-reports/:itemId" element={<ViewItemPage />} />
            </Route>
            <Route path="/secops/all-reports" element={<AllReportsPage />} />
            <Route path="/secops/appcode-trends" element={<AppCodeTrendsPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="/whitepapers/confluence" element={<ConfluencePage />} />
            <Route path="/heartbeat" element={<HeartbeatPage />} />
            <Route path="/finops" element={<FinOpsPage />} />
            <Route path="/atc/:provider" element={<AtcPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
