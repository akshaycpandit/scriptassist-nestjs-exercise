import { RateLimitGuard } from "@common/guards/rate-limit.guard";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'rate-limit',
    }),
  ],
  providers: [RateLimitGuard],
  exports: [RateLimitGuard],
})
export class RateLimitModule {}
