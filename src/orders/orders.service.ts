import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { OrderPaginationDto } from '../common/dto/order-pagination.dto';
import { StatusDto } from './dto/status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { NATS_SERVICE } from '../../config';
import { OrderWithProducts } from './interfaces/order-with-products.interface';
import { PaidOrderDto } from './dto/paid-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log(`Database connected`);
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productIds = createOrderDto.items.map(
        (product) => product.productId,
      );

      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_products' }, productIds),
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;

        return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((item) => {
                return {
                  price: products.find(
                    (product) => product.id === item.productId,
                  ).price,
                  productId: item.productId,
                  quantity: item.quantity,
                };
              }),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              productId: true,
              quantity: true,
              price: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((product) => {
          return {
            ...product,
            name: products.find((item) => item.id === product.productId).name,
          };
        }),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Check logs`,
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { status, limit, page } = orderPaginationDto;

    const totalPages = await this.order.count(
      status && {
        where: {
          status: status,
        },
      },
    );

    const data = await this.order.findMany({
      skip: (page - 1) * limit,
      take: limit,
      ...(status && {
        where: {
          status: status,
        },
      }),
    });

    const lastPage = Math.ceil(totalPages / limit);

    return {
      data,
      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: {
        id: id,
      },
      include: {
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((item) => item.productId);

    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_products' }, productIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((product) => {
        return {
          ...product,
          name: products.find((item) => item.id === product.productId).name,
        };
      }),
    };
  }

  async changeStatus(statusDto: StatusDto) {
    const { id, status } = statusDto;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return await this.order.update({
      where: { id },
      data: { status },
    });
  }

  async createPaymentSession(order: OrderWithProducts) {
    const paymentSession = await firstValueFrom(
      this.client.send('create.payment.session', {
        orderId: order.id,
        currency: 'usd',
        items: order.OrderItem.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }),
    );

    return paymentSession;
  }

  async paidOrder(paidOrderDto: PaidOrderDto) {
    const { orderId, receiptUrl, paymentId } = paidOrderDto;

    return await this.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paid: true,
        paidAt: new Date(),
        paymentChargeId: paymentId,
        OrderReceipt: {
          create: {
            receiptUrl,
          },
        },
      },
    });
  }
}
