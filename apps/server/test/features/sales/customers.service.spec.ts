import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from '@/modules/features/sales/customers/customers.service';
import { CustomerRepository } from '@/modules/features/sales/customers/customers.repository';

describe('CustomerService', () => {
  let service: CustomerService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomerService, CustomerRepository],
    }).compile();
    service = module.get<CustomerService>(CustomerService);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
