import { Media } from "@graphand/core";
import { getClientFromModel } from "../lib/utils";
import { ClientExecutorCtx } from "../types";
import Client from "../lib/Client";

Media.hook("before", "createOne", async (data) => {
  const ctx = data.ctx as ClientExecutorCtx;
  ctx.sendAsFormData = true;
});

Media.hook("before", "createMultiple", async (data) => {
  const ctx = data.ctx as ClientExecutorCtx;
  ctx.sendAsFormData = true;
});

Media.prototype.getUrl = function (opts = {}) {
  const client: Client = getClientFromModel(this.model);
  return client.src(this.name, opts, this.private);
};
