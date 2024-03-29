import { Model, defineFieldsProperties } from "@graphand/core";
import type ClientAdapter from "../lib/ClientAdapter";

Model.clearCache = function () {
  const adapter = this.getAdapter() as ClientAdapter;
  adapter.instancesMap.clear();
  adapter.queriesMap.clear();
};

Model.hook("after", "initialize", async function () {
  const adapter = this.getAdapter() as ClientAdapter;
  adapter.instancesMap.forEach(defineFieldsProperties);
});
