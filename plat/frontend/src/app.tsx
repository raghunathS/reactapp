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
import ViewItemPage from "./pages/section1/view-item/view-item-page";
import AllItemsPage from "./pages/section1/all-items/all-items-page";
import ItemsPage from "./pages/section1/items-page";
import AddItemPage from "./pages/section1/add-item/add-item-page";
import Item1Page from "./pages/section2/item1-page";
import ChatbotPage from './pages/section3/chatbot-page';
import ConfluencePage from './pages/section4/confluence-page';
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
            <Route path="/section1" element={<Outlet />}>
              <Route path="" element={<AllItemsPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="add" element={<AddItemPage />} />
              <Route path="items/:itemId" element={<ViewItemPage />} />
            </Route>
            <Route path="/section2/item1" element={<Item1Page />} />
            <Route path="/section3/:agentName" element={<ChatbotPage />} />
            <Route path="/section4/confluence" element={<ConfluencePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}
