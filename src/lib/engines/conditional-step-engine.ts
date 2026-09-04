/**
 * JAH Conditional Step Engine
 * Motor de Avaliação Condicional e Branching Dinâmico para Formulários, Checklists e Wizards Multi-Etapa.
 */

export type RuleOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains'
  | 'in' 
  | 'not_in' 
  | 'greater_than' 
  | 'greater_than_or_equal' 
  | 'less_than' 
  | 'less_than_or_equal' 
  | 'is_empty' 
  | 'is_not_empty' 
  | 'regex_match';

export type LogicalOperator = 'AND' | 'OR';

export interface ConditionRule {
  field: string;
  operator: RuleOperator;
  value?: unknown;
}

export interface RuleGroup {
  logicalOperator: LogicalOperator;
  rules: ConditionRule[];
  groups?: RuleGroup[];
}

export interface StepAction {
  type: 'show' | 'hide' | 'require' | 'optional' | 'skip_to' | 'disable';
  targetStepId?: string;
  targetFieldIds?: string[];
}

export interface ConditionalStepDefinition {
  id: string;
  title: string;
  order: number;
  condition?: RuleGroup;
  actionsOnMatch?: StepAction[];
  actionsOnMismatch?: StepAction[];
}

export class ConditionalStepEngine {
  /**
   * Avalia uma única regra atômica contra o estado atual do formulário.
   */
  public static evaluateRule(rule: ConditionRule, formState: Record<string, unknown>): boolean {
    const fieldValue = formState[rule.field];

    switch (rule.operator) {
      case 'equals':
        return fieldValue === rule.value;

      case 'not_equals':
        return fieldValue !== rule.value;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          return fieldValue.toLowerCase().includes(rule.value.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(rule.value);
        }
        return false;

      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          return !fieldValue.toLowerCase().includes(rule.value.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(rule.value);
        }
        return true;

      case 'in':
        if (Array.isArray(rule.value)) {
          return rule.value.includes(fieldValue);
        }
        return false;

      case 'not_in':
        if (Array.isArray(rule.value)) {
          return !rule.value.includes(fieldValue);
        }
        return true;

      case 'greater_than':
        return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue > rule.value;

      case 'greater_than_or_equal':
        return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue >= rule.value;

      case 'less_than':
        return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue < rule.value;

      case 'less_than_or_equal':
        return typeof fieldValue === 'number' && typeof rule.value === 'number' && fieldValue <= rule.value;

      case 'is_empty':
        return fieldValue === null || fieldValue === undefined || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

      case 'is_not_empty':
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

      case 'regex_match':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          try {
            const regex = new RegExp(rule.value);
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Avalia um grupo lógico completo (regras + subgrupos recursivos).
   */
  public static evaluateGroup(group: RuleGroup, formState: Record<string, unknown>): boolean {
    if (!group || !group.rules) return true;

    const ruleResults = group.rules.map((rule) => this.evaluateRule(rule, formState));
    let subGroupResults: boolean[] = [];

    if (group.groups && group.groups.length > 0) {
      subGroupResults = group.groups.map((subGroup) => this.evaluateGroup(subGroup, formState));
    }

    const allResults = [...ruleResults, ...subGroupResults];
    if (allResults.length === 0) return true;

    if (group.logicalOperator === 'AND') {
      return allResults.every(Boolean);
    } else {
      return allResults.some(Boolean);
    }
  }

  /**
   * Determina os passos visíveis e ativos com base no estado do formulário.
   */
  public static computeVisibleSteps(
    steps: ConditionalStepDefinition[],
    formState: Record<string, unknown>
  ): {
    visibleSteps: ConditionalStepDefinition[];
    hiddenStepIds: string[];
    requiredFieldIds: string[];
    disabledFieldIds: string[];
  } {
    const hiddenStepIds: string[] = [];
    const requiredFieldIds: string[] = [];
    const disabledFieldIds: string[] = [];

    const visibleSteps = steps.filter((step) => {
      if (!step.condition) return true;

      const isMatch = this.evaluateGroup(step.condition, formState);
      const activeActions = isMatch ? step.actionsOnMatch : step.actionsOnMismatch;

      if (activeActions) {
        for (const action of activeActions) {
          if (action.type === 'hide') {
            hiddenStepIds.push(step.id);
            return false;
          }
          if (action.type === 'require' && action.targetFieldIds) {
            requiredFieldIds.push(...action.targetFieldIds);
          }
          if (action.type === 'disable' && action.targetFieldIds) {
            disabledFieldIds.push(...action.targetFieldIds);
          }
        }
      }

      return isMatch;
    });

    return {
      visibleSteps: visibleSteps.sort((a, b) => a.order - b.order),
      hiddenStepIds,
      requiredFieldIds: Array.from(new Set(requiredFieldIds)),
      disabledFieldIds: Array.from(new Set(disabledFieldIds)),
    };
  }
}
