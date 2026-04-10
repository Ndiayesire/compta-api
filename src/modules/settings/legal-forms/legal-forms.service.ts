import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateLegalFormDto } from './dto/create-legal-form.dto';
import { UpdateLegalFormDto } from './dto/update-legal-form.dto';

@Injectable()
export class LegalFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLegalFormDto) {
    const existing = await this.prisma.legalForm.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException(`Legal form "${dto.name}" already exists`);

    return this.prisma.legalForm.create({
      data: {
        name: dto.name,
        code: dto.code,
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async findAll() {
    return this.prisma.legalForm.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const legalForm = await this.prisma.legalForm.findUnique({ where: { id } });
    if (!legalForm) throw new NotFoundException(`Legal form ${id} not found`);
    return legalForm;
  }

  async update(id: string, dto: UpdateLegalFormDto) {
    await this.findOne(id);
    return this.prisma.legalForm.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.legalForm.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
