import { Module, symbolModuleInit, symbolModuleDestroy, ClientAdapter, BehaviorSubject } from "@graphand/client";
import { Model, ModelCrudEvent } from "@graphand/core";
import { io, Socket } from "socket.io-client";
import RealtimeUpload from "./lib/RealtimeUpload";

type ModuleRealtimeOptions = {
  connectTimeout?: number;
  subscribeModels?: Array<string>;
  autoSubscribe?: boolean;
  autoConnect?: boolean;
};

class ModuleRealtime extends Module<ModuleRealtimeOptions> {
  static moduleName = "realtime" as const;
  defaults: Partial<ModuleRealtimeOptions> = { connectTimeout: 5000, autoConnect: true };

  #uploadsMap = new Map<string, RealtimeUpload>();
  #subscribedModelsSubject = new BehaviorSubject<Array<string>>([]);
  #unsubscribeModels: (() => void) | undefined;
  #socketSubject = new BehaviorSubject<Socket | undefined>(undefined);
  #connectPromise: Promise<void> | undefined;
  #unsubscribeOptions: (() => void) | undefined;
  #connectTimeout: NodeJS.Timeout | undefined;

  async [symbolModuleInit]() {
    this.#unsubscribeModels = this.#subscribedModelsSubject.subscribe(models => {
      const socket = this.getSocket(false);
      if (socket?.connected) {
        socket.emit("subscribeModels", models.join(","));
      }
    });

    if (this.conf.autoConnect) {
      this.#unsubscribeOptions = this.client().subscribeOptions((options, previousOptions) => {
        // First time initialization
        if (!previousOptions && !options.accessToken) {
          return;
        }

        if (options.accessToken !== previousOptions?.accessToken) {
          if (options.accessToken) {
            this.connect();
          } else {
            this.disconnect();
          }
        }
      });
    }

    if (this.conf.subscribeModels?.length) {
      this.subscribeModels(this.conf.subscribeModels);
    }

    if (this.conf.autoSubscribe) {
      const _module = this;
      const client = this.client();
      const adapterClass = client.getAdapterClass();
      const registerModel = adapterClass.registerModel;
      adapterClass.registerModel = function <T extends typeof Model>(
        this: T,
        ...args: Parameters<typeof registerModel>
      ) {
        const [model] = args;
        if (model?.exposed && model?.slug) {
          _module.subscribeModels([model.slug]);
        }
        registerModel.apply(this, args);
      };
    }
  }

  [symbolModuleDestroy]() {
    this.close();
  }

  get socketSubject() {
    return this.#socketSubject;
  }

  getSubscribedModels(): Array<string> {
    return Array.from(new Set(this.#subscribedModelsSubject.getValue()));
  }

  getSocket(autoConnect: boolean = true): Socket {
    if (autoConnect && !this.#socketSubject.getValue()) {
      this.connect();
    }

    return this.#socketSubject.getValue();
  }

  connect(force: boolean = false) {
    const client = this.client();

    if (!client.options.accessToken) {
      throw new Error("Access token is required to connect to the socket");
    }

    if (this.#connectPromise && !force) {
      return this.#connectPromise;
    }

    this.getSocket(false)?.close();

    const scheme = client.options.ssl ? "wss" : "ws";
    const url = client.getBaseUrl(scheme);

    const socket = io(url, {
      reconnectionDelayMax: 10000,
      rejectUnauthorized: false,
      auth: {
        accessToken: client.options.accessToken,
        project: client.options.project,
      },
    });

    socket.on("realtime:event", (event: ModelCrudEvent) => {
      // The server is not supposed to send events for models that are not subscribed
      // Just an extra check to make sure
      if (!this.#subscribedModelsSubject.getValue().includes(event.model)) {
        return;
      }

      const model = client.getModel(event.model);
      const adapter = model.getAdapter() as ClientAdapter;

      Object.assign(event, { __socketId: socket.id });

      adapter.dispatch(event);
    });

    this.#socketSubject.next(socket);
    this.#connectPromise = new Promise<void>((resolve, reject) => {
      this.#connectTimeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
        this.disconnect();
      }, this.conf.connectTimeout);

      socket.on("connect", () => {
        this.#subscribedModelsSubject.trigger();
        resolve();
      });

      socket.on("connect_error", e => {
        reject(e);
      });
    }).finally(() => {
      this.#connectTimeout && clearTimeout(this.#connectTimeout);
    });

    return this.#connectPromise;
  }

  getUpload(_id: string): RealtimeUpload {
    let upload = this.#uploadsMap.get(_id);

    if (!upload) {
      upload = new RealtimeUpload(this, _id);
      this.#uploadsMap.set(_id, upload);
    }

    this.getSocket();

    return upload;
  }

  subscribeModels(models: Array<string>) {
    const subscribedModels = this.#subscribedModelsSubject.getValue();
    const nextValue = Array.from(new Set([...subscribedModels, ...models]));
    this.#subscribedModelsSubject.next(nextValue);
  }

  disconnect() {
    this.getSocket(false)?.close();
    this.#connectTimeout && clearTimeout(this.#connectTimeout);
    this.#connectPromise = undefined;
  }

  close() {
    this.#unsubscribeModels?.();
    this.#unsubscribeOptions?.();
    this.disconnect();
  }
}

export default ModuleRealtime;
