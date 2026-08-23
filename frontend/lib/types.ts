/** DTO types mirrored from the Spring backend (com.orangy.*.dto). */

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/* ── auth ── */
export type OtpPurpose = "SIGNUP" | "LOGIN";

export type OtpResponse = {
  message: string;
  email: string;
  purpose: OtpPurpose;
  otpExpirySeconds: number;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  userId: string;
  name: string;
  role: "USER" | "ADMIN";
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
};

/* ── catalog ── */
export type ProductSummary = {
  id: string;
  name: string;
  category: string;
  startingPrice: number | null;
  thumbnailUrl: string | null;
};

export type Variant = {
  id: string;
  label: string;
  quantityValue: number;
  unit: string;
  price: number;
  stockCount: number;
  thumbnailImageUrl: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  organicCertified: boolean;
  farmSource: string | null;
  active: boolean;
  variants: Variant[];
};

/** Spring Data Page<T> */
export type Page<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

/* ── media ── */
export type MediaAsset = {
  id: string;
  refType: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  refId: string;
  altText: string | null;
  sortOrder: number;
};

/* ── cart ── */
export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  thumbnailUrl?: string | null;
};

export type Cart = {
  userId?: string;
  items: CartItem[];
  subtotal: number;
  totalItems?: number;
};

/* ── addresses ── */
export type Address = {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone?: string | null;
  isDefault?: boolean;
};

export type AddressRequest = Omit<Address, "id">;

/* ── orders ── */
export type OrderItem = {
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  razorpayOrderId: string | null;
  deliveryAddress: Address;
  items: OrderItem[];
  createdAt: string;
};

/* ── reviews ── */
export type Review = {
  id: string;
  productId: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment: string | null;
  approved?: boolean;
  createdAt: string;
};

/* ── admin requests ── */
export type ProductCreateRequest = {
  name: string;
  description?: string;
  category: string;
  organicCertified?: boolean;
  farmSource?: string;
};

export type VariantCreateRequest = {
  label: string;
  price: number;
  unit: string;
  quantityValue: number;
  stockCount: number;
  thumbnailImageUrl?: string;
};
