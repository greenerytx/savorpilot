import { IsString, IsUrl, Matches } from 'class-validator';

export class SubmitYouTubeDto {
  @IsString()
  @IsUrl({}, { message: 'Must be a valid URL' })
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/,
    {
      message: 'Must be a valid YouTube URL (youtube.com/watch, youtu.be, or youtube.com/shorts)',
    },
  )
  url: string;
}
