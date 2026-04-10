import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employees.dto';

const employeeInclude = {
  client: true,
  employeeContractTypes: {
    where: { deletedAt: null },
    include: { contractType: true },
    orderBy: { createdAt: 'desc' as const },
  },
};

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

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          clientId: dto.clientId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          isActive: dto.isActive ?? true,
        },
      });

      await tx.employeeContractType.create({
        data: {
          employeeId: employee.id,
          contractTypeId: dto.contractTypeId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          jobTitle: dto.jobTitle,
        },
      });

      return tx.employee.findUniqueOrThrow({
        where: { id: employee.id },
        include: employeeInclude,
      });
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: employeeInclude,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const {
      contractTypeId,
      startDate,
      endDate,
      jobTitle,
      ...employeeRest
    } = dto;

    await this.prisma.employee.update({
      where: { id },
      data: {
        ...employeeRest,
      },
    });

    if (
      contractTypeId !== undefined ||
      startDate !== undefined ||
      endDate !== undefined ||
      jobTitle !== undefined
    ) {
      const latest = await this.prisma.employeeContractType.findFirst({
        where: { employeeId: id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        await this.prisma.employeeContractType.update({
          where: { id: latest.id },
          data: {
            ...(contractTypeId !== undefined && {
              contractType: { connect: { id: contractTypeId } },
            }),
            ...(startDate !== undefined && { startDate: new Date(startDate) }),
            ...(endDate !== undefined && { endDate: new Date(endDate) }),
            ...(jobTitle !== undefined && { jobTitle }),
          },
        });
      }
    }

    return this.findOne(id);
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
      include: employeeInclude,
    });
  }
}
