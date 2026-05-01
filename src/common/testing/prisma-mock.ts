import { PrismaService } from '../../../prisma/prisma.service';

function modelDelegate(): Record<string, jest.Mock> {
  return new Proxy(
    {},
    {
      get() {
        return jest.fn().mockResolvedValue(null);
      },
    },
  ) as Record<string, jest.Mock>;
}

/**
 * Faux `PrismaService` pour les tests unitaires (aucune base réelle).
 * Les délégués modèle renvoient des `jest.fn().mockResolvedValue(null)`.
 */
export function createPrismaMock(): PrismaService {
  return new Proxy(
    {},
    {
      get(_target, prop: string | symbol) {
        const key = String(prop);
        if (key.startsWith('$')) {
          if (key === '$connect' || key === '$disconnect') {
            return jest.fn().mockResolvedValue(undefined);
          }
          if (key === '$transaction') {
            return jest.fn(async (arg: unknown) => {
              if (typeof arg === 'function') {
                return arg(createPrismaMock());
              }
              return null;
            });
          }
          if (key === '$queryRaw' || key === '$executeRaw') {
            return jest.fn().mockResolvedValue([]);
          }
          return jest.fn().mockResolvedValue(undefined);
        }
        return modelDelegate();
      },
    },
  ) as unknown as PrismaService;
}

export const prismaMockProvider = {
  provide: PrismaService,
  useFactory: () => createPrismaMock(),
};
