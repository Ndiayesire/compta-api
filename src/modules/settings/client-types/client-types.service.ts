import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateClientTypeDto } from './dto/create-client-type.dto';
import { UpdateClientTypeDto } from './dto/update-client-type.dto';

@Injectable()
export class ClientTypesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateClientTypeDto) {
    return this.prisma.clientType.create({ 
        data: dto 
    });
  }

  findAll() {
    return this.prisma.clientType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
    
  }

  findOne(id: string) {
    return this.prisma.clientType.findUnique({ 
        where: { id } 
    });
  }

  update(id: string, dto: UpdateClientTypeDto) {
    return this.prisma.clientType.update({
        where: { id }, data: dto 
    });
  }

  remove(id: string) {
    return this.prisma.clientType.update({
        where: { id },
        data: { isActive: false },
    });
 }
}