import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'IDs das imagens na ordem desejada. O primeiro da lista será a imagem principal.',
    type: [String],
    minItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Envie pelo menos um ID de imagem' })
  image_ids: string[];
}
