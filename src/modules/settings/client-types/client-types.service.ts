import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateClientTypeDto } from './dto/create-client-type.dto';
import { UpdateClientTypeDto } from './dto/update-client-type.dto';

/** Legacy module: `client_types` was removed from the database schema. */
@Injectable()
export class ClientTypesService {
  create(_dto: CreateClientTypeDto) {
    throw new NotImplementedException('Client types are not part of the current schema');
  }

  findAll() {
    throw new NotImplementedException('Client types are not part of the current schema');
  }

  findOne(_id: string) {
    throw new NotImplementedException('Client types are not part of the current schema');
  }

  update(_id: string, _dto: UpdateClientTypeDto) {
    throw new NotImplementedException('Client types are not part of the current schema');
  }

  remove(_id: string) {
    throw new NotImplementedException('Client types are not part of the current schema');
  }
}
