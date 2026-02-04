import { Module } from '@nestjs/common';
import { DemoMinutesService } from './demo-minutes.service';
import { DemoMinutesController } from './demo-minutes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DemoMinutesController],
    providers: [DemoMinutesService],
    exports: [DemoMinutesService],
})
export class DemoMinutesModule { }
