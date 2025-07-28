
import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { SignatureService } from './signature.service';
import { Response } from 'express';

class StartSignatureDto {
  hash: string;
}

@Controller('signature')
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  @Post()
  startSignature(@Body() startSignatureDto: StartSignatureDto) {
    const { hash } = startSignatureDto;
    const authorizationUrl = this.signatureService.getAuthorizationUrl(hash);
    return { url: authorizationUrl };
  }

  @Get('callback')
  async signatureCallback(
    @Query('code') code: string,
    @Query('state') documentHash: string,
    @Res() res: Response,
  ) {
    try {
      const accessToken = await this.signatureService.getAccessToken(code);
      const signature = await this.signatureService.signHash(
        accessToken,
        documentHash,
      );
    // Redirecionar ou enviar a assinatura de volta ao cliente
      res.json(signature);
    } catch (error) {
      // Handle errors appropriately
      res.status(500).json({ message: 'Failed to sign document', error: error.message });
    }
  }
}
