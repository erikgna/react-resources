import { Module } from '@nestjs/common';
import { PostsModule } from './posts/posts.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PostsModule
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
