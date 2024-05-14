import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class StatusDto {
  @IsOptional()
  @IsEnum(OrderStatus, {
    message: `Valid status are ${OrderStatus}`,
  })
  status: OrderStatus;

  @IsUUID(4)
  id: string;
}
