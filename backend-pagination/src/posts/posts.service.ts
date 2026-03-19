import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma.service';

import { PaginatedResponse } from './types';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) { }

  create(createPostDto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        published: false,
      },
    });
  }

  async findAll(pagination: { page: number, limit: number }): Promise<PaginatedResponse> {
    const total = await this.prisma.post.count();
    const currentPage = pagination.page;
    const totalPages = Math.ceil(total / pagination.limit);
    const posts = await this.prisma.post.findMany({ skip: (currentPage - 1) * pagination.limit, take: Number(pagination.limit) });

    return { posts, meta: { currentPage, totalPages } };
  }

  findOne(id: number) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });
  }

  remove(id: number) {
    return this.prisma.post.delete({
      where: { id },
    });
  }

  seed() {
    const data = Array.from({ length: 50000 }, (_, index) => ({
      title: `Hello World ${index}`,
      content: `This is a test post ${index}`,
    }));

    return this.prisma.post.createMany({ data });
  }
}
