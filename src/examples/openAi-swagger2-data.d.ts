declare const _default: {
  info: {
    title: string;
    description: string;
    version: string;
  };
  tags: any[];
  paths: {
    [key: string]: {
      [method: string]: {
        summary: string;
        deprecated: boolean;
        description: string;
        tags: any[];
        parameters: {
          name: string;
          in: string;
          schema: {
            type: string;
            properties: {
              [key: string]: {
                type: string;
                description: string;
              };
            };
          };
        }[];
      };
    };
  };
};

export default _default;
