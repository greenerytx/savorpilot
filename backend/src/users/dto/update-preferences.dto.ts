import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({ required: false, description: 'Preferred language (en, ar)' })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ar'])
  language?: string;

  @ApiProperty({ required: false, description: 'Default number of servings' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  defaultServings?: number;

  @ApiProperty({ required: false, description: 'Preferred units (metric, imperial)' })
  @IsOptional()
  @IsString()
  @IsIn(['metric', 'imperial'])
  preferredUnits?: string;

  @ApiProperty({ required: false, description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
