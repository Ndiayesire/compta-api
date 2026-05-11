import { PrismaService } from '../../../prisma/prisma.service';

/** Délégué modèle : une même méthode (ex. findFirst) réutilise toujours le même jest.fn(). */
function createModelDelegate(): Record<string, jest.Mock> {
  const cache: Record<string, jest.Mock> = {};
  return new Proxy(
    {},
    {
      get(_target, prop: string | symbol) {
        const method = String(prop);
        if (!cache[method]) {
          cache[method] = jest.fn().mockResolvedValue(null);
        }
        return cache[method];
      },
    },
  ) as Record<string, jest.Mock>;
}

/**
 * Faux `PrismaService` pour les tests unitaires (aucune base réelle).
 * Les délégués modèle renvoient des `jest.fn().mockResolvedValue(null)` stables par modèle.
 */
export function createPrismaMock(): PrismaService {
  const models = new Map<string, Record<string, jest.Mock>>();

  const proxy = new Proxy(
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
                /** Même instance que client racine pour que les mocks `tx.*` soient les mêmes. */
                return arg(proxy);
              }
              return null;
            });
          }
          if (key === '$queryRaw' || key === '$executeRaw') {
            return jest.fn().mockResolvedValue([]);
          }
          return jest.fn().mockResolvedValue(undefined);
        }
        if (!models.has(key)) {
          models.set(key, createModelDelegate());
        }
        return models.get(key)!;
      },
    },
  ) as unknown as PrismaService;

  return proxy;
}

export const prismaMockProvider = {
  provide: PrismaService,
  useFactory: () => createPrismaMock(),
};
