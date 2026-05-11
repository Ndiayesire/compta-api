import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { parseEmployeeImportWorkbook } from './employee-excel-import';

const employeeInclude = {
  client: true,
  identificationType: true,
  employeeContractTypes: {
    where: { deletedAt: null },
    include: { contractType: true },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  private async assertClientExists(clientId: string): Promise<void> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client || client.deletedAt) {
      throw new BadRequestException('Invalid client');
    }
  }

  private async assertClientBelongsToCompany(
    clientId: string,
    companyId: string,
  ): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId, deletedAt: null },
    });
    if (!client) {
      throw new BadRequestException(
        'Client not found or does not belong to your company',
      );
    }
  }

  private async assertContractTypeExists(contractTypeId: string): Promise<void> {
    const contractType = await this.prisma.contractType.findFirst({
      where: { id: contractTypeId, isActive: true },
    });
    if (!contractType) {
      throw new BadRequestException('Invalid contract type');
    }
  }

  private async assertIdentificationTypeExists(
    identificationTypeId: string,
  ): Promise<void> {
    const identificationType = await this.prisma.identificationType.findFirst({
      where: { id: identificationTypeId, isActive: true },
    });
    if (!identificationType) {
      throw new BadRequestException('Invalid identification type');
    }
  }

  async create(dto: CreateEmployeeDto) {
    await this.assertClientExists(dto.clientId);
    await this.assertContractTypeExists(dto.contractTypeId);
    if (dto.identificationTypeId) {
      await this.assertIdentificationTypeExists(dto.identificationTypeId);
    }

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          clientId: dto.clientId,
          ...(dto.identificationTypeId && {
            identificationTypeId: dto.identificationTypeId,
          }),
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          isActive: dto.isActive ?? true,
          ...(dto.socialInsuranceNumber !== undefined && {
            socialInsuranceNumber: dto.socialInsuranceNumber,
          }),
          ...(dto.identityNumber !== undefined && {
            identityNumber: dto.identityNumber,
          }),
        },
      });

      await tx.employeeContractType.create({
        data: {
          employeeId: employee.id,
          contractTypeId: dto.contractTypeId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          jobTitle: dto.jobTitle,
          ...(dto.salary !== undefined && { salary: dto.salary }),
          isManager: dto.isManager ?? false,
          isActive: dto.isActive ?? true,
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

    if (dto.clientId !== undefined) {
      await this.assertClientExists(dto.clientId);
    }
    if (dto.identificationTypeId !== undefined) {
      await this.assertIdentificationTypeExists(dto.identificationTypeId);
    }

    const {
      identificationTypeId,
      ...employeeRest
    } = dto;

    await this.prisma.employee.update({
      where: { id },
      data: {
        ...employeeRest,
        ...(identificationTypeId !== undefined && { identificationTypeId }),
      },
    });

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

  /**
   * Import employés depuis un **.xlsx** (1ʳᵉ feuille, 1ʳᵉ ligne = en-têtes français).
   * Le **client** est fixé par `clientId` (query) — doit appartenir à la société du JWT.
   * Résolution par **nom** : type de contrat et type d’identification (catalogues).
   */
  async importFromExcelBuffer(
    buffer: Buffer,
    companyId: string,
    clientId: string,
  ) {
    await this.assertClientBelongsToCompany(clientId, companyId);
    const parsed = await parseEmployeeImportWorkbook(this.prisma, clientId, buffer);

    const errors: { row: number; message: string }[] = [];
    const created: Array<Awaited<ReturnType<EmployeesService['create']>>> = [];

    for (const item of parsed) {
      if ('error' in item) {
        errors.push({ row: item.rowNumber, message: item.error });
        continue;
      }
      try {
        const data = await this.create(item.dto);
        created.push(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({ row: item.rowNumber, message });
      }
    }

    return {
      createdCount: created.length,
      failedCount: errors.length,
      created,
      errors,
    };
  }
}
