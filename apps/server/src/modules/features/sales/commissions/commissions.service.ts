import { Injectable } from '@nestjs/common';
import { CommissionRepository } from './commissions.repository';
import {
  CommissionRecordNotFoundException,
  CommissionRecordStateException,
  CommissionRuleNotFoundException,
} from './commissions.exception';
import { AuditService } from '@/modules/audit/audit.service';
import type {
  CommissionRecordListParams,
  CommissionRuleCreateInput,
  CommissionRuleListParams,
  CommissionRuleUpdateInput,
} from '@rona/types/sales';

@Injectable()
export class CommissionService {
  constructor(
    private readonly repo: CommissionRepository,
    private readonly audit: AuditService,
  ) {}

  async createRule(data: CommissionRuleCreateInput) {
    const rule = await this.repo.createRule(data);
    await this.audit.record({
      organizationId: rule.organizationId,
      action: 'COMMISSION_RULE_CREATE',
      entityType: 'CommissionRule',
      entityId: rule.id,
      after: rule,
    });
    return rule;
  }

  async listRules(params: CommissionRuleListParams) {
    return this.repo.listRules(params);
  }

  async findRule(id: string) {
    const rule = await this.repo.findRule(id);
    if (!rule) throw new CommissionRuleNotFoundException();
    return rule;
  }

  async updateRule(id: string, data: CommissionRuleUpdateInput) {
    const updated = await this.repo.updateRule(id, data);
    if (!updated) throw new CommissionRuleNotFoundException();
    await this.audit.record({
      organizationId: updated.organizationId,
      action: 'COMMISSION_RULE_UPDATE',
      entityType: 'CommissionRule',
      entityId: id,
      after: updated,
    });
    return updated;
  }

  async listRecords(params: CommissionRecordListParams) {
    return this.repo.listRecords(params);
  }

  async approveRecord(id: string) {
    const record = await this.repo.findRecord(id);
    if (!record) throw new CommissionRecordNotFoundException();
    if (record.status !== 'PENDING') {
      throw new CommissionRecordStateException(
        'Only pending commissions can be approved',
      );
    }

    const approved = await this.repo.updateRecordStatus(id, 'APPROVED', {
      approvedAt: new Date(),
    });
    await this.audit.record({
      organizationId: approved.organizationId,
      action: 'COMMISSION_RECORD_APPROVE',
      entityType: 'CommissionRecord',
      entityId: id,
      after: approved,
    });
    return approved;
  }

  async payRecord(id: string) {
    const record = await this.repo.findRecord(id);
    if (!record) throw new CommissionRecordNotFoundException();
    if (record.status !== 'APPROVED') {
      throw new CommissionRecordStateException(
        'Only approved commissions can be marked paid',
      );
    }

    const paid = await this.repo.updateRecordStatus(id, 'PAID', {
      paidAt: new Date(),
    });
    await this.audit.record({
      organizationId: paid.organizationId,
      action: 'COMMISSION_RECORD_MARK_PAID',
      entityType: 'CommissionRecord',
      entityId: id,
      after: paid,
    });
    return paid;
  }
}
