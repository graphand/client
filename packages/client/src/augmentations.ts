import { InferModel, Model, ModelInstance, ModelList } from "@graphand/core";
import ClientAdapter from "./lib/ClientAdapter";
import { InferModelFromList, ModelUpdaterEvent, SubjectObserver } from "./types";
import Client from "./lib/Client";

declare module "@graphand/core" {
  export interface Model {
    subscribe: <T extends ModelInstance>(
      this: T,
      observer: SubjectObserver<ModelUpdaterEvent>,
    ) => ReturnType<ClientAdapter<InferModel<T>>["subscribe"]>;
  }

  export namespace Model {
    export function subscribe<T extends typeof Model>(
      this: T,
      observer: SubjectObserver<ModelUpdaterEvent>,
    ): ReturnType<ClientAdapter<T>["subscribe"]>;

    export function clearCache<T extends typeof Model>(this: T): T;

    export function getClient<T extends typeof Model>(this: T): Client;
  }

  export interface ModelList<T extends typeof Model> extends Array<ModelInstance<T>> {
    subscribe: <T extends ModelList<typeof Model>>(
      this: T,
      observer: SubjectObserver<ModelUpdaterEvent>,
      onLoadingChange?: (loading: boolean) => void,
    ) => ReturnType<ClientAdapter<InferModelFromList<T>>["subscribe"]>;
  }
}

Model.subscribe = function <T extends typeof Model>(
  this: T,
  observer: SubjectObserver<ModelUpdaterEvent>,
): ReturnType<ClientAdapter<T>["subscribe"]> {
  const adapter = this.getAdapter() as ClientAdapter<T>;
  return adapter.subscribe(observer);
};

Model.prototype.subscribe = function <T extends ModelInstance>(
  this: T,
  observer: SubjectObserver<ModelUpdaterEvent>,
): ReturnType<ClientAdapter<InferModel<T>>["subscribe"]> {
  const adapter = this.model().getAdapter() as ClientAdapter<InferModel<T>>;
  const _observer: SubjectObserver<ModelUpdaterEvent> = (event: ModelUpdaterEvent) => {
    if (!this._id || !event.ids.includes(this._id)) {
      return;
    }

    observer(event);
  };

  return adapter.subscribe(_observer);
};

ModelList.prototype.subscribe = function <T extends ModelList<typeof Model>>(
  this: T,
  observer: SubjectObserver<ModelUpdaterEvent>,
  onLoadingChange?: (loading: boolean) => void,
): ReturnType<ClientAdapter<InferModelFromList<T>>["subscribe"]> {
  let lastUpdateMetadata: { id?: string; timestamp?: number } = {};

  const handleModelUpdate = async (event: ModelUpdaterEvent) => {
    onLoadingChange?.(true);

    try {
      await this.reload();

      const lastUpdated = this.lastUpdated;
      const lastUpdatedTimestamp = (lastUpdated?._updatedAt ?? lastUpdated?._createdAt)?.getTime();

      if (lastUpdated?._id !== lastUpdateMetadata.id || lastUpdatedTimestamp !== lastUpdateMetadata.timestamp) {
        lastUpdateMetadata = { id: lastUpdated?._id, timestamp: lastUpdatedTimestamp };
        observer(event);
      }
    } finally {
      onLoadingChange?.(false);
    }
  };

  const modelUpdateObserver: SubjectObserver<ModelUpdaterEvent> = (event: ModelUpdaterEvent) => {
    const shouldUpdate =
      ["create", "update"].includes(event.operation) ||
      (event.operation === "delete" && this.some(item => event.ids.includes(String(item._id))));

    if (shouldUpdate) {
      if (event.operation === "delete") {
        // Remove the items from the list
        this.remove(event.ids);
      }
      handleModelUpdate(event);
    }
  };

  const adapter = this.model.getAdapter() as ClientAdapter<InferModelFromList<T>>;
  return adapter.subscribe(modelUpdateObserver);
};

Model.clearCache = function <T extends typeof Model>(this: T): T {
  const adapter = this.getAdapter() as ClientAdapter<T>;
  adapter.clearInstances();
  return this;
};

Model.getClient = function <T extends typeof Model>(this: T): Client {
  const adapter = this.getAdapter() as ClientAdapter<T>;
  return adapter.client;
};
