import { OrderStatus } from '@prisma/client';

export interface OrderWithProducts {
  OrderItem: OrderItem[];
  id: string;
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;
  paid: boolean;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  name: any;
  productId: number;
  quantity: number;
  price: number;
}
[];
