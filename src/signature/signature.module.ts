import { Module } from '@nestjs/common';
import { SignatureController } from './signature.controller';
import { SignatureService } from './signature.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [SignatureController],
  providers: [SignatureService],
})
export class SignatureModule {}