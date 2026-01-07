import { IsString, IsUrl, IsOptional, IsEnum } from 'class-validator';

export class ImportUrlDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  fallbackContent?: string; // For cases where URL can't be fetched (e.g., Facebook)
}

export class ImportContentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceAuthor?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
