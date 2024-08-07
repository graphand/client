import { Model } from "@/lib/Model";
import { modelDecorator } from "@/lib/modelDecorator";
import { FieldTypes } from "@/enums/field-types";
import { ValidatorTypes } from "@/enums/validator-types";
import { ModelDefinition } from "@/types";

@modelDecorator()
export class Key extends Model {
  static __name = "Key";
  static slug = "keys" as const;
  static definition = {
    keyField: "name",
    fields: {
      name: { type: FieldTypes.TEXT },
      value: { type: FieldTypes.TEXT },
    },
    validators: [{ type: ValidatorTypes.REQUIRED, options: { field: "value" } }],
  } satisfies ModelDefinition;
}
