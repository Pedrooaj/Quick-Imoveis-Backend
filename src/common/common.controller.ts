import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BrazilianState } from './enums/brazilian-state.enum';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  @Public()
  @Get('brazilian-states')
  @ApiOperation({
    summary: 'Listar estados do Brasil',
    description:
      '**Público.** Retorna a lista de estados (nomes completos) para uso em selects de endereço. Use o valor retornado no campo `state` de endereços.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de estados',
    schema: {
      type: 'object',
      properties: {
        states: {
          type: 'array',
          items: { type: 'string' },
          example: ['Acre', 'Alagoas', 'Amapá', 'São Paulo', 'Rio de Janeiro'],
        },
      },
    },
  })
  getBrazilianStates(): { states: string[] } {
    const states = Object.values(BrazilianState) as string[];
    return { states };
  }
}
