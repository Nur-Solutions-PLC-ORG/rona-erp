import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ApiResponse } from '@rona/types/api';
import z, { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = z.flattenError(result.error);

      const response: ApiResponse<never> = {
        success: false,
        message: 'Validation failed! Please use the correct format.',
        errors: errors.fieldErrors,
      };

      throw new BadRequestException(response);
    }

    return result.data;
  }
}
