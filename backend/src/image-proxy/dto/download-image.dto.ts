import { IsString, IsUUID } from 'class-validator';

export class DownloadImageDto {
  @IsString()
  url: string;

  @IsUUID()
  recipeId: string;
}
