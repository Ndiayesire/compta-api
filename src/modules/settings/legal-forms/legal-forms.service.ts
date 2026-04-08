import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateLegalFormDto } from './dto/create-legal-form.dto';
import { UpdateLegalFormDto } from './dto/update-legal-form.dto';

@Injectable()
export class LegalFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLegalFormDto) {
    const existing = await this.prisma.legalForm.findUnique({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException(`Legal form "${dto.name}" already exists`);

    return this.prisma.legalForm.create({ data: dto });
  }

  async findAll() {
    return this.prisma.legalForm.findMany({
      orderBy: { createdAt: 'desc' },
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
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  // async seed() {
  //   const legalForms = [
  //     { name: 'SARL', description: 'Société à Responsabilité Limitée' },
  //     { name: 'SAS', description: 'Société par Actions Simplifiée' },
  //     { name: 'SASU', description: 'Société par Actions Simplifiée Unipersonnelle' },
  //     { name: 'SA', description: 'Société Anonyme' },
  //     { name: 'SNC', description: 'Société en Nom Collectif' },
  //     { name: 'EI', description: 'Entreprise Individuelle' },
  //     { name: 'EIRL', description: 'Entreprise Individuelle à Responsabilité Limitée' },
  //     { name: 'EURL', description: 'Entreprise Unipersonnelle à Responsabilité Limitée' },
  //     { name: 'GIE', description: 'Groupement d\'Intérêt Économique' },
  //     { name: 'ASSO', description: 'Association' },
  //     { name: 'ONG', description: 'Organisation Non Gouvernementale' },
  //     { name: 'OTHER', description: 'Autre forme juridique' },
  //   ];

  //   const data = await Promise.all(
  //     legalForms.map((lf) =>
  //       this.prisma.legalForm.upsert({
  //         where: { name: lf.name },
  //         update: {},
  //         create: lf,
  //       }),
  //     ),
  //   );

  //   return data;
  // }
}