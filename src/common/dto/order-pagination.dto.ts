import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatusList } from '../../orders/enums/order.enum';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList}`,
  })
  status: OrderStatus;
}
