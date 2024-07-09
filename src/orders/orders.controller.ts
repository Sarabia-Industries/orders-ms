import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { OrdersService } from './orders.service';
import { OrderPaginationDto } from '../common/dto/order-pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { StatusDto } from './dto/status.dto';
import { OrderWithProducts } from './interfaces/order-with-products.interface';
import { PaidOrderDto } from './dto/paid-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('create_order')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order: OrderWithProducts =
      await this.ordersService.create(createOrderDto);

    const paymentSession = await this.ordersService.createPaymentSession(order);

    return {
      ok: true,
      order,
      paymentSession,
    };
  }

  @MessagePattern('find_all_orders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('find_one_order')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('change_order_status')
  changeStatus(@Payload() statusDto: StatusDto) {
    return this.ordersService.changeStatus(statusDto);
  }

  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paidOrderDto: PaidOrderDto) {
    console.log(paidOrderDto);

    return this.ordersService.paidOrder(paidOrderDto);
  }
}
