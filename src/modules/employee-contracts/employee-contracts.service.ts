import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEmployeeContractDto } from './dto/create-employee-contract.dto';
import { UpdateEmployeeContractDto } from './dto/update-employee-contract.dto';

const contractInclude = {
  contractType: true,
  employee: {
    include: {
      client: true,
    },
  },
} satisfies Prisma.EmployeeContractTypeInclude;

@Injectable()
export class EmployeeContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertEmployeeInCompany(employeeId: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        deletedAt: null,
        client: { companyId, deletedAt: null },
      },
      include: { client: true },
    });
    if (!employee) {
      throw new BadRequestException(
        'Employee not found or does not belong to your company',
      );
    }
    return employee;
  }

  private async assertContractTypeExists(contractTypeId: string) {
    const ct = await this.prisma.contractType.findUnique({
      where: { id: contractTypeId },
    });
    if (!ct) {
      throw new BadRequestException('Invalid contract type');
    }
    return ct;
  }

  async create(dto: CreateEmployeeContractDto, companyId: string) {
    await this.assertEmployeeInCompany(dto.employeeId, companyId);
    await this.assertContractTypeExists(dto.contractTypeId);
    const isActive = dto.isActive ?? true;

    return this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.employeeContractType.updateMany({
          where: {
            employeeId: dto.employeeId,
            deletedAt: null,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      return tx.employeeContractType.create({
        data: {
          employeeId: dto.employeeId,
          contractTypeId: dto.contractTypeId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          jobTitle: dto.jobTitle,
          ...(dto.salary !== undefined && { salary: dto.salary }),
          isManager: dto.isManager ?? false,
          isActive,
        },
        include: contractInclude,
      });
    });
  }

  async findAll(companyId: string) {
    return this.prisma.employeeContractType.findMany({
      where: {
        deletedAt: null,
        employee: {
          deletedAt: null,
          client: { companyId, deletedAt: null },
        },
      },
      include: contractInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmployee(employeeId: string, companyId: string) {
    await this.assertEmployeeInCompany(employeeId, companyId);

    return this.prisma.employeeContractType.findMany({
      where: {
        employeeId,
        deletedAt: null,
      },
      include: contractInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const row = await this.prisma.employeeContractType.findFirst({
      where: {
        id,
        deletedAt: null,
        employee: {
          deletedAt: null,
          client: { companyId, deletedAt: null },
        },
      },
      include: contractInclude,
    });

    if (!row) {
      throw new NotFoundException('Employee contract not found');
    }

    return row;
  }

  async update(
    id: string,
    dto: UpdateEmployeeContractDto,
    companyId: string,
  ) {
    const current = await this.findOne(id, companyId);

    if (dto.employeeId) {
      await this.assertEmployeeInCompany(dto.employeeId, companyId);
    }
    if (dto.contractTypeId) {
      await this.assertContractTypeExists(dto.contractTypeId);
    }

    const {
      employeeId,
      contractTypeId,
      startDate,
      endDate,
      jobTitle,
      salary,
      isManager,
      isActive,
    } = dto;

    const data: Prisma.EmployeeContractTypeUpdateInput = {
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: new Date(endDate) }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(salary !== undefined && { salary }),
      ...(isManager !== undefined && { isManager }),
      ...(isActive !== undefined && { isActive }),
      ...(employeeId !== undefined && {
        employee: { connect: { id: employeeId } },
      }),
      ...(contractTypeId !== undefined && {
        contractType: { connect: { id: contractTypeId } },
      }),
    };

    return this.prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.employeeContractType.updateMany({
          where: {
            employeeId: employeeId ?? current.employee.id,
            deletedAt: null,
            isActive: true,
            NOT: { id },
          },
          data: { isActive: false },
        });
      }

      return tx.employeeContractType.update({
        where: { id },
        data,
        include: contractInclude,
      });
    });
  }

  async remove(id: string, companyId: string) {
    await this.findOne(id, companyId);

    return this.prisma.employeeContractType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
