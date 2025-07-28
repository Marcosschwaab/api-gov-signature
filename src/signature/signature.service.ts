import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class SignatureService {
  private readonly govClientId: string;
  private readonly govClientSecret: string;
  private readonly govRedirectUri: string;
  private readonly govBaseUrl = 'https://assinador.iti.br';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.govClientId = this.configService.get<string>('GOV_CLIENT_ID');
    this.govClientSecret = this.configService.get<string>('GOV_CLIENT_SECRET');
    this.govRedirectUri = this.configService.get<string>('GOV_REDIRECT_URI');
  }

  getAuthorizationUrl(documentHash: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.govClientId,
      scope: 'sign',
      redirect_uri: this.govRedirectUri,
      state: documentHash, // Using state to pass the hash
    });
    return `${this.govBaseUrl}/oauth2/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.govRedirectUri,
    });

    const credentials = Buffer.from(
      `${this.govClientId}:${this.govClientSecret}`,
    ).toString('base64');

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
    };

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.govBaseUrl}/oauth2/token`,
        params.toString(),
        config,
      ),
    );

    return data.access_token;
  }

  async signHash(
    accessToken: string,
    documentHash: string,
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const body = {
      hashBase64: documentHash,
    };

    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.govBaseUrl}/externo/v2/assinarPKCS7`,
        body,
        config,
      ),
    );

    return data;
  }
}