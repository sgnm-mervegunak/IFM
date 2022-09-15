import { HttpService } from '@nestjs/axios';
import { HttpException, Injectable } from '@nestjs/common';
import { catchError, map, firstValueFrom } from 'rxjs';

import { other_microservice_errors } from '../const/custom.error.object';

@Injectable()
export class HttpRequestHandler {
  constructor(private readonly httpService: HttpService) {}

  async get(url: string, headers) {
    const responsePronise = await this.httpService
      .get(url, { headers })
      .pipe(
        catchError((error) => {
          const { status, message } = error.response?.data;
          throw new HttpException(other_microservice_errors(message), 400);
        }),
      )
      .pipe(map((response) => response.data));

    const response = await firstValueFrom(responsePronise);
    return response;
  }
}
