import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';

describe('ListingsController', () => {
  let controller: ListingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        {
          provide: ListingsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
