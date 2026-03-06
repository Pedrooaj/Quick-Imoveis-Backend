import { PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

/**
 * Atualização parcial de imóvel. Todos os campos são opcionais.
 */
export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
