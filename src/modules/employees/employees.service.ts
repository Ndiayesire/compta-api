import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employees.dto';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client || client.deletedAt) {
      throw new BadRequestException('Invalid client');
    }

    return this.prisma.employee.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  // async findAll(clientId: string) {
  //   return this.prisma.employee.findMany({
  //     where: clientId ? { clientId, deletedAt: null } : { deletedAt: null },
  //     orderBy: { createdAt: 'desc' },
  //     include: {
  //       client: true,
  //     },
  //   });
  // }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: { client: true, contractType: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.employee.findMany({
      where: {
        clientId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: { contractType: true },
    });
  }
}