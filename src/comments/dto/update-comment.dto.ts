import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Comentário atualizado', description: 'Conteúdo do comentário' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 4, description: 'Avaliação de 1 a 5', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
}
