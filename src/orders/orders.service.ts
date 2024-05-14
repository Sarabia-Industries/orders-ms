import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from '../common/dto/order-pagination.dto';
import { StatusDto } from './dto/status.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('OrdersService');

  onModuleInit() {
    this.$connect();
    this.logger.log(`Database connected`);
  }

  async create(createOrderDto: CreateOrderDto) {
    return await this.order.create({
      data: createOrderDto,
    });
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
        id,
      },
    });

    if (!order)
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });

    return order;
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
}
