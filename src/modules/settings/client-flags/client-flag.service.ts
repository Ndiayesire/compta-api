import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateFlagClientDto } from './dto/create-flag-client.dto';
import { UpdateFlagClientDto } from './dto/update-flag-client.dto';

/** Legacy module: `client_flags` was removed from the database schema. */
@Injectable()
export class ClientFlagService {
  create(_dto: CreateFlagClientDto) {
    throw new NotImplementedException('Client flags are not part of the current schema');
  }

  findAll() {
    throw new NotImplementedException('Client flags are not part of the current schema');
  }

  findOne(_id: string) {
    throw new NotImplementedException('Client flags are not part of the current schema');
  }

  update(_id: string, _dto: UpdateFlagClientDto) {
    throw new NotImplementedException('Client flags are not part of the current schema');
  }

  remove(_id: string) {
    throw new NotImplementedException('Client flags are not part of the current schema');
  }
}
