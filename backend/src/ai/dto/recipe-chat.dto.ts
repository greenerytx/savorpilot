import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ValidateNested, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum ChatMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export class ChatMessageDto {
  @ApiProperty({ enum: ChatMessageRole })
  @IsEnum(ChatMessageRole)
  role: ChatMessageRole;

  @ApiProperty({ example: 'What can I substitute for buttermilk?' })
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class RecipeChatRequestDto {
  @ApiProperty({ example: 'What can I substitute for buttermilk?' })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({
    type: [ChatMessageDto],
    description: 'Previous conversation history (max 10 messages)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[];
}

export class RecipeChatResponseDto {
  @ApiProperty({ example: "Since this recipe uses baking soda, you can make a buttermilk substitute by mixing 1 cup of milk with 1 tablespoon of lemon juice or white vinegar. Let it sit for 5 minutes before using." })
  message: string;

  @ApiPropertyOptional({ description: 'Suggested follow-up questions' })
  suggestions?: string[];
}
