import { Icon, PButton, PCard, PSelect, TextField } from "../polaris";
import {
  FIELD_LABELS,
  OPERATOR_LABELS,
  emptyRule,
  isBooleanField,
  isNumericField,
  operatorsFor,
} from "./rules";
import type {
  CollectionRule,
  CollectionRuleField,
  CollectionRuleOperator,
  CollectionType,
} from "../../types";

interface ConditionsEditorProps {
  type: CollectionType;
  rules: CollectionRule[];
  rulesMatch: "all" | "any";
  matchedCount: number;
  onTypeChange: (type: CollectionType) => void;
  onRulesChange: (rules: CollectionRule[]) => void;
  onRulesMatchChange: (match: "all" | "any") => void;
}

export function ConditionsEditor({
  type,
  rules,
  rulesMatch,
  matchedCount,
  onTypeChange,
  onRulesChange,
  onRulesMatchChange,
}: ConditionsEditorProps) {
  const patchRule = (index: number, values: Partial<CollectionRule>) => {
    onRulesChange(rules.map((rule, i) => (i === index ? { ...rule, ...values } : rule)));
  };

  return (
    <PCard title="Productos">
      <div className="flex flex-col gap-3">
        <PSelect
          label="Tipo de colección"
          value={type}
          onChange={(event) => onTypeChange(event.target.value as CollectionType)}
          options={[
            { value: "manual", label: "Manual" },
            { value: "automatic", label: "Automática" },
          ]}
          helpText={
            type === "manual"
              ? "Los productos se agregan uno a uno."
              : "Los productos entran solos si cumplen las condiciones."
          }
        />

        {type === "automatic" && (
          <>
            <PSelect
              label="Los productos deben coincidir"
              value={rulesMatch}
              onChange={(event) => onRulesMatchChange(event.target.value as "all" | "any")}
              options={[
                { value: "all", label: "Con todas las condiciones" },
                { value: "any", label: "Con cualquier condición" },
              ]}
            />

            <div className="flex flex-col gap-2">
              {rules.map((rule, index) => (
                <ConditionRow
                  key={index}
                  rule={rule}
                  onChange={(values) => patchRule(index, values)}
                  onRemove={() => onRulesChange(rules.filter((_, i) => i !== index))}
                />
              ))}

              {rules.length === 0 && (
                <p className="text-[13px] text-ink-sub">
                  Sin condiciones la colección queda vacía.
                </p>
              )}
            </div>

            <PButton
              size="slim"
              icon="plus"
              onClick={() => onRulesChange([...rules, emptyRule()])}
            >
              Agregar condición
            </PButton>

            <p className="flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-sub">
              <Icon name="inventory" className="size-4" />
              {matchedCount} {matchedCount === 1 ? "producto coincide" : "productos coinciden"}
            </p>
          </>
        )}
      </div>
    </PCard>
  );
}

interface ConditionRowProps {
  rule: CollectionRule;
  onChange: (values: Partial<CollectionRule>) => void;
  onRemove: () => void;
}

function ConditionRow({ rule, onChange, onRemove }: ConditionRowProps) {
  const operators = operatorsFor(rule.field);
  const boolean = isBooleanField(rule.field);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line p-2">
      <div className="flex items-start gap-1.5">
        <div className="flex-1">
          <PSelect
            label="Campo"
            labelHidden
            value={rule.field}
            onChange={(event) => {
              const field = event.target.value as CollectionRuleField;
              const allowed = operatorsFor(field);

              onChange({
                field,
                // El operador anterior puede no aplicar al campo nuevo.
                operator: allowed.includes(rule.operator) ? rule.operator : allowed[0],
                value: isBooleanField(field) ? "1" : rule.value,
              });
            }}
            options={(Object.keys(FIELD_LABELS) as CollectionRuleField[]).map((field) => ({
              value: field,
              label: FIELD_LABELS[field],
            }))}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-sub transition-colors hover:bg-critical-bg hover:text-critical-ink"
          aria-label="Quitar condición"
        >
          <Icon name="close" />
        </button>
      </div>

      <PSelect
        label="Operador"
        labelHidden
        value={rule.operator}
        onChange={(event) => onChange({ operator: event.target.value as CollectionRuleOperator })}
        options={operators.map((operator) => ({
          value: operator,
          label: OPERATOR_LABELS[operator],
        }))}
      />

      {boolean ? (
        <PSelect
          label="Valor"
          labelHidden
          value={rule.value || "1"}
          onChange={(event) => onChange({ value: event.target.value })}
          options={[
            { value: "1", label: "Sí" },
            { value: "0", label: "No" },
          ]}
        />
      ) : (
        <TextField
          label="Valor"
          labelHidden
          type={isNumericField(rule.field) ? "number" : "text"}
          step={rule.field === "inventory_stock" ? "1" : "0.01"}
          value={rule.value}
          placeholder={isNumericField(rule.field) ? "0" : "Escribe un valor"}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      )}
    </div>
  );
}
