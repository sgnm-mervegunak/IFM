import { HttpException } from '@nestjs/common';
import { catchError, firstValueFrom, map } from 'rxjs';
import { other_microservice_errors } from '../const/custom.error.object';

export async function getRequest(url: string, headers: object) {
  const responsePromise = await this.httpService
    .get(url, { headers })
    .pipe(
      catchError((error) => {
        const { status, message } = error.response?.data;
        throw new HttpException(other_microservice_errors(message), status);
      }),
    )
    .pipe(map((response: any) => response.data));

  const response = firstValueFrom(responsePromise);
  return response;
}
