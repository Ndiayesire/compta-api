import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';

@Injectable()
export class ContractTypesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContractTypeDto) {
    const existing = await this.prisma.contractType.findFirst({
      where: {
        OR: [{ code: dto.code }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Contract type with same name or code already exists',
      );
    }

    return this.prisma.contractType.create({ data: dto });
  }

  async findAll() {
    return this.prisma.contractType.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const contractType = await this.prisma.contractType.findUnique({
      where: { id },
    });

    if (!contractType) {
      throw new NotFoundException('Contract type not found');
    }

    return contractType;
  }

  async update(id: string, dto: UpdateContractTypeDto) {
    const existing = await this.prisma.contractType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contract type not found');
    }

    if (dto.code || dto.name) {
      const duplicate = await this.prisma.contractType.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                dto.code ? { code: dto.code } : {},
                dto.name ? { name: dto.name } : {},
              ],
            },
          ],
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Another contract type with same name or code already exists',
        );
      }
    }

    return this.prisma.contractType.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contractType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Contract type not found');
    }

    const used = await this.prisma.employeeContractType.count({
      where: { contractTypeId: id, deletedAt: null },
    });

    if (used > 0) {
      throw new BadRequestException(
        'Cannot delete contract type because it is used by employees',
      );
    }

    return this.prisma.contractType.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
