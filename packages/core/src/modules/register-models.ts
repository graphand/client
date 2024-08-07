import { Adapter } from "@/lib/Adapter";
import { DataModel } from "@/models/DataModel";
import { Account } from "@/models/Account";
import { Aggregation } from "@/models/Aggregation";
import { AuthProvider } from "@/models/AuthProvider";
import { Connector } from "@/models/Connector";
import { Job } from "@/models/Job";
import { Role } from "@/models/Role";
import { Key } from "@/models/Key";
import { Media } from "@/models/Media";
import { MergeRequest } from "@/models/MergeRequest";
import { MergeRequestEvent } from "@/models/MergeRequestEvent";
import { Token } from "@/models/Token";
import { Invitation } from "@/models/Invitation";
import { Environment } from "@/models/Environment";
import { Settings } from "@/models/Settings";
import { Snapshot } from "@/models/Snapshot";
import { Function } from "@/models/Function";

Adapter.registerModel(Account);
Adapter.registerModel(Aggregation);
Adapter.registerModel(AuthProvider);
Adapter.registerModel(Connector);
Adapter.registerModel(DataModel);
Adapter.registerModel(Environment);
Adapter.registerModel(Invitation);
Adapter.registerModel(Job);
Adapter.registerModel(Key);
Adapter.registerModel(Media);
Adapter.registerModel(MergeRequest);
Adapter.registerModel(MergeRequestEvent);
Adapter.registerModel(Role);
Adapter.registerModel(Settings);
Adapter.registerModel(Snapshot);
Adapter.registerModel(Token);
Adapter.registerModel(Function);
