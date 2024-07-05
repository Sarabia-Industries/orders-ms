import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { NATS_SERVICE, envs } from '../../config';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    ClientsModule.register({
      clients: [
        {
          name: NATS_SERVICE,
          transport: Transport.NATS,
          options: {
            servers: envs.natsServers,
          },
        },
      ],
    }),
  ],
})
export class OrdersModule {}
