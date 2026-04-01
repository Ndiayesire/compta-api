import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateFlagClientDto } from './dto/create-flag-client.dto';
import { UpdateFlagClientDto } from './dto/update-flag-client.dto';

@Injectable()
export class ClientFlagService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFlagClientDto) {
    return this.prisma.clientFlag.create({ data: dto });
  }

  findAll() {
    return this.prisma.clientFlag.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.clientFlag.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateFlagClientDto) {
    return this.prisma.clientFlag.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.clientFlag.update({ where: { id }, data: { isActive: false } });
  }
}