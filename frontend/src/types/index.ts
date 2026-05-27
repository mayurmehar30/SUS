export interface School {
  id: number;
  name: string;
  // Contact person 1
  contactPerson: string;
  contactPersonRole?: string;
  mobile: string;
  email: string;
  // Contact person 2
  contactPerson2Name?: string;
  contactPerson2Role?: string;
  contactPerson2Mobile?: string;
  contactPerson2Email?: string;
  address: string;
  schoolCode: string;
  classNames?: string[];
  logoUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "SALESMAN" | "FACTORY_MANAGER" | "SCHOOL_REP";
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  active: boolean;
}

export interface SubCategory {
  id: number;
  name: string;
  category: Category;
  active: boolean;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  imageType: "FRONT" | "BACK" | "FABRIC" | "OTHER";
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  size: string;
  color: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  sku: string;
  description: string;
  fabricType: string;
  color: string;
  gender: string;
  season: string;
  basePrice: number;
  gstPercent: number;
  discountPercent: number;
  finalPrice: number;
  sizeOptions: string;
  active: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ClassStudentCount {
  id?: number;
  className: string;
  boysCount: number;
  girlsCount: number;
  totalCount: number;
  remarks?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  productImageUrl?: string;
  productImages?: string[];
  productVariantId?: number;
  categoryId?: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
  totalQuantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  classStudentCounts: ClassStudentCount[];
}

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "CUTTING"
  | "STITCHING"
  | "PACKING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export interface AdminEdit {
  id: number;
  editedBy: string;
  editedAt: string;
  summary: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  orderToken: string;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID";
  school: School;
  items: OrderItem[];
  totalAmount: number;
  gstAmount: number;
  specialDiscount: number;
  grandTotal: number;
  advanceAmount: number;
  remainingAmount: number;
  notes?: string;
  submittedAt?: string;
  createdAt: string;
  locked?: boolean;
  adminEdits?: AdminEdit[];
}

export interface DashboardStats {
  totalSchools: number;
  totalProducts: number;
  pendingOrders: number;
  activeOrders: number;
  inProductionOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AppSetting {
  key: string;
  value: string;
  label: string;
}

export interface AppSettings {
  support_phone?: string;
  support_email?: string;
  company_name?: string;
}
