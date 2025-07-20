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
import AllItemsPage from "./pages/aws/secops-reports/secops-reports-page";
import AddItemPage from "./pages/aws/add-item/add-item-page";
import Item1Page from "./pages/gcp/secops-reports-page";
import ChatbotPage from './pages/agents/chatbot-page';
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
              <Route path="secops-reports" element={<AllItemsPage />} />
              <Route path="add" element={<AddItemPage />} />
              <Route path="secops-reports/:itemId" element={<ViewItemPage />} />
            </Route>
            <Route path="/gcp/secops-reports" element={<Item1Page />} />
            <Route path="/agents/:agentName" element={<ChatbotPage />} />
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
