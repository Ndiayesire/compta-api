import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContractTypesService } from './contract-types.service';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';

@Controller('contract-types')
export class ContractTypesController {
  constructor(private readonly contractTypesService: ContractTypesService) {}

  @Post()
  create(@Body() createContractTypeDto: CreateContractTypeDto) {
    return this.contractTypesService.create(createContractTypeDto);
  }

  @Get()
  findAll() {
    return this.contractTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractTypesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractTypeDto: UpdateContractTypeDto) {
    return this.contractTypesService.update(+id, updateContractTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractTypesService.remove(+id);
  }
}
