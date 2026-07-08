export type RuntimeEventMap = Record<string, unknown> & {
  "plugin:registered": {
    name: string;
  };

  "plugin:removed": {
    name: string;
  };
};

export type RuntimeEventName = keyof RuntimeEventMap;
