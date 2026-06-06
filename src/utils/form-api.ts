import cloneDeep from "lodash-es/cloneDeep";
import get from "lodash-es/get";
import set from "lodash-es/set";
import unset from "lodash-es/unset";

import type {
  ArrayToStringFields,
  FieldMappingFormatter,
  FieldMappingTime,
  FormSchema,
} from "@/types/admin";

interface ValidationResult {
  errors?: Record<string, unknown>;
  valid: boolean;
}

interface MountedForm {
  reset: () => void;
  setValue: (fieldName: string, value: unknown) => void;
  submit: () => Promise<void> | void;
  validate: () => Promise<ValidationResult> | ValidationResult;
  values: Record<string, unknown>;
}

export interface FormApiOptions {
  arrayToStringFields?: ArrayToStringFields;
  fieldMappingTime?: FieldMappingTime;
  handleSubmit?: (values: Record<string, unknown>) => Promise<void> | void;
  schema?: FormSchema[];
}

export class FormApi {
  private form?: MountedForm;
  private state: FormApiOptions;

  constructor(options: FormApiOptions = {}) {
    this.state = {
      arrayToStringFields: [],
      fieldMappingTime: [],
      schema: [],
      ...options,
    };
  }

  getState() {
    return this.state;
  }

  async getValues() {
    const form = this.getMountedForm();
    const values = cloneDeep(form.values);

    this.applyArrayToString(values);
    this.applyFieldMappingTime(values);
    this.applyValueFormat(values);

    return values;
  }

  mount(form: MountedForm) {
    this.form = form;
  }

  reset() {
    this.getMountedForm().reset();
  }

  async submit() {
    const form = this.getMountedForm();
    const validation = await form.validate();

    if (!validation.valid) {
      return undefined;
    }

    await form.submit();
    const values = await this.getValues();
    await this.state.handleSubmit?.(values);

    return values;
  }

  updateSchema(updates: Partial<FormSchema>[]) {
    if (!updates.every((item) => item.fieldName)) {
      console.error(
        "All items in the schema array must have a valid `fieldName` property to be updated",
      );
      return;
    }

    const updateMap = new Map(updates.map((item) => [item.fieldName, item]));
    const schema = this.state.schema ?? [];

    this.state = {
      ...this.state,
      schema: schema.map((item) => ({ ...item, ...updateMap.get(item.fieldName) })),
    };
  }

  private applyArrayToString(values: Record<string, unknown>) {
    const fields = this.state.arrayToStringFields ?? [];

    fields.forEach((fieldConfig) => {
      if (typeof fieldConfig === "string") {
        this.convertArrayField(values, fieldConfig, ",");
        return;
      }

      const [fieldNames, separator = ","] = fieldConfig;
      fieldNames.forEach((fieldName) => this.convertArrayField(values, fieldName, separator));
    });
  }

  private applyFieldMappingTime(values: Record<string, unknown>) {
    const fields = this.state.fieldMappingTime ?? [];

    fields.forEach(([fieldName, [startField, endField], formatter = "YYYY-MM-DD"]) => {
      const value = get(values, fieldName) as unknown[] | undefined;

      unset(values, fieldName);
      if (!Array.isArray(value)) {
        return;
      }

      set(values, startField, this.formatMappedValue(value[0], startField, formatter));
      set(values, endField, this.formatMappedValue(value[1], endField, formatter));
    });
  }

  private applyValueFormat(values: Record<string, unknown>) {
    const schema = this.state.schema ?? [];

    schema.forEach((field) => {
      if (!field.valueFormat) {
        return;
      }

      const value = get(values, field.fieldName);
      unset(values, field.fieldName);

      const formatted = field.valueFormat(
        value,
        (fieldName, nextValue) => set(values, fieldName, nextValue),
        values,
      );

      if (formatted !== undefined) {
        set(values, field.fieldName, formatted);
      }
    });
  }

  private convertArrayField(values: Record<string, unknown>, fieldName: string, separator: string) {
    const value = get(values, fieldName);

    if (Array.isArray(value)) {
      set(values, fieldName, value.join(separator));
    }
  }

  private formatMappedValue(value: unknown, fieldName: string, formatter: FieldMappingFormatter) {
    if (formatter === null) {
      return value;
    }

    if (typeof formatter === "function") {
      return formatter(value, fieldName);
    }

    if (Array.isArray(formatter)) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return value;
  }

  private getMountedForm() {
    if (!this.form) {
      throw new Error("<VbenForm /> is not mounted");
    }

    return this.form;
  }
}
