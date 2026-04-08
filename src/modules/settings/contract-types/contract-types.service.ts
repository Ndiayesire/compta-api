import { Injectable } from '@nestjs/common';
import { CreateContractTypeDto } from './dto/create-contract-type.dto';
import { UpdateContractTypeDto } from './dto/update-contract-type.dto';

@Injectable()
export class ContractTypesService {
  create(createContractTypeDto: CreateContractTypeDto) {
    return 'This action adds a new contractType';
  }

  findAll() {
    return `This action returns all contractTypes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contractType`;
  }

  update(id: number, updateContractTypeDto: UpdateContractTypeDto) {
    return `This action updates a #${id} contractType`;
  }

  remove(id: number) {
    return `This action removes a #${id} contractType`;
  }
}
