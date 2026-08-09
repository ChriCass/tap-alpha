import type {
  ApiError,
  Analytics,
  Collection,
  Coupon,
  Customer,
  Order,
  PaginatedResponse,
  Product,
  User,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(error.message ?? "Request failed");
    }

    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  upload<T>(endpoint: string, formData: FormData) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    }).then((r) => {
      if (!r.ok) throw new Error("Upload failed");
      return r.json() as Promise<T>;
    });
  }

  // Auth
  login(email: string, password: string) {
    return this.post<{ token: string; user: User }>("/auth/login", {
      email,
      password,
    });
  }

  getMe() {
    return this.get<{ data: User }>("/auth/me");
  }

  logout() {
    return this.post("/auth/logout");
  }

  // Products
  getProducts(page = 1, search = "") {
    return this.get<PaginatedResponse<Product>>(
      `/admin/products?page=${page}&search=${encodeURIComponent(search)}`,
    );
  }

  getProduct(id: number) {
    return this.get<{ data: Product }>(`/admin/products/${id}`);
  }

  createProduct(data: FormData) {
    return this.upload<{ data: Product }>("/admin/products", data);
  }

  updateProduct(id: number, data: FormData) {
    return this.upload<{ data: Product }>(`/admin/products/${id}`, data);
  }

  deleteProduct(id: number) {
    return this.delete(`/admin/products/${id}`);
  }

  importProducts(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    return this.upload<{ imported: number; errors: string[] }>(
      "/admin/products/import",
      fd,
    );
  }

  exportProducts() {
    return this.get<Blob>("/admin/products/export");
  }

  // Collections
  getCollections(page = 1) {
    return this.get<PaginatedResponse<Collection>>(
      `/admin/collections?page=${page}`,
    );
  }

  getCollection(id: number) {
    return this.get<{ data: Collection }>(`/admin/collections/${id}`);
  }

  createCollection(data: Partial<Collection>) {
    return this.post<{ data: Collection }>("/admin/collections", data);
  }

  updateCollection(id: number, data: Partial<Collection>) {
    return this.put<{ data: Collection }>(`/admin/collections/${id}`, data);
  }

  deleteCollection(id: number) {
    return this.delete(`/admin/collections/${id}`);
  }

  // Orders
  getOrders(page = 1, status = "") {
    const qs = status ? `&status=${status}` : "";
    return this.get<PaginatedResponse<Order>>(`/admin/orders?page=${page}${qs}`);
  }

  getOrder(id: number) {
    return this.get<{ data: Order }>(`/admin/orders/${id}`);
  }

  updateOrderStatus(id: number, status: string) {
    return this.patch<{ data: Order }>(`/admin/orders/${id}/status`, {
      status,
    });
  }

  // Customers
  getCustomers(page = 1, search = "") {
    return this.get<PaginatedResponse<Customer>>(
      `/admin/customers?page=${page}&search=${encodeURIComponent(search)}`,
    );
  }

  getCustomer(id: number) {
    return this.get<{ data: Customer }>(`/admin/customers/${id}`);
  }

  // Coupons
  getCoupons(page = 1) {
    return this.get<PaginatedResponse<Coupon>>(`/admin/coupons?page=${page}`);
  }

  createCoupon(data: Partial<Coupon>) {
    return this.post<{ data: Coupon }>("/admin/coupons", data);
  }

  updateCoupon(id: number, data: Partial<Coupon>) {
    return this.put<{ data: Coupon }>(`/admin/coupons/${id}`, data);
  }

  deleteCoupon(id: number) {
    return this.delete(`/admin/coupons/${id}`);
  }

  // Analytics
  getAnalytics() {
    return this.get<{ data: Analytics }>("/admin/analytics");
  }
}

export const api = new ApiClient();
