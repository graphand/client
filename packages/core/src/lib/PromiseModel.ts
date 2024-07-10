import { Model } from "@/lib/Model";
import { JSONQuery, ModelInstance } from "@/types";
import { Thenable } from "@/lib/Thenable";
import { isObjectId } from "@/lib/utils";

/**
 * PromiseModel is a class that extends the native Promise class.
 * It is used to return a promise that resolves to a Model instance.
 */
export class PromiseModel<T extends typeof Model> extends Thenable<ModelInstance<T>> {
  #model: typeof Model;
  #query: string | JSONQuery;

  constructor(
    params: ConstructorParameters<typeof Promise<ModelInstance<T>>>,
    model: typeof Model,
    query: string | JSONQuery,
  ) {
    super(params);
    this.#model = model;
    this.#query = query;
  }

  get _id(): string {
    if (typeof this.query === "string" && isObjectId(this.query)) {
      return this.query;
    }

    // @ts-expect-error find _id on any object type
    const foundId: string | undefined = this.query?._id;
    if (isObjectId(foundId)) {
      return foundId;
    }

    return null;
  }

  get model() {
    return this.#model;
  }

  get query() {
    return this.#query;
  }

  [Symbol.toPrimitive](): string {
    return this._id;
  }

  get [Symbol.toStringTag]() {
    return `PromiseModel<${this.model.__name}>(${this._id})`;
  }
}
