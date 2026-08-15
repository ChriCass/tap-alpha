import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StorefrontLayout } from "./layouts/storefront.layout";
import { HomePage } from "./pages/home.page";
import { ProductDetailPage } from "./pages/product-detail.page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/productos/:slug" element={<ProductDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
