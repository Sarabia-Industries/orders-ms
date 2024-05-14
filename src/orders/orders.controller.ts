import { Controller, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';

import { OrderPaginationDto } from 'src/common/dto/order-pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { StatusDto } from './dto/status.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('create_order')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
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
}
